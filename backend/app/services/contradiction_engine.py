"""
Facade module forwarding to app.ai.contradiction_engine.
"""

from app.ai.contradiction_engine import (
    ContradictionDetectionEngine,
    contradiction_engine,
)

__all__ = ["ContradictionDetectionEngine", "contradiction_engine"]
