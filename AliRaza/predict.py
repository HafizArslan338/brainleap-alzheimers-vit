"""
Predict endpoint - DUMMY VERSION (Week 1-2 stage).

This is just the STRUCTURE for now:
- Accepts an image file upload
- Does basic checks (file type)
- Returns a fake/dummy prediction response

Later (once Arslan's trained model - alzheimer_vit_core.pth - is ready), this file
will actually load the model and run real inference + Grad-CAM instead of returning
dummy data.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png"}


@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Dummy prediction endpoint.
    Real steps (image upload -> validate -> preprocess -> model -> Grad-CAM -> response)
    will be filled in later. Right now it just checks the file type and sends back
    a placeholder response so the frontend/team can start testing against it.
    """

    # Basic validation - only real check done right now
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG or PNG images are allowed.",
        )

    # --- DUMMY response (no real model connected yet) ---
    return {
        "prediction": "Non-Demented",
        "confidence": 0.0,
        "confidence_percentage": "0%",
        "class_probabilities": {
            "Non-Demented": 0.0,
            "Very Mild": 0.0,
            "Mild": 0.0,
            "Moderate": 0.0,
        },
        "gradcam_heatmap": None,
        "note": "DUMMY RESPONSE - real model not connected yet.",
    }
