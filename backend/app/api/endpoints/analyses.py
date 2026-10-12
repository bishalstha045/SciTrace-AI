import csv
import io
from typing import Any, List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse

from app.core.auth import get_current_user
from app.models.schemas import (
    AnalysisCreate,
    AnalysisResponse,
    AnalysisResultsResponse,
    AnalysisRunResponse,
    ClaimExtractionResponse,
    ClaimResponse,
    PaperResponse,
    RelationshipResponse,
    UserContext,
)
from app.services.claim_extractor import claim_extractor
from app.services.contradiction_engine import contradiction_engine
from app.services.pdf_service import PDFValidationError, pdf_service
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/analyses", tags=["Analyses"])


@router.post("", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
def create_analysis(
    payload: Optional[AnalysisCreate] = None,
    current_user: UserContext = Depends(get_current_user),
) -> AnalysisResponse:
    """
    Create a new persistent analysis record for the authenticated user.
    """
    title = payload.title if payload and payload.title else "Untitled Analysis"
    record = supabase_service.create_analysis(user_id=current_user.id, title=title)
    return AnalysisResponse(**record)


@router.get("", response_model=List[AnalysisResponse])
def list_analyses(
    current_user: UserContext = Depends(get_current_user),
) -> List[AnalysisResponse]:
    """
    List all analyses owned by the authenticated user.
    """
    records = supabase_service.list_analyses(user_id=current_user.id)
    return [AnalysisResponse(**r) for r in records]


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(
    analysis_id: str,
    current_user: UserContext = Depends(get_current_user),
) -> AnalysisResponse:
    """
    Fetch analysis details, status, and associated papers.
    Strictly verifies user ownership or returns demo dataset if requesting demo.
    """
    record = supabase_service.get_analysis(analysis_id=analysis_id, user_id=current_user.id)
    return AnalysisResponse(**record)


@router.post("/{analysis_id}/papers", response_model=PaperResponse, status_code=status.HTTP_201_CREATED)
async def upload_paper(
    analysis_id: str,
    file: UploadFile = File(..., description="PDF document to attach and extract"),
    current_user: UserContext = Depends(get_current_user),
) -> PaperResponse:
    """
    Upload and parse a research paper PDF for an analysis.
    Validates magic bytes, extracts text per page using PyMuPDF,
    uploads to private storage, and saves paper metadata.
    """
    # 1. Enforce ownership check on analysis
    analysis = supabase_service.get_analysis(analysis_id=analysis_id, user_id=current_user.id)

    # 2. Read file content into memory
    content = await file.read()
    filename = file.filename or "uploaded_paper.pdf"

    # 3. Validate and extract text using PyMuPDF (fitz)
    try:
        extraction = pdf_service.extract_text(content=content, filename=filename)
    except PDFValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error processing PDF '{filename}': {str(e)}",
        )

    # 4. Upload to private Supabase Storage ({user_id}/{analysis_id}/{filename})
    storage_path = supabase_service.upload_pdf_storage(
        user_id=current_user.id,
        analysis_id=analysis_id,
        filename=filename,
        content=content,
    )

    # 5. Persist paper metadata
    paper_record = supabase_service.create_paper_record(
        analysis_id=analysis_id,
        user_id=current_user.id,
        filename=filename,
        storage_path=storage_path,
        file_size=len(content),
        page_count=extraction.page_count,
        processing_status="completed",
        is_scanned=extraction.is_scanned,
    )
    paper_id = paper_record["id"]

    # 6. Cache extracted page text and raw content
    pages_dicts = [p.model_dump() for p in extraction.pages]
    supabase_service.store_paper_bytes(paper_id, content)
    supabase_service.store_paper_pages(paper_id, pages_dicts)

    # 7. Automatically extract and persist claims if paper has text
    if not extraction.is_scanned and len(pages_dicts) > 0:
        claims = claim_extractor.extract_claims_from_pages(
            analysis_id=analysis_id,
            paper_id=paper_id,
            pages_data=pages_dicts,
        )
        supabase_service.save_claims(analysis_id=analysis_id, paper_id=paper_id, claims=claims)

    return PaperResponse(**paper_record)


