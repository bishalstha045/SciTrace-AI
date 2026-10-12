from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class UserContext(BaseModel):
    id: str
    email: Optional[str] = None
    role: str = "authenticated"


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    environment: str
    database_configured: bool
    storage_configured: bool
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AnalysisCreate(BaseModel):
    title: Optional[str] = "Untitled Analysis"


class PaperResponse(BaseModel):
    id: str
    analysis_id: str
    filename: str
    storage_path: str
    file_size: int = 0
    page_count: int = 0
    processing_status: str = "pending"
    authors: List[str] = []
    year: Optional[int] = None
    is_scanned: bool = False
    created_at: Optional[datetime] = None


class AnalysisResponse(BaseModel):
    id: str
    user_id: str
    title: str
    status: str = "processing"
    progress: int = 0
    created_at: datetime
    updated_at: datetime
    papers: Optional[List[PaperResponse]] = []


class ClaimResponse(BaseModel):
    id: str
    paper_id: str
    analysis_id: Optional[str] = None
    claim_text: str
    normalized_text: Optional[str] = None
    page_number: int
    section_name: Optional[str] = None
    source_evidence: Optional[str] = None
    confidence_score: Optional[int] = 75
    extraction_method: Optional[str] = "scientific_heuristic_v1"
    has_negation: Optional[bool] = False
    has_qualifier: Optional[bool] = False
    created_at: Optional[datetime] = None


class ClaimExtractionResponse(BaseModel):
    paper_id: str
    analysis_id: str
    filename: str
    page_count: int
    claims_count: int
    is_scanned: bool
    warning: Optional[str] = None
    claims: List[ClaimResponse] = []


class RelationshipResponse(BaseModel):
    id: str
    analysis_id: str
    source_claim_id: str
    target_claim_id: str
    classification: str  # supporting, contradiction, neutral, related
    confidence_score: int
    explanation: Optional[str] = None
    context_differences: List[str] = []
    source_paper_id: Optional[str] = None
    target_paper_id: Optional[str] = None
    source_claim_text: Optional[str] = None
    target_claim_text: Optional[str] = None
    source_page_number: Optional[int] = None
    target_page_number: Optional[int] = None
    similarity_score: Optional[float] = None
    nli_scores: Optional[Dict[str, float]] = None
    model_metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None


class AnalysisResultsResponse(BaseModel):
    analysis: AnalysisResponse
    papers: List[PaperResponse] = []
    claims: List[ClaimResponse] = []
    relationships: List[RelationshipResponse] = []
    ai_status: str = "pending"
    message: str = "AI Pipeline ready for processing"


class AnalysisRunResponse(BaseModel):
    analysis_id: str
    status: str
    progress: int
    stage: str
    message: str


class PDFPageText(BaseModel):
    page_number: int
    text: str
    char_count: int
    word_count: int


class PDFExtractionResult(BaseModel):
    filename: str
    page_count: int
    total_characters: int
    is_scanned: bool
    warning: Optional[str] = None
    pages: List[PDFPageText] = []
