"""
BrainLeap Clinical Decision Support — FastAPI Backend & Distributed Web UI
Ali's Component Package: FastAPI Backend + Grad-CAM Visualizer + Clinical Web Dashboard
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

import app.routes.health as health
import app.routes.predict as predict
import app.routes.metadata as metadata

app = FastAPI(
    title="BrainLeap Clinical Decision Support API",
    description="FastAPI backend and Clinical Web UI for leakage-aware Alzheimer's dementia staging.",
    version="1.0.0",
)

# Enable CORS for browser framework integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router)
app.include_router(predict.router)
app.include_router(metadata.router)

# Mount static assets directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", include_in_schema=False)
def read_root():
    """Serves the Clinical Web UI Dashboard for browser clients."""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "BrainLeap FastAPI backend is running. (Static index.html not found)"}
