"""
Facade module forwarding to app.db.supabase_service.
"""

from app.db.supabase_service import (
    SupabaseService,
    supabase_service,
    get_supabase_client,
    DEMO_ANALYSIS,
)

SupabaseDataService = SupabaseService

__all__ = [
    "SupabaseService",
    "SupabaseDataService",
    "supabase_service",
    "get_supabase_client",
    "DEMO_ANALYSIS",
]
