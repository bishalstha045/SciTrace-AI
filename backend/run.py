import os
import sys
from pathlib import Path
# pyrefly: ignore [missing-import]
import uvicorn

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.config import settings

if __name__ == "__main__":
    print(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} on {settings.HOST}:{settings.PORT}")
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Documentation: http://localhost:{settings.PORT}/docs")
    print(f"Health Check: http://localhost:{settings.PORT}/health")

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True if settings.ENVIRONMENT == "development" else False,
        app_dir=str(backend_dir),
    )
