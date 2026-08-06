# 🚀 BrainLeap Clinical Dashboard - How To Run

This document explains how to start the BrainLeap system. The application is completely unified, meaning you only need Python to run both the Frontend and Backend!

## 🪟 For Windows Users (Easiest Way)
If you are on Windows, you don't even need to use the terminal manually.

1. Make sure you have **Python** installed on your laptop.
2. Double-click on the **`run.bat`** file inside this folder.
3. A black command prompt window will open. It will automatically create a virtual environment, install all the requirements, and start the server. (It might take 1-2 minutes the very first time).
4. Once the screen says `Uvicorn running on http://127.0.0.1:8000`, open your web browser (Chrome/Edge).
5. Go to the link: **http://127.0.0.1:8000**

---

## 🐧 For Linux / Mac Users
If you are using Linux (Ubuntu) or macOS, `.bat` files do not work. Follow these simple terminal commands instead:

**Step 1:** Open your terminal inside this project folder.

**Step 2:** Create and activate a Python virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

**Step 3:** Install all the required packages:
```bash
pip install -r requirements.txt
```

**Step 4:** Run the application server:
```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

**Step 5:** Open your web browser and go to the link: **http://127.0.0.1:8000**

---
### ⚠️ Important Notes Before Presenting
- **AI Model:** Ensure the `best_alzheimer_vit_v2.pth` file is present in the main folder. Without it, the Vision Transformer will not load.
- **Database:** Ensure the `backend/.env` file is present, as it contains the secure keys to connect to MongoDB Atlas.
- **No Node.js Required:** You do **NOT** need to run `npm run dev` or any React commands. The FastAPI backend automatically serves the compiled frontend.
