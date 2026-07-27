from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    """Health check endpoint to verify backend service readiness."""
    return {
        "status": "ok",
        "service": "BrainLeap Clinical Decision Support API",
        "version": "1.0.0"
    }
