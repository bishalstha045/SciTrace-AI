import threading
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import numpy as np

from app.core.config import settings


@dataclass
class CandidateClaimPair:
    """Represents a pair of claims from different papers exceeding the semantic similarity threshold."""
    source_claim: Dict[str, Any]
    target_claim: Dict[str, Any]
    similarity_score: float


class SemanticSimilarityService:
    """
    Stage 3: Cross-paper Semantic Similarity Matching.
    Uses sentence-transformers/all-MiniLM-L6-v2 to embed scientific claims and
    retrieve candidate claim pairs via cosine similarity without reloading models.
    """

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.SIMILARITY_MODEL_NAME
        self._model = None
        self._lock = threading.Lock()

    def _load_model(self):
        """Thread-safe lazy initialization of SentenceTransformer model."""
        if self._model is None:
            with self._lock:
                if self._model is None:
                    from sentence_transformers import SentenceTransformer
                    self._model = SentenceTransformer(self.model_name)
        return self._model

    @property
    def model(self):
        return self._load_model()

    def compute_similarity(self, text_a: str, text_b: str) -> float:
        """
        Compute cosine similarity between two individual claim strings.
        Returns a float between -1.0 and 1.0 (clamped to 0.0-1.0).
        """
        if not text_a or not text_b:
            return 0.0

        model = self.model
        embeddings = model.encode([text_a, text_b], convert_to_numpy=True, normalize_embeddings=True)
        # Cosine similarity with normalized embeddings is simply dot product
        score = float(np.dot(embeddings[0], embeddings[1]))
        return max(0.0, min(1.0, score))

    def find_candidate_pairs(
        self,
        claims: List[Dict[str, Any]],
        threshold: Optional[float] = None,
        max_pairs: Optional[int] = None,
    ) -> List[CandidateClaimPair]:
        """
        Generate candidate cross-paper claim pairs using cosine similarity.
        Requirements:
        1. Only compares claims originating from different research papers (paper_A != paper_B).
        2. Vectorized batch encoding: encodes all claims once.
        3. Configurable similarity threshold (default from settings).
        4. Caps candidates to prevent quadratic explosion on large analyses.
        5. Preserves full claim provenance (claim ID, paper ID, page number, original text).
        """
        if not claims or len(claims) < 2:
            return []

        # Normalize claims whether passed as Pydantic models, dicts, or objects
        normalized_claims: List[Dict[str, Any]] = []
        for c in claims:
            if hasattr(c, "model_dump"):
                normalized_claims.append(getattr(c, "model_dump")())
            elif isinstance(c, dict):
                normalized_claims.append(dict(c))
            elif hasattr(c, "__dict__"):
                normalized_claims.append(dict(getattr(c, "__dict__")))
            else:
                normalized_claims.append(dict(c))

        sim_threshold = threshold if threshold is not None else settings.SIMILARITY_THRESHOLD
        pair_cap = max_pairs if max_pairs is not None else settings.MAX_CANDIDATE_PAIRS_PER_ANALYSIS

        # Validate that claims come from at least 2 distinct papers
        paper_ids = {str(c.get("paper_id")) for c in normalized_claims if c.get("paper_id")}
        if len(paper_ids) < 2:
            return []

        # Filter out empty or whitespace-only claims while retaining index alignment
        valid_claims: List[Dict[str, Any]] = []
        texts: List[str] = []
        for c in normalized_claims:
            txt = (c.get("claim_text") or c.get("text") or "").strip()
            if txt:
                valid_claims.append(c)
                texts.append(txt)

        if len(valid_claims) < 2:
            return []

        # Vectorized batch encoding (normalized so dot product = cosine similarity)
        model = self.model
        embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)

        n = len(valid_claims)
        candidate_pairs: List[CandidateClaimPair] = []

        # Evaluate upper triangle to prevent redundant (i, j) vs (j, i) pairs
        for i in range(n):
            c_i = valid_claims[i]
            p_i = str(c_i.get("paper_id"))

            for j in range(i + 1, n):
                c_j = valid_claims[j]
                p_j = str(c_j.get("paper_id"))

                # Strict cross-paper requirement: do not compare claims within the same paper
                if p_i == p_j:
                    continue

                # Cosine similarity
                sim = float(np.dot(embeddings[i], embeddings[j]))
                if sim >= sim_threshold:
                    candidate_pairs.append(
                        CandidateClaimPair(
                            source_claim=c_i,
                            target_claim=c_j,
                            similarity_score=round(sim, 4),
                        )
                    )

        # Sort candidate pairs by highest similarity score first
        candidate_pairs.sort(key=lambda p: p.similarity_score, reverse=True)

        # Apply maximum candidates threshold to avoid unbounded NLI inference
        if len(candidate_pairs) > pair_cap:
            candidate_pairs = candidate_pairs[:pair_cap]

        return candidate_pairs


# Singleton instance
similarity_service = SemanticSimilarityService()
