from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from fastapi import APIRouter
from app.core.config import settings
from app.models.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """
    Check backend health status, active environment, and Supabase service readiness.
    """
    db_configured = bool(settings.SUPABASE_URL and (settings.SUPABASE_KEY or settings.SUPABASE_SERVICE_ROLE_KEY))
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database_configured=db_configured,
        storage_configured=db_configured,
        timestamp=datetime.now(timezone.utc),
    )

