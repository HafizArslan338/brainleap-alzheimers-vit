# BrainLeap Clinical Decision Support System (CDS) 🧠

An End-to-End Clinical Decision Support System for Leakage-Aware Dementia Staging using Patient-Isolated Neuroimaging Tensors and Distributed Web UI Frameworks.

## 🌟 Key Features
- **AI-Powered Diagnostics:** Utilizes a Vision Transformer (ViT) model for 4-stage Alzheimer's/Dementia classification (Non-Demented, Very Mild, Mild, Moderate).
- **Grad-CAM Attention Heatmaps:** Explains model predictions by highlighting affected brain regions, enhancing clinical trust.
- **Patient Isolation Hub:** Secure, real-time logging and retrieval of patient analysis history backed by MongoDB Atlas.
- **Medical-Grade UI/UX:** A responsive, glassmorphism-based dashboard with dynamic theme switching (Dark/Light mode) and advanced data visualization (Radar & Bar charts).
- **Secure Authentication:** `bcrypt` password hashing for secure doctor/clinician login.

## 🛠️ Technology Stack
- **Backend:** FastAPI (Python), PyTorch, OpenCV, Motor (Async MongoDB).
- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (No heavy frameworks, ultra-fast loading).
- **Database:** MongoDB Atlas (Cloud).
- **Data Viz:** Chart.js.

## 🚀 Setup & Installation

### 1. Prerequisites
Ensure you have **Python 3.10+** installed on your system.

### 2. Environment Setup
Clone the repository and create a virtual environment:
```bash
git clone https://github.com/HafizArslan338/brainleap-alzheimers-vit.git
cd brainleap-alzheimers-vit
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Database Configuration
Create a `.env` file inside the `backend` folder and add your MongoDB connection string and JWT secret:
```env
MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority"
JWT_SECRET="your_super_secret_jwt_key"
```
*(Note: Never upload your `.env` file to GitHub!)*

### 5. Running the Application
Start the FastAPI server:
```bash
# Ensure you are inside the 'backend' folder
uvicorn main:app --reload
```
Once the server is running, the **Frontend and Backend both** will be served simultaneously by FastAPI!
Open your browser and navigate to:
👉 **http://127.0.0.1:8000**

---
*Developed for advanced clinical neuroimaging analysis and research.*
