"""
BrainLeap Clinical Decision Support - FastAPI Backend
Ali's part: FastAPI + Web deployment for the Alzheimer's classification model.

This is the STARTING skeleton (Week 1-2 stage):
- Basic app that runs
- Routes/endpoints structure set up (health, predict)
- Dummy responses for now (no real model yet - that comes from Arslan later)
"""

from fastapi import FastAPI
#from routes import health, predict
import health
import predict

app = FastAPI(
    title="BrainLeap Clinical Decision Support API",
    description="FastAPI backend for Alzheimer's classification (dummy/skeleton stage)",
    version="0.1.0",
)

# Register route groups
app.include_router(health.router)
app.include_router(predict.router)


@app.get("/")
def read_root():
    """Basic 'hello world' style root endpoint, just to confirm the app is alive."""
    return {"message": "Hello! BrainLeap FastAPI backend is running."}


# Run with: uvicorn main:app --reload
