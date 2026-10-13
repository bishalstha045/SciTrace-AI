"""
SciTrace AI — Database Layer Package
Encapsulates:
- Supabase PostgreSQL Client & RLS Integration
- Private File Storage (papers bucket)
- Resilient Dual-Mode In-Memory Caching for local testing
"""

from app.db.supabase_service import (
    SupabaseService,
    supabase_service,
    get_supabase_client,
    DEMO_ANALYSIS,
)

# Alias for compatibility
SupabaseDataService = SupabaseService

__all__ = [
    "SupabaseService",
    "SupabaseDataService",
    "supabase_service",
    "get_supabase_client",
    "DEMO_ANALYSIS",
]