@router.post(
    "/{analysis_id}/papers/{paper_id}/extract-claims",
    response_model=ClaimExtractionResponse,
)
def extract_paper_claims(
    analysis_id: str,
    paper_id: str,
    current_user: UserContext = Depends(get_current_user),
) -> ClaimExtractionResponse:
    """
    Trigger scientific claim extraction for a specific uploaded paper.
    Evaluates segmented sentences against scientific findings, statistical evidence,
    and conclusions while preserving negations, qualifiers, and exact page numbers.
    """
    # 1. Enforce ownership and check paper existence
    paper = supabase_service.get_paper(analysis_id=analysis_id, paper_id=paper_id, user_id=current_user.id)

    # 2. Check if scanned / image-only
    if paper.get("is_scanned", False):
        return ClaimExtractionResponse(
            paper_id=paper_id,
            analysis_id=analysis_id,
            filename=paper.get("filename", ""),
            page_count=paper.get("page_count", 0),
            claims_count=0,
            is_scanned=True,
            warning="Scanned or image-only PDF detected. OCR is required to extract claims from this document.",
            claims=[],
        )

    # 3. Retrieve page text
    pages = supabase_service.get_paper_pages(paper_id)
    if not pages:
        pdf_bytes = supabase_service.get_paper_bytes(paper_id)
        if pdf_bytes:
            extraction = pdf_service.extract_text(pdf_bytes, paper.get("filename", "document.pdf"))
            pages = [p.model_dump() for p in extraction.pages]
            supabase_service.store_paper_pages(paper_id, pages)
        else:
            pages = []

    # 4. Extract claims
    extracted = claim_extractor.extract_claims_from_pages(
        analysis_id=analysis_id,
        paper_id=paper_id,
        pages_data=pages,
    )

    # 5. Save claims
    saved = supabase_service.save_claims(analysis_id=analysis_id, paper_id=paper_id, claims=extracted)

    warning_msg = None
    if len(saved) == 0:
        warning_msg = "No candidate scientific claims identified matching rhetorical and empirical criteria."

    return ClaimExtractionResponse(
        paper_id=paper_id,
        analysis_id=analysis_id,
        filename=paper.get("filename", ""),
        page_count=paper.get("page_count", len(pages)),
        claims_count=len(saved),
        is_scanned=False,
        warning=warning_msg,
        claims=[ClaimResponse(**c) for c in saved],
    )


@router.get("/{analysis_id}/claims", response_model=List[ClaimResponse])
def get_analysis_claims(
    analysis_id: str,
    current_user: UserContext = Depends(get_current_user),
) -> List[ClaimResponse]:
    """
    Retrieve all candidate scientific claims across all papers in the specified analysis.
    """
    records = supabase_service.get_claims_by_analysis(analysis_id=analysis_id, user_id=current_user.id)
    return [ClaimResponse(**r) for r in records]


@router.get("/{analysis_id}/papers/{paper_id}/claims", response_model=List[ClaimResponse])
def get_paper_claims(
    analysis_id: str,
    paper_id: str,
    current_user: UserContext = Depends(get_current_user),
) -> List[ClaimResponse]:
    """
    Retrieve candidate scientific claims extracted for a specific paper.
    """
    records = supabase_service.get_claims_by_paper(analysis_id=analysis_id, paper_id=paper_id, user_id=current_user.id)
    return [ClaimResponse(**r) for r in records]


@router.post("/{analysis_id}/run", response_model=AnalysisRunResponse)
def run_analysis(
    analysis_id: str,
    background_tasks: BackgroundTasks,
    sync: bool = False,
    current_user: UserContext = Depends(get_current_user),
) -> AnalysisRunResponse:
    """
    Initiate the complete 6-stage scientific contradiction detection workflow.
    Validates attached papers, executes text & claim extraction, performs cross-paper
    semantic similarity filtering, and evaluates candidate pairs with BART-large-MNLI.
    """
    analysis = supabase_service.get_analysis(analysis_id=analysis_id, user_id=current_user.id)
    papers = analysis.get("papers", [])

    if len(papers) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot run analysis: At least 1 paper (preferably 2 or more) must be uploaded.",
        )

    # If requested synchronously (e.g. for testing or direct execution)
    if sync:
        res = contradiction_engine.run_pipeline(analysis_id=analysis_id, user_id=current_user.id)
        if res.get("status") == "failed":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Analysis pipeline failed: {res.get('error')}",
            )
        return AnalysisRunResponse(
            analysis_id=analysis_id,
            status="completed",
            progress=100,
            stage="completed",
            message=res.get("message", "Contradiction detection analysis completed successfully."),
        )

    # Queue background task
    supabase_service.update_analysis_status(
        analysis_id=analysis_id,
        user_id=current_user.id,
        status_val="processing",
        progress_val=25,
    )

    background_tasks.add_task(
        contradiction_engine.run_pipeline,
        analysis_id=analysis_id,
        user_id=current_user.id,
    )

    return AnalysisRunResponse(
        analysis_id=analysis_id,
        status="processing",
        progress=25,
        stage="ai_pipeline_started",
        message=f"Contradiction detection pipeline initiated for {len(papers)} paper(s). Running in background.",
    )


@router.get("/{analysis_id}/relationships", response_model=List[RelationshipResponse])
def get_analysis_relationships(
    analysis_id: str,
    current_user: UserContext = Depends(get_current_user),
) -> List[RelationshipResponse]:
    """
    Retrieve candidate scientific relationships (supporting, contradiction, neutral)
    with full evidence provenance.
    """
    records = supabase_service.get_relationships_by_analysis(analysis_id=analysis_id, user_id=current_user.id)
    return [RelationshipResponse(**r) for r in records]


