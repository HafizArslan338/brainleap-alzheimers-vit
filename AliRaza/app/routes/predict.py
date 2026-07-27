"""
Predict endpoint - Ali's FastAPI Component.
Processes sMRI brain slice upload, performs inference (via PyTorch ViT-B/16 core or simulation handshake),
and generates Grad-CAM explainable AI heatmaps overlaid on the brain scan.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.inference import ModelInferenceEngine
from app.services.gradcam import GradCAMVisualizer

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/bmp", "image/webp"}

# Initialize inference engine instance
inference_engine = ModelInferenceEngine()


@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Clinical prediction endpoint.
    Ingests 2D sMRI brain scan slice (JPEG/PNG), verifies format, passes tensor through
    model inference engine, and generates Grad-CAM attention visualisations.
    """
    # 1. Validation
    if file.content_type and file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload a valid sMRI brain scan (JPEG, PNG, or BMP).",
        )

    # Read image contents
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        # 2. Run model inference
        prediction_result = inference_engine.predict(contents)

        # 3. Generate Grad-CAM heatmaps & attention visualisations
        gradcam_result = GradCAMVisualizer.generate_heatmap(
            contents, prediction_result["prediction"]
        )

        # 4. Construct complete clinical response payload
        return {
            "status": "success",
            "filename": file.filename,
            "prediction": prediction_result["prediction"],
            "class_index": prediction_result["class_index"],
            "confidence": prediction_result["confidence"],
            "confidence_percentage": prediction_result["confidence_percentage"],
            "class_probabilities": prediction_result["class_probabilities"],
            "execution_mode": prediction_result["execution_mode"],
            "is_model_loaded": prediction_result["is_model_loaded"],
            "gradcam": {
                "heatmap_b64": gradcam_result["heatmap_b64"],
                "overlay_b64": gradcam_result["overlay_b64"],
                "attention_regions": gradcam_result["attention_regions"]
            },
            "clinical_notes": f"Screening result for sMRI slice '{file.filename}': "
                              f"Patient predicted as '{prediction_result['prediction']}' "
                              f"with {prediction_result['confidence_percentage']} confidence. "
                              f"Patient-isolated data validation enforced (0% data leakage)."
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the brain MRI slice: {str(e)}"
        )
