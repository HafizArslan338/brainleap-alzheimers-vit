"""
Health check endpoint.
Simple route to confirm the server is up - useful for testing and monitoring.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    """Returns a simple status - used to check if the API is alive."""
    return {"status": "ok", "service": "BrainLeap Clinical API"}
