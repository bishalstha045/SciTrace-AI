from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "SciTrace AI Backend"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    # Supabase credentials
    SUPABASE_URL: str = Field(default="", description="Supabase project URL")
    SUPABASE_KEY: str = Field(default="", description="Supabase anon or publishable key")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = Field(
        default=None, description="Supabase service role secret"
    )
    SUPABASE_JWT_SECRET: Optional[str] = Field(
        default=None, description="Supabase JWT secret for token verification"
    )

    # File upload constraints
    MAX_FILE_SIZE_BYTES: int = 52428800  # 50 MB
    ALLOWED_FILE_TYPES: List[str] = ["application/pdf"]

    # Testing authentication bypass
    ALLOW_TEST_AUTH: bool = False

    # AI Contradiction Engine Configuration (Step 5)
    SIMILARITY_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    SIMILARITY_THRESHOLD: float = 0.55
    NLI_MODEL_NAME: str = "facebook/bart-large-mnli"
    NLI_CONTRADICTION_THRESHOLD: float = 0.50
    NLI_SUPPORTING_THRESHOLD: float = 0.50
    MAX_CANDIDATE_PAIRS_PER_ANALYSIS: int = 200

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ]

    model_config = {
        "env_file": (".env", "../.env.local", ".env.local"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
