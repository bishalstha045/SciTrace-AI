from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class ExtractedClaim:
    claim_text: str
    paper_id: str
    page_number: int
    source_evidence: str
    confidence_score: float


@dataclass
class ClaimPairSimilarity:
    source_claim: ExtractedClaim
    target_claim: ExtractedClaim
    similarity_score: float


@dataclass
class NLIClassificationResult:
    source_claim: ExtractedClaim
    target_claim: ExtractedClaim
    classification: str  # 'supporting', 'contradiction', 'neutral', 'related'
    confidence: float
    explanation: str
    context_differences: List[str]


class IPDFTextExtractor(ABC):
    """Stage 1: Extract clean text & structure from academic PDF documents"""

    @abstractmethod
    def extract(self, pdf_bytes: bytes, filename: str) -> Dict[str, Any]:
        pass


class IScientificClaimExtractor(ABC):
    """Stage 2: Identify candidate scientific claims and supporting sentence evidence"""

    @abstractmethod
    async def extract_claims(self, paper_id: str, pages_text: List[Dict[str, Any]]) -> List[ExtractedClaim]:
        pass


class ISemanticSimilarityMatcher(ABC):
    """Stage 3: Compute embedding similarities between claims across papers"""

    @abstractmethod
    async def match_candidate_pairs(self, claims: List[ExtractedClaim]) -> List[ClaimPairSimilarity]:
        pass


class INLIClassifier(ABC):
    """Stage 4: Natural Language Inference to detect support or contradiction"""

    @abstractmethod
    async def classify_relationship(self, pair: ClaimPairSimilarity) -> NLIClassificationResult:
        pass


class IEvidenceCitationGenerator(ABC):
    """Stage 5: Generate exact page references, context differences, and citations"""

    @abstractmethod
    async def generate_citations(self, results: List[NLIClassificationResult]) -> List[Dict[str, Any]]:
        pass


class AIPipelineOrchestrator:
    """
    Orchestrates the 6-stage scientific contradiction detection pipeline.
    In Step 5: All core stages (PDF Extraction, Claim Extraction, Semantic Similarity,
    NLI Classification, Evidence Provenance, and Supabase Persistence) are operational.
    """

    def __init__(self):
        self.pipeline_status = "operational"
        self.supported_stages = [
            "pdf_text_extraction",
            "claim_extraction",
            "semantic_similarity",
            "nli_classification",
            "evidence_citation",
            "supabase_persistence",
        ]

    def get_pipeline_info(self) -> Dict[str, Any]:
        return {
            "version": "1.5.0",
            "active_stages": self.supported_stages,
            "pending_stages": [],
            "status": "operational",
            "similarity_model": "sentence-transformers/all-MiniLM-L6-v2",
            "nli_model": "facebook/bart-large-mnli",
            "message": "Full AI contradiction detection and cross-paper NLI pipeline is operational.",
        }


ai_pipeline_orchestrator = AIPipelineOrchestrator()
