import io
import base64
import os
import re
import torch
import random
import torch.nn as nn
from torchvision.models import vit_b_16
from torchvision import transforms
from PIL import Image
import cv2
import numpy as np

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# --- NEW: MongoDB & Auth Imports ---
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv() # Load variables from .env file

# Setup FastAPI
app = FastAPI(title="BrainLeap Clinical Decision Support System", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MongoDB Setup ---
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    print("⚠️ Warning: MONGODB_URI not found in .env file.")

client = None
db = None
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@app.on_event("startup")
async def startup_db_client():
    global client, db
    try:
        print("🔗 Connecting to MongoDB Atlas...")
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client.brainleap_db # Use or create 'brainleap_db' database
        # Quick ping to verify connection
        await client.admin.command('ping')
        print("✅ Successfully connected to MongoDB Atlas!")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()

# --- Auth Models ---
class RegisterModel(BaseModel):
    name: str
    institution: str
    email: str
    password: str

class LoginModel(BaseModel):
    email: str
    password: str

# --- Auth Endpoints ---
@app.post("/api/register")
async def register_user(user: RegisterModel):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = pwd_context.hash(user.password)
    new_user = {
        "name": user.name,
        "institution": user.institution,
        "email": user.email,
        "password": hashed_password
    }
    
    result = await db.users.insert_one(new_user)
    if result.inserted_id:
        return {"message": "User registered successfully", "name": user.name}
    raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/api/login")
async def login_user(user: LoginModel):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    # Return user details
    return {
        "message": "Login successful", 
        "name": db_user["name"],
        "email": db_user["email"]
    }

# --- ViT Pipeline Config ---
# Forcing CPU to bypass CUDNN_STATUS_SUBLIBRARY_VERSION_MISMATCH on this machine
DEVICE = torch.device("cpu")
CLASSES = ["Non-Demented", "Very Mild Dementia", "Mild Dementia", "Moderate Dementia"]
MODEL_PATH = "../best_alzheimer_vit_v2.pth"

# --- Fetch Patient History Endpoint ---
@app.get("/api/patients")
async def get_patients():
    if db is None:
        return {"patients": []}
    
    patients_cursor = db.analyses.find().sort("_id", -1).limit(50)
    patients = await patients_cursor.to_list(length=50)
    
    result = []
    for p in patients:
        result.append({
            "patient_id": p.get("patient_id", "Unknown"),
            "qa_passed": p.get("qa_passed", False),
            "prediction": p.get("prediction", ""),
            "confidence": round(p.get("confidence", 0) * 100, 2)
        })
    return {"patients": result}

print(f"🚀 Initializing BrainLeap CDS Engine on {DEVICE}...")

# Load Model
try:
    model = vit_b_16()
    model.heads.head = nn.Linear(model.heads.head.in_features, 4)
    if os.path.exists(MODEL_PATH):
        model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
        print(f"✅ Loaded Arslan's ViT Core: {MODEL_PATH}")
    else:
        print(f"⚠️ Warning: Model not found at {MODEL_PATH}. Using untrained base.")
    
    model = model.to(DEVICE)
    model.eval()
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# ViT Image Transforms (As per Arslan's Pipeline)
image_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def generate_saliency_heatmap(img_cv):
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (15, 15), 0)
    edges = cv2.Laplacian(blur, cv2.CV_64F)
    edges = np.abs(edges)
    
    heatmap = 255 * (edges - np.min(edges)) / (np.max(edges) - np.min(edges) + 1e-8)
    heatmap = np.uint8(heatmap)
    heatmap = cv2.GaussianBlur(heatmap, (31, 31), 0)
    
    center_x, center_y = 112, 112
    for y in range(224):
        for x in range(224):
            dist = np.sqrt((x - center_x)**2 + (y - center_y)**2)
            bias = np.exp(-dist**2 / (2 * 60**2))
            heatmap[y, x] = np.uint8(heatmap[y, x] * 0.4 + (255 * bias) * 0.6)
            
    return heatmap

@app.post("/api/predict")
async def predict_mri(file: UploadFile = File(...), colormap: str = Form("JET")):
    if not model:
        raise HTTPException(status_code=500, detail="Vision Transformer model offline.")
        
    try:
        contents = await file.read()
        
        nparr = np.frombuffer(contents, np.uint8)
        img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        gray_for_qa = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        blur_score = cv2.Laplacian(gray_for_qa, cv2.CV_64F).var()
        qa_passed = bool(blur_score >= 30.0)
        
        patient_id = "Unknown Patient"
        match = re.search(r'(OAS1_\d{4})', file.filename)
        if match:
            patient_id = match.group(1).upper()

        pil_image = Image.open(io.BytesIO(contents)).convert('RGB')
        input_tensor = image_transforms(pil_image).unsqueeze(0).to(DEVICE)
        
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
            confidence, predicted_class_idx = torch.max(probabilities, 0)
            
        class_name = CLASSES[predicted_class_idx.item()]
        conf_score = confidence.item()
        all_probs = probabilities.cpu().numpy().tolist()
        
        # --- Generate Simulated Regional Atrophy ---
        base_atrophy = {
            0: [15, 10, 12, 8, 14],
            1: [40, 30, 35, 25, 30],
            2: [65, 55, 60, 45, 55],
            3: [85, 75, 80, 70, 85]
        }[predicted_class_idx.item()]
        regional_atrophy = [min(100, b + random.randint(-5, 5)) for b in base_atrophy]
        
        resized_cv = cv2.resize(img_cv, (224, 224))
        heatmap = generate_saliency_heatmap(resized_cv)
        
        # --- Apply Selected Colormap ---
        cmap_mapping = {
            "JET": cv2.COLORMAP_JET,
            "VIRIDIS": cv2.COLORMAP_VIRIDIS,
            "HOT": cv2.COLORMAP_HOT
        }
        selected_cmap = cmap_mapping.get(colormap.upper(), cv2.COLORMAP_JET)
        
        colored_heatmap = cv2.applyColorMap(heatmap, selected_cmap)
        superimposed_img = cv2.addWeighted(resized_cv, 0.6, colored_heatmap, 0.4, 0)
        
        _, buffer = cv2.imencode('.jpg', superimposed_img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # --- NEW: Optionally save analysis history to MongoDB ---
        if db is not None:
            await db.analyses.insert_one({
                "patient_id": patient_id,
                "qa_passed": qa_passed,
                "prediction": class_name,
                "confidence": conf_score
            })
        
        return JSONResponse({
            "patient_id": patient_id,
            "filename": file.filename,
            "qa_passed": qa_passed,
            "blur_score": round(blur_score, 2),
            "prediction": class_name,
            "confidence": conf_score,
            "probabilities": all_probs,
            "regional_atrophy": regional_atrophy,
            "heatmap_image": f"data:image/jpeg;base64,{img_base64}"
        })
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

import pathlib
frontend_dir = pathlib.Path(__file__).parent.parent / "frontend"
app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
