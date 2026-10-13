from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.endpoints import analyses, health
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for SciTrace AI: AI-Based Scientific Literature Contradiction Detection and Evidence Analysis",
)

# CORS Middleware for React/Vite frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expose /health at root level and under /api
app.include_router(health.router)
app.include_router(health.router, prefix=settings.API_PREFIX)

# Expose standard /api prefixed routes
app.include_router(analyses.router, prefix=settings.API_PREFIX)

# Also expose without prefix as convenience alias for direct proxies
app.include_router(analyses.router)


@app.get("/")
def get_root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "health_check": "/health",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Ensure unhandled exceptions return a structured JSON response."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal server error: {str(exc)}"},
    )
