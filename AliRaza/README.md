# 🧠 BrainLeap Clinical Decision Support Suite
**FastAPI Backend + Grad-CAM Visualizer Engine + Distributed Clinical Web Dashboard**  
*Component 4 — MSc Master's Project (UWS)*  
*Student: Ali*

---

## 🌟 Overview
BrainLeap is an end-to-end clinical decision support system for **leakage-aware Alzheimer's dementia staging** using 2D structural MRI (sMRI) brain scans from the OASIS-1 dataset.

### Key Capabilities:
- **FastAPI Production Engine**: Asynchronous web API with validation gates and structured JSON payload endpoints (`/health`, `/predict`, `/metadata`).
- **Explainable AI (Grad-CAM Visualizer)**: Real-time visual heatmaps overlaid on sMRI scans highlighting hippocampal shrinkage and ventricular expansion.
- **Luxury Clinical Web Dashboard**: Modern, responsive Mayo-Clinic inspired interface (`/`) with sMRI upload, quick demo presets, class probability distributions, and interactive opacity sliders.
- **Zero-Downtime Model Handshake**: Operates in validation simulation mode when model weights are pending, and automatically loads PyTorch ViT-B/16 model weights (`alzheimer_vit_core.pth`) once dropped into the root folder.

---

## 💻 How to Transfer & Run on Your Laptop

### 🚀 Option 1: 1-Click Auto Setup (Recommended)
1. Copy the entire `fyp uk` folder (excluding `venv`) to your laptop.
2. Double-click **`setup_and_run.bat`**.
   - It will automatically create the `venv`, install all packages from `requirements.txt`, and launch the app!
3. Open **`http://127.0.0.1:8000`** in your browser.

---

### 🛠️ Option 2: Manual Setup via Terminal
If you prefer running commands manually in PowerShell or Command Prompt:

1. Open PowerShell in the project directory (`fyp uk`).
2. Create virtual environment:
   ```powershell
   python -m venv venv
   ```
3. Install dependencies:
   ```powershell
   .\venv\Scripts\python -m pip install -r requirements.txt
   ```
4. Launch the application:
   ```powershell
   .\venv\Scripts\python run.py
   ```
5. Open browser at **`http://127.0.0.1:8000`**.

---

## 📁 Project Directory Structure
```text
fyp uk/
├── app/
│   ├── routes/
│   │   ├── health.py        # GET /health status check
│   │   ├── predict.py       # POST /predict sMRI upload & Grad-CAM pipeline
│   │   └── metadata.py      # GET /metadata system specs
│   ├── services/
│   │   ├── inference.py     # Model inference engine & simulation fallback
│   │   └── gradcam.py       # Grad-CAM JET heatmap visualization generator
│   ├── static/
│   │   ├── index.html       # Clinical Suite UI template
│   │   ├── style.css        # Luxury medical light-theme styling
│   │   └── app.js           # Interactive frontend application logic
│   └── main.py              # Main FastAPI application factory
├── run.py                   # Python server launcher
├── setup_and_run.bat        # 1-Click Windows setup & start script
├── requirements.txt         # Required Python packages
└── README.md                # Documentation guide
```

---

## 🤝 Model Handshake Protocol (Arslan's Model)
When Arslan finishes training his ViT-B/16 model:
1. Place his exported model file **`alzheimer_vit_core.pth`** directly in the project root folder (`fyp uk/`).
2. Restart the server (`python run.py`).
3. The backend will automatically detect the file and switch from Simulation Mode to Arslan's PyTorch ViT model without any code edits!
