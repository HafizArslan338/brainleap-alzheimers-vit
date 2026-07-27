from fastapi import APIRouter

router = APIRouter()


@router.get("/metadata")
def get_metadata():
    """
    Returns system architecture metadata, data isolation protocol specs,
    and clinical decision support parameters.
    """
    return {
        "project_title": "An End-to-End Clinical Decision Support System for Leakage-Aware Dementia Staging",
        "version": "1.0.0 (Production API Handshake)",
        "pipeline_components": {
            "component_1_regex_parser": "Patient ID Regex Extractor Engine (Muzammil)",
            "component_2_data_isolation": "GroupShuffleSplit 3-Way Leak-Proof Gate (Kashan)",
            "component_3_model_core": "Vision Transformer ViT-B/16 + Focal Loss (Arslan)",
            "component_4_web_deployment": "FastAPI Backend + Grad-CAM Visualizer + Distributed UI (Ali)"
        },
        "model_specifications": {
            "architecture": "Vision Transformer (ViT-B/16)",
            "input_resolution": "224x224x3 (RGB tensor format)",
            "normalization": {"mean": [0.5, 0.5, 0.5], "std": [0.5, 0.5, 0.5]},
            "loss_function": "Multi-Class Focal Loss (alpha=0.25/0.75, gamma=2.0)",
            "target_classes": {
                "0": "Non-Demented (Healthy Control)",
                "1": "Very Mild Dementia",
                "2": "Mild Dementia",
                "3": "Moderate Dementia"
            }
        },
        "data_leakage_guarantee": "Strict Subject-Level Patient Isolation (0% inter-set patient slice overlap)",
        "expected_model_file": "alzheimer_vit_core.pth"
    }