@router.get("/{analysis_id}/results", response_model=AnalysisResultsResponse)
def get_analysis_results(
    analysis_id: str,
    current_user: UserContext = Depends(get_current_user),
) -> AnalysisResultsResponse:
    """
    Return stored claims, relationships, and metadata for an analysis.
    Returns honest 'pending' status if AI contradiction detection has not yet run.
    """
    results = supabase_service.get_analysis_results(analysis_id=analysis_id, user_id=current_user.id)
    return AnalysisResultsResponse(**results)


def sanitize_csv_field(val: Any) -> str:
    """
    Escape spreadsheet formula injection characters (=, +, -, @, tab, newline).
    Prepends a single quote if the value begins with a formula trigger character.
    """
    if val is None:
        return ""
    s = str(val).strip()
    if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{s}"
    return s


@router.delete("/{analysis_id}", status_code=status.HTTP_200_OK)
def delete_analysis(
    analysis_id: str,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Delete an analysis and associated records. Enforces strict ownership check.
    """
    success = supabase_service.delete_analysis(analysis_id=analysis_id, user_id=current_user.id)
    return {"id": analysis_id, "deleted": success}


@router.get("/{analysis_id}/export")
def export_analysis_csv(
    analysis_id: str,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Generate a downloadable CSV containing actual saved claims and relationships.
    Enforces user ownership, escapes CSV fields, and protects against formula injection.
    """
    results = supabase_service.get_analysis_results(analysis_id=analysis_id, user_id=current_user.id)
    relationships = results.get("relationships", [])
    claims_map = {str(c.get("id")): c for c in results.get("claims", [])}
    papers_map = {
        str(p.get("id")): p.get("filename") or p.get("title") or "Unknown Document"
        for p in results.get("papers", [])
    }

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Write CSV Header with all Step 6 required attributes
    writer.writerow([
        "Analysis ID",
        "Relationship ID",
        "Relationship Category (Classification)",
        "Paper A",
        "Source Page A",
        "Claim A",
        "Paper B",
        "Target Page B",
        "Claim B",
        "Semantic Similarity Score",
        "Confidence Score (%)",
        "NLI Contradiction Score",
        "NLI Entailment Score",
        "NLI Neutral Score",
        "Classification Model",
        "Similarity Model",
        "Explanation",
        "Context Differences",
    ])


    # Write CSV Rows
    for rel in relationships:
        s_claim = claims_map.get(str(rel.get("source_claim_id")), {})
        t_claim = claims_map.get(str(rel.get("target_claim_id")), {})

        paper_a_id = str(rel.get("source_paper_id") or s_claim.get("paper_id") or "")
        paper_b_id = str(rel.get("target_paper_id") or t_claim.get("paper_id") or "")

        paper_a_name = papers_map.get(paper_a_id, "Paper A")
        paper_b_name = papers_map.get(paper_b_id, "Paper B")

        claim_a_text = rel.get("source_claim_text") or s_claim.get("claim_text") or "N/A"
        claim_b_text = rel.get("target_claim_text") or t_claim.get("claim_text") or "N/A"

        page_a = rel.get("source_page_number") or s_claim.get("page_number") or "N/A"
        page_b = rel.get("target_page_number") or t_claim.get("page_number") or "N/A"

        nli_scores = rel.get("nli_scores") or {}
        model_meta = rel.get("model_metadata") or {}

        sim_score = rel.get("similarity_score")
        sim_score_str = f"{sim_score:.4f}" if isinstance(sim_score, (int, float)) else "N/A"

        contra_score = nli_scores.get("contradiction")
        contra_str = f"{contra_score:.4f}" if isinstance(contra_score, (int, float)) else "N/A"

        entail_score = nli_scores.get("entailment")
        entail_str = f"{entail_score:.4f}" if isinstance(entail_score, (int, float)) else "N/A"

        neutral_score = nli_scores.get("neutral")
        neutral_str = f"{neutral_score:.4f}" if isinstance(neutral_score, (int, float)) else "N/A"

        class_model = model_meta.get("model_name", "facebook/bart-large-mnli")
        sim_model = model_meta.get("similarity_model", "sentence-transformers/all-MiniLM-L6-v2")

        diffs = "; ".join(rel.get("context_differences", []))

        row = [
            sanitize_csv_field(analysis_id),
            sanitize_csv_field(rel.get("id")),
            sanitize_csv_field(rel.get("classification")),
            sanitize_csv_field(paper_a_name),
            sanitize_csv_field(page_a),
            sanitize_csv_field(claim_a_text),
            sanitize_csv_field(paper_b_name),
            sanitize_csv_field(page_b),
            sanitize_csv_field(claim_b_text),
            sanitize_csv_field(sim_score_str),
            sanitize_csv_field(rel.get("confidence_score")),
            sanitize_csv_field(contra_str),
            sanitize_csv_field(entail_str),
            sanitize_csv_field(neutral_str),
            sanitize_csv_field(class_model),
            sanitize_csv_field(sim_model),
            sanitize_csv_field(rel.get("explanation", "")),
            sanitize_csv_field(diffs),
        ]
        writer.writerow(row)

    output.seek(0)
    filename = f"scitrace_analysis_{analysis_id}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

