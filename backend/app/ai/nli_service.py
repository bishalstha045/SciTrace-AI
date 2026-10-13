import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import torch
from app.core.config import settings


class NLIClassificationService:
    """
    Stage 4: Natural Language Inference (NLI) Relationship Classification.
    Uses facebook/bart-large-mnli to evaluate premise-hypothesis relationships
    between paired scientific claims from different research papers.

    Traceability:
    - Inspects model.config.label2id / id2label dynamically (no hardcoded index assumptions).
    - Evaluates forward and reverse claim directions to handle entailment asymmetry.
    - Preserves raw softmax probabilities, classification thresholds, and model metadata.
    """

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.NLI_MODEL_NAME
        self._tokenizer = None
        self._model = None
        self._device = None
        self._lock = threading.Lock()
        self._label_indices: Dict[str, int] = {}

    def _load_model(self):
        """Thread-safe lazy initialization of BART-large-MNLI model and tokenizer."""
        if self._model is None or self._tokenizer is None:
            with self._lock:
                if self._model is None or self._tokenizer is None:
                    from transformers import AutoModelForSequenceClassification, AutoTokenizer

                    # Determine optimal device (mps for Apple Silicon if available, otherwise cpu)
                    if torch.backends.mps.is_available():
                        self._device = torch.device("mps")
                    elif torch.cuda.is_available():
                        self._device = torch.device("cuda")
                    else:
                        self._device = torch.device("cpu")

                    self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                    self._model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
                    self._model.to(self._device)
                    self._model.eval()

                    # Dynamic label index resolution from model configuration
                    raw_label2id = getattr(self._model.config, "label2id", {}) or {}
                    norm_label2id = {str(k).lower(): int(v) for k, v in raw_label2id.items()}

                    self._label_indices = {
                        "contradiction": norm_label2id.get("contradiction", 0),
                        "neutral": norm_label2id.get("neutral", 1),
                        "entailment": norm_label2id.get("entailment", 2),
                    }

        return self._tokenizer, self._model, self._device

    @property
    def label_indices(self) -> Dict[str, int]:
        self._load_model()
        return self._label_indices

    def evaluate_pair_raw(self, premise: str, hypothesis: str) -> Dict[str, float]:
        """
        Evaluate raw NLI probabilities with premise and hypothesis.
        Returns dictionary with softmax probabilities for contradiction, neutral, entailment.
        """
        tokenizer, model, device = self._load_model()
        indices = self._label_indices

        inputs = tokenizer(
            premise,
            hypothesis,
            truncation=True,
            max_length=512,
            return_tensors="pt",
        ).to(device)

        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)[0]

        return {
            "contradiction": round(float(probs[indices["contradiction"]].item()), 4),
            "neutral": round(float(probs[indices["neutral"]].item()), 4),
            "entailment": round(float(probs[indices["entailment"]].item()), 4),
        }

    def classify_claim_pair(
        self,
        analysis_id: str,
        source_claim: Dict[str, Any],
        target_claim: Dict[str, Any],
        similarity_score: float,
    ) -> Dict[str, Any]:
        """
        Classifies the scientific relationship between two cross-paper claims.
        - Evaluates both forward (claim1 -> claim2) and reverse (claim2 -> claim1) directions.
        - Maps entailment to 'supporting', contradiction to 'contradiction', otherwise 'neutral'.
        - Preserves uncertainty: if scores are borderline or ambiguous, categorizes as 'neutral'.
        - Compiles full provenance and evidence citations.
        """
        claim_1_text = (source_claim.get("claim_text") or source_claim.get("text") or "").strip()
        claim_2_text = (target_claim.get("claim_text") or target_claim.get("text") or "").strip()

        if not claim_1_text or not claim_2_text:
            return {
                "id": str(uuid.uuid4()),
                "analysis_id": analysis_id,
                "source_claim_id": str(source_claim.get("id")),
                "target_claim_id": str(target_claim.get("id")),
                "classification": "neutral",
                "confidence_score": 50,
                "explanation": "Insufficient claim text for NLI evaluation.",
                "context_differences": [],
                "similarity_score": similarity_score,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }

        # 1. Evaluate forward direction (Premise: claim 1, Hypothesis: claim 2)
        forward_scores = self.evaluate_pair_raw(premise=claim_1_text, hypothesis=claim_2_text)

        # 2. Evaluate reverse direction (Premise: claim 2, Hypothesis: claim 1)
        reverse_scores = self.evaluate_pair_raw(premise=claim_2_text, hypothesis=claim_1_text)

        # Symmetric evaluation for contradiction; max direction for entailment
        p_contra = max(forward_scores["contradiction"], reverse_scores["contradiction"])
        p_entail = max(forward_scores["entailment"], reverse_scores["entailment"])
        p_neutral = (forward_scores["neutral"] + reverse_scores["neutral"]) / 2.0

        contra_thresh = settings.NLI_CONTRADICTION_THRESHOLD
        supp_thresh = settings.NLI_SUPPORTING_THRESHOLD

        # 3. Scientific Categorization & Uncertainty Preservation
        # Check contradiction first
        if p_contra >= contra_thresh and p_contra > p_entail and p_contra > p_neutral:
            classification = "contradiction"
            confidence_score = int(round(p_contra * 100))
            explanation = (
                f"Potential scientific contradiction detected (NLI contradiction score: {p_contra:.1%}). "
                f"The findings present conflicting or opposing assertions on related topics."
            )
        # Check supporting (entailment)
        elif p_entail >= supp_thresh and p_entail > p_contra and p_entail > p_neutral:
            classification = "supporting"
            confidence_score = int(round(p_entail * 100))
            explanation = (
                f"Supporting scientific relationship identified (NLI entailment score: {p_entail:.1%}). "
                f"The claims corroborate or provide consistent empirical support for each other."
            )
        else:
            classification = "neutral"
            confidence_score = int(round(max(p_neutral, 0.50) * 100))
            explanation = (
                f"Neutral or inconclusive relationship (neutral score: {p_neutral:.1%}). "
                f"While the claims share semantic similarity ({similarity_score:.1%}), the findings do not demonstrate decisive mutual contradiction or support."
            )

        # Context differences grounded note (honest limitation representation)
        context_diffs = [
            "Methodology differences (study cohort, sample size, or measurement conditions) require full-text methodology extraction (scheduled for future release)."
        ]

        relationship_id = str(uuid.uuid4())
        created_at_iso = datetime.now(timezone.utc).isoformat()

        return {
            "id": relationship_id,
            "analysis_id": str(analysis_id),
            "source_claim_id": str(source_claim.get("id")),
            "target_claim_id": str(target_claim.get("id")),
            "classification": classification,
            "confidence_score": confidence_score,
            "explanation": explanation,
            "context_differences": context_diffs,
            # Complete Evidence & Provenance attributes (Requirement E)
            "source_paper_id": str(source_claim.get("paper_id")),
            "target_paper_id": str(target_claim.get("paper_id")),
            "source_claim_text": claim_1_text,
            "target_claim_text": claim_2_text,
            "source_page_number": int(source_claim.get("page_number", 1)),
            "target_page_number": int(target_claim.get("page_number", 1)),
            "similarity_score": round(float(similarity_score), 4),
            "nli_scores": {
                "contradiction": round(float(p_contra), 4),
                "entailment": round(float(p_entail), 4),
                "neutral": round(float(p_neutral), 4),
                "forward_contradiction": forward_scores["contradiction"],
                "forward_entailment": forward_scores["entailment"],
                "reverse_contradiction": reverse_scores["contradiction"],
                "reverse_entailment": reverse_scores["entailment"],
            },
            "model_metadata": {
                "model_name": self.model_name,
                "similarity_model": settings.SIMILARITY_MODEL_NAME,
                "device": str(self._device),
                "label_indices": self._label_indices,
                "contradiction_threshold": contra_thresh,
                "supporting_threshold": supp_thresh,
                "evaluated_at": created_at_iso,
            },
            "created_at": created_at_iso,
        }


# Singleton instance
nli_service = NLIClassificationService()
