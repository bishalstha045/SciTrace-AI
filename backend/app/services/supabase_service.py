import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from app.core.config import settings

# In-memory storage fallback for testing and development when live Supabase is unreachable
_in_memory_analyses: Dict[str, Dict[str, Any]] = {}
_in_memory_papers: Dict[str, Dict[str, Any]] = {}
_in_memory_claims: Dict[str, Dict[str, Any]] = {}
_in_memory_relationships: Dict[str, Dict[str, Any]] = {}
_in_memory_pdf_contents: Dict[str, bytes] = {}
_in_memory_paper_pages: Dict[str, List[Dict[str, Any]]] = {}

_supabase_client = None


def get_supabase_client():
    """
    Get or initialize Supabase Python client instance.
    Prefers SUPABASE_SERVICE_ROLE_KEY for server operations, falls back to SUPABASE_KEY.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL:
        return None

    api_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
    if not api_key:
        return None

    try:
        from supabase import create_client
        _supabase_client = create_client(settings.SUPABASE_URL, api_key)
        return _supabase_client
    except Exception as e:
        print(f"Warning: Failed to initialize Supabase client: {e}")
        return None


# Predefined Demo Dataset (Completely Isolated from User DB)
DEMO_ANALYSIS = {
    "id": "demo-analysis",
    "user_id": "demo-system-user",
    "title": "Marine Ecosystems & Climate Change Synthesis",
    "status": "completed",
    "progress": 100,
    "created_at": datetime(2026, 10, 11, 12, 0, 0),
    "updated_at": datetime(2026, 10, 11, 12, 10, 0),
    "papers": [
        {
            "id": "demo-paper-1",
            "analysis_id": "demo-analysis",
            "filename": "Smith_et_al_2023_Climate_Impacts.pdf",
            "storage_path": "demo/Smith_et_al_2023_Climate_Impacts.pdf",
            "file_size": 2450000,
            "page_count": 28,
            "processing_status": "completed",
            "authors": ["Smith, J.", "Davis, R."],
            "year": 2023,
            "is_scanned": False,
        },
        {
            "id": "demo-paper-2",
            "analysis_id": "demo-analysis",
            "filename": "Johnson_et_al_2022_Ocean_Bleaching.pdf",
            "storage_path": "demo/Johnson_et_al_2022_Ocean_Bleaching.pdf",
            "file_size": 1890000,
            "page_count": 19,
            "processing_status": "completed",
            "authors": ["Johnson, M.", "Taylor, E."],
            "year": 2022,
            "is_scanned": False,
        },
    ],
    "claims": [
        {
            "id": "demo-claim-1",
            "paper_id": "demo-paper-1",
            "claim_text": "Rising ocean temperatures directly accelerate coral bleaching severity across tropical reefs.",
            "page_number": 12,
            "source_evidence": "Empirical observation of 42 reef stations between 2018 and 2022 confirmed elevated degree heating weeks.",
            "confidence_score": 94,
        },
        {
            "id": "demo-claim-2",
            "paper_id": "demo-paper-2",
            "claim_text": "Higher sea surface temperatures are significantly associated with coral bleaching events.",
            "page_number": 8,
            "source_evidence": "Multi-basin regression analysis demonstrated an 87% correlation with peak summer anomalies.",
            "confidence_score": 92,
        },
    ],
    "relationships": [
        {
            "id": "demo-rel-1",
            "analysis_id": "demo-analysis",
            "source_claim_id": "demo-claim-1",
            "target_claim_id": "demo-claim-2",
            "classification": "supporting",
            "confidence_score": 93,
            "explanation": "Both studies confirm temperature anomalies as primary causal drivers for thermal reef degradation.",
            "context_differences": ["Global satellite telemetry vs. local reef monitoring"],
        }
    ],
}


class SupabaseService:
    """
    Supabase data access layer enforcing ownership, RLS integrity,
    and private PDF storage.
    """

    @classmethod
    def get_analysis(cls, analysis_id: str, user_id: str) -> Dict[str, Any]:
        """
        Fetch an analysis verifying user ownership.
        Returns demo data if requesting demo analysis.
        """
        # 1. Isolate Demo Dataset
        if analysis_id in ("demo-analysis", "demo"):
            return DEMO_ANALYSIS

        client = get_supabase_client()
        if client:
            try:
                res = (
                    client.table("analyses")
                    .select("*, papers(*)")
                    .eq("id", analysis_id)
                    .execute()
                )
                if not res.data or len(res.data) == 0:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Analysis '{analysis_id}' not found.",
                    )
                record = dict(res.data[0]) if isinstance(res.data[0], dict) else {}
                # Enforce ownership check
                if record.get("user_id") != user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied: You do not have permission to view this analysis.",
                    )
                return record
            except HTTPException:
                raise
            except Exception as e:
                print(f"Supabase query failed, falling back to memory: {e}")

        # In-memory fallback
        if analysis_id not in _in_memory_analyses:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis '{analysis_id}' not found.",
            )
        record = _in_memory_analyses[analysis_id]
        if record["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to view this analysis.",
            )
        # Attach papers
        papers = [p for p in _in_memory_papers.values() if p["analysis_id"] == analysis_id]
        return {**record, "papers": papers}

    @classmethod
    def list_analyses(cls, user_id: str) -> List[Dict[str, Any]]:
        """List all analyses owned by the user."""
        client = get_supabase_client()
        if client:
            try:
                res = (
                    client.table("analyses")
                    .select("*, papers(*)")
                    .eq("user_id", user_id)
                    .order("created_at", desc=True)
                    .execute()
                )
                return [dict(a) for a in res.data if isinstance(a, dict)] if res.data and isinstance(res.data, list) else []
            except Exception as e:
                print(f"Supabase list failed, falling back to memory: {e}")

        user_analyses = [
            {
                **a,
                "papers": [p for p in _in_memory_papers.values() if p["analysis_id"] == a["id"]],
            }
            for a in _in_memory_analyses.values()
            if a["user_id"] == user_id
        ]
        user_analyses.sort(key=lambda x: x["created_at"], reverse=True)
        return user_analyses

    @classmethod
    def create_analysis(cls, user_id: str, title: str = "Untitled Analysis") -> Dict[str, Any]:
        """Create a new analysis for the authenticated user."""
        analysis_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        payload = {
            "id": analysis_id,
            "user_id": user_id,
            "title": title or "Untitled Analysis",
            "status": "processing",
            "progress": 0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }

        client = get_supabase_client()
        if client:
            try:
                res = client.table("analyses").insert(payload).execute()
                if res.data and len(res.data) > 0 and isinstance(res.data[0], dict):
                    return {**dict(res.data[0]), "papers": []}
            except Exception as e:
                print(f"Supabase insert failed, storing in memory: {e}")

        _in_memory_analyses[analysis_id] = {
            **payload,
            "created_at": now,
            "updated_at": now,
        }
        return {**_in_memory_analyses[analysis_id], "papers": []}

    @classmethod
    def update_analysis_status(
        cls, analysis_id: str, user_id: str, status_val: str, progress_val: int
    ) -> Dict[str, Any]:
        """Update analysis status and progress after verifying ownership."""
        cls.get_analysis(analysis_id, user_id)  # Ownership check
        now = datetime.now(timezone.utc)

        client = get_supabase_client()
        if client:
            try:
                res = (
                    client.table("analyses")
                    .update({
                        "status": status_val,
                        "progress": progress_val,
                        "updated_at": now.isoformat(),
                    })
                    .eq("id", analysis_id)
                    .execute()
                )
                if res.data and len(res.data) > 0 and isinstance(res.data[0], dict):
                    return dict(res.data[0])
            except Exception as e:
                print(f"Supabase update failed, updating memory: {e}")

        if analysis_id in _in_memory_analyses:
            _in_memory_analyses[analysis_id]["status"] = status_val
            _in_memory_analyses[analysis_id]["progress"] = progress_val
            _in_memory_analyses[analysis_id]["updated_at"] = now
            return _in_memory_analyses[analysis_id]

        return {"id": analysis_id, "status": status_val, "progress": progress_val}

    @classmethod
    def create_paper_record(
        cls,
        analysis_id: str,
        user_id: str,
        filename: str,
        storage_path: str,
        file_size: int,
        page_count: int,
        processing_status: str = "completed",
        authors: Optional[List[str]] = None,
        year: Optional[int] = None,
        is_scanned: bool = False,
    ) -> Dict[str, Any]:
        """Record paper metadata linked to an analysis."""
        cls.get_analysis(analysis_id, user_id)  # Ownership check

        paper_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        payload = {
            "id": paper_id,
            "analysis_id": analysis_id,
            "filename": filename,
            "storage_path": storage_path,
            "file_size": file_size,
            "page_count": page_count,
            "processing_status": processing_status,
            "authors": authors or [],
            "year": year or now.year,
            "is_scanned": is_scanned,  # Include in DB payload
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }

        client = get_supabase_client()
        if client:
            try:
                res = client.table("papers").insert(payload).execute()
                if res.data and len(res.data) > 0 and isinstance(res.data[0], dict):
                    result = dict(res.data[0])
                    result.setdefault("is_scanned", is_scanned)
                    return result
            except Exception as e:
                print(f"Supabase paper insert failed, storing in memory: {e}")

        _in_memory_papers[paper_id] = {
            **payload,
            "created_at": now,
            "updated_at": now,
        }
        return _in_memory_papers[paper_id]

    @classmethod
    def upload_pdf_storage(
        cls, user_id: str, analysis_id: str, filename: str, content: bytes
    ) -> str:
        """
        Upload file to private Supabase Storage bucket 'papers'.
        Path pattern: {user_id}/{analysis_id}/{filename}
        """
        storage_path = f"{user_id}/{analysis_id}/{filename}"
        client = get_supabase_client()
        if client:
            try:
                client.storage.from_("papers").upload(
                    path=storage_path,
                    file=content,
                    file_options={"content-type": "application/pdf", "upsert": "true"},
                )
                return storage_path
            except Exception as e:
                print(f"Supabase storage upload notice: {e}")
        return storage_path

    @classmethod
    def store_paper_pages(cls, paper_id: str, pages: List[Dict[str, Any]]):
        _in_memory_paper_pages[paper_id] = pages

    @classmethod
    def get_paper_pages(cls, paper_id: str) -> Optional[List[Dict[str, Any]]]:
        return _in_memory_paper_pages.get(paper_id)

    @classmethod
    def store_paper_bytes(cls, paper_id: str, content: bytes):
        _in_memory_pdf_contents[paper_id] = content

    @classmethod
    def get_paper_bytes(cls, paper_id: str) -> Optional[bytes]:
        return _in_memory_pdf_contents.get(paper_id)

    @classmethod
    def get_paper(cls, analysis_id: str, paper_id: str, user_id: str) -> Dict[str, Any]:
        """Fetch paper metadata verifying analysis ownership."""
        cls.get_analysis(analysis_id, user_id)  # Enforce ownership check

        # Check demo data
        if analysis_id in ("demo-analysis", "demo"):
            for p in DEMO_ANALYSIS["papers"]:
                if p["id"] == paper_id:
                    return p
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Paper '{paper_id}' not found in demo analysis.",
            )

        client = get_supabase_client()
        if client:
            try:
                res = client.table("papers").select("*").eq("id", paper_id).eq("analysis_id", analysis_id).execute()
                if res.data and len(res.data) > 0 and isinstance(res.data[0], dict):
                    return dict(res.data[0])
            except Exception as e:
                print(f"Supabase get_paper query: {e}")

        if paper_id in _in_memory_papers:
            p = _in_memory_papers[paper_id]
            if p.get("analysis_id") == analysis_id:
                return p

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paper '{paper_id}' not found in analysis '{analysis_id}'.",
        )

    @classmethod
    def save_claims(
        cls,
        analysis_id: str,
        paper_id: str,
        claims: List[Any],
    ) -> List[Dict[str, Any]]:
        """
        Store extracted claims in Supabase and memory cache.
        Replaces any previously extracted claims for this paper idempotently.
        """
        existing_keys = [k for k, c in _in_memory_claims.items() if c.get("paper_id") == paper_id]
        for k in existing_keys:
            del _in_memory_claims[k]

        saved_records = []
        client = get_supabase_client()

        if client:
            try:
                client.table("claims").delete().eq("paper_id", paper_id).execute()
            except Exception as e:
                print(f"Notice: Supabase claims delete: {e}")

        for claim in claims:
            claim_id = getattr(claim, "id", None) or (claim.get("id") if isinstance(claim, dict) else str(uuid.uuid4()))
            claim_text = getattr(claim, "claim_text", None) or (claim.get("claim_text") if isinstance(claim, dict) else "")
            normalized_text = getattr(claim, "normalized_text", None) or (claim.get("normalized_text") if isinstance(claim, dict) else claim_text)
            page_val = getattr(claim, "page_number", None) or (claim.get("page_number") if isinstance(claim, dict) else 1)
            section_name = getattr(claim, "section_name", None) or (claim.get("section_name") if isinstance(claim, dict) else None)
            source_evidence = getattr(claim, "source_evidence", None) or (claim.get("source_evidence") if isinstance(claim, dict) else None)
            conf_val = getattr(claim, "confidence_score", None) or (claim.get("confidence_score") if isinstance(claim, dict) else 75)
            extraction_method = getattr(claim, "extraction_method", None) or (claim.get("extraction_method") if isinstance(claim, dict) else "scientific_heuristic_v1")
            has_negation = getattr(claim, "has_negation", None) or (claim.get("has_negation") if isinstance(claim, dict) else False)
            has_qualifier = getattr(claim, "has_qualifier", None) or (claim.get("has_qualifier") if isinstance(claim, dict) else False)
            created_at = getattr(claim, "created_at", None) or (claim.get("created_at") if isinstance(claim, dict) else datetime.now(timezone.utc))

            record: Dict[str, Any] = {
                "id": str(claim_id),
                "analysis_id": str(analysis_id),
                "paper_id": str(paper_id),
                "claim_text": str(claim_text),
                "normalized_text": str(normalized_text),
                "page_number": int(page_val) if page_val is not None else 1,
                "section_name": section_name,
                "source_evidence": source_evidence,
                "confidence_score": int(conf_val) if conf_val is not None else 75,
                "extraction_method": str(extraction_method),
                "has_negation": bool(has_negation),
                "has_qualifier": bool(has_qualifier),
                "created_at": created_at.isoformat() if isinstance(created_at, datetime) else str(created_at),
            }

            if client:
                try:
                    res = client.table("claims").insert(record).execute()
                    if res.data and isinstance(res.data, list) and len(res.data) > 0 and isinstance(res.data[0], dict):
                        record = dict(res.data[0])
                except Exception:
                    try:
                        base_record = {
                            "id": str(claim_id),
                            # pyrefly: ignore [unnecessary-type-conversion]
                            "paper_id": str(paper_id),
                            "claim_text": str(claim_text),
                            "page_number": int(page_val) if page_val is not None else 1,
                            "source_evidence": source_evidence,
                        }
                        res = client.table("claims").insert(base_record).execute()
                        if res.data and isinstance(res.data, list) and len(res.data) > 0 and isinstance(res.data[0], dict):
                            record = {**record, **dict(res.data[0])}
                    except Exception as err2:
                        print(f"Supabase claim insert notice: {err2}")

            _in_memory_claims[str(claim_id)] = record
            saved_records.append(record)

        return saved_records

    @classmethod
    def get_claims_by_analysis(cls, analysis_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Retrieve all claims across all papers in an analysis."""
        cls.get_analysis(analysis_id, user_id)

        if analysis_id in ("demo-analysis", "demo"):
            return list(DEMO_ANALYSIS["claims"])

        client = get_supabase_client()
        if client:
            try:
                papers_res = client.table("papers").select("id").eq("analysis_id", analysis_id).execute()
                paper_ids = [str(p["id"]) for p in (papers_res.data or []) if isinstance(p, dict) and "id" in p]
                if paper_ids:
                    claims_res = client.table("claims").select("*").in_("paper_id", paper_ids).order("page_number").execute()
                    if claims_res.data and isinstance(claims_res.data, list):
                        return [dict(c) for c in claims_res.data if isinstance(c, dict)]
            except Exception as e:
                print(f"Supabase get_claims_by_analysis query: {e}")

        paper_ids_set = {str(p["id"]) for p in _in_memory_papers.values() if p.get("analysis_id") == analysis_id}
        claims = [c for c in _in_memory_claims.values() if str(c.get("paper_id")) in paper_ids_set or c.get("analysis_id") == analysis_id]
        return sorted(claims, key=lambda x: (x.get("page_number", 1), x.get("id", "")))

    @classmethod
    def get_claims_by_paper(cls, analysis_id: str, paper_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Retrieve claims belonging to a specific paper."""
        cls.get_paper(analysis_id, paper_id, user_id)

        if analysis_id in ("demo-analysis", "demo"):
            return [c for c in DEMO_ANALYSIS["claims"] if c.get("paper_id") == paper_id]

        client = get_supabase_client()
        if client:
            try:
                claims_res = client.table("claims").select("*").eq("paper_id", paper_id).order("page_number").execute()
                if claims_res.data and isinstance(claims_res.data, list):
                    return [dict(c) for c in claims_res.data if isinstance(c, dict)]
            except Exception as e:
                print(f"Supabase get_claims_by_paper query: {e}")

        claims = [c for c in _in_memory_claims.values() if c.get("paper_id") == paper_id]
        return sorted(claims, key=lambda x: (x.get("page_number", 1), x.get("id", "")))

    @classmethod
    def save_relationships(
        cls,
        analysis_id: str,
        relationships: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Store evaluated cross-paper claim relationships in Supabase and memory cache.
        Prevents duplicate relationships when an analysis job is re-run.
        """
        # 1. Clear previous in-memory relationships for this analysis
        existing_keys = [k for k, r in _in_memory_relationships.items() if r.get("analysis_id") == analysis_id]
        for k in existing_keys:
            del _in_memory_relationships[k]

        client = get_supabase_client()
        if client:
            try:
                client.table("relationships").delete().eq("analysis_id", analysis_id).execute()
            except Exception as e:
                print(f"Notice: Supabase relationships cleanup on rerun: {e}")

        saved_records = []
        for rel in relationships:
            rel_id = str(rel.get("id") or uuid.uuid4())
            analysis_id_str = str(analysis_id)
            source_claim_id = str(rel.get("source_claim_id"))
            target_claim_id = str(rel.get("target_claim_id"))
            classification = str(rel.get("classification", "neutral"))
            conf_val = int(rel.get("confidence_score", 50))
            explanation = rel.get("explanation")
            context_diffs = rel.get("context_differences") or []
            created_at = rel.get("created_at") or datetime.now(timezone.utc).isoformat()

            record: Dict[str, Any] = {
                "id": rel_id,
                "analysis_id": analysis_id_str,
                "source_claim_id": source_claim_id,
                "target_claim_id": target_claim_id,
                "classification": classification,
                "confidence_score": conf_val,
                "explanation": explanation,
                "context_differences": context_diffs,
                "source_paper_id": rel.get("source_paper_id"),
                "target_paper_id": rel.get("target_paper_id"),
                "source_claim_text": rel.get("source_claim_text"),
                "target_claim_text": rel.get("target_claim_text"),
                "source_page_number": rel.get("source_page_number"),
                "target_page_number": rel.get("target_page_number"),
                "similarity_score": rel.get("similarity_score"),
                "nli_scores": rel.get("nli_scores"),
                "model_metadata": rel.get("model_metadata"),
                "created_at": created_at,
            }

            if client:
                try:
                    # Validate UUID fields before inserting to avoid DB type errors
                    def _safe_uuid(val: Any) -> Optional[str]:
                        if not val:
                            return None
                        try:
                            import uuid as _uuid
                            _uuid.UUID(str(val))
                            return str(val)
                        except (ValueError, AttributeError):
                            return None

                    full_insert: Dict[str, Any] = {
                        "id": rel_id,
                        "analysis_id": analysis_id_str,
                        "source_claim_id": source_claim_id,
                        "target_claim_id": target_claim_id,
                        "classification": classification,
                        "confidence_score": conf_val,
                        "explanation": explanation,
                        "context_differences": context_diffs,
                        "similarity_score": rel.get("similarity_score"),
                        "nli_scores": rel.get("nli_scores"),
                        "model_metadata": rel.get("model_metadata"),
                        "source_claim_text": rel.get("source_claim_text"),
                        "target_claim_text": rel.get("target_claim_text"),
                        "source_page_number": rel.get("source_page_number"),
                        "target_page_number": rel.get("target_page_number"),
                    }
                    # Only add UUID paper refs if they are valid UUIDs
                    src_pid = _safe_uuid(rel.get("source_paper_id"))
                    tgt_pid = _safe_uuid(rel.get("target_paper_id"))
                    if src_pid:
                        full_insert["source_paper_id"] = src_pid
                    if tgt_pid:
                        full_insert["target_paper_id"] = tgt_pid

                    client.table("relationships").insert(full_insert).execute()
                except Exception as err1:
                    print(f"Supabase relationship insert notice: {err1}")
                    try:
                        base_insert = {
                            "id": rel_id,
                            "analysis_id": analysis_id_str,
                            "source_claim_id": source_claim_id,
                            "target_claim_id": target_claim_id,
                            "classification": classification,
                            "confidence_score": conf_val,
                            "explanation": explanation,
                            "context_differences": context_diffs,
                        }
                        client.table("relationships").insert(base_insert).execute()
                    except Exception as err2:
                        print(f"Supabase relationship base insert notice: {err2}")

            _in_memory_relationships[rel_id] = record
            saved_records.append(record)

        return saved_records

    @classmethod
    def get_relationships_by_analysis(cls, analysis_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Retrieve all relationships for an analysis, enriched with claim provenance."""
        cls.get_analysis(analysis_id, user_id)

        if analysis_id in ("demo-analysis", "demo"):
            return list(DEMO_ANALYSIS["relationships"])

        client = get_supabase_client()
        raw_rels: List[Dict[str, Any]] = []
        if client:
            try:
                res = client.table("relationships").select("*").eq("analysis_id", analysis_id).execute()
                if res.data and isinstance(res.data, list):
                    raw_rels = [dict(r) for r in res.data if isinstance(r, dict)]
            except Exception as e:
                print(f"Supabase get_relationships_by_analysis query: {e}")

        if not raw_rels:
            raw_rels = [r for r in _in_memory_relationships.values() if r.get("analysis_id") == analysis_id]

        claims_list = cls.get_claims_by_analysis(analysis_id, user_id)
        claims_map = {str(c["id"]): c for c in claims_list if "id" in c}

        enriched = []
        for r in raw_rels:
            rel_copy = dict(r)
            s_claim = claims_map.get(str(r.get("source_claim_id")), {})
            t_claim = claims_map.get(str(r.get("target_claim_id")), {})
            if not rel_copy.get("source_claim_text"):
                rel_copy["source_claim_text"] = s_claim.get("claim_text", "")
            if not rel_copy.get("target_claim_text"):
                rel_copy["target_claim_text"] = t_claim.get("claim_text", "")
            if not rel_copy.get("source_page_number"):
                rel_copy["source_page_number"] = s_claim.get("page_number", 1)
            if not rel_copy.get("target_page_number"):
                rel_copy["target_page_number"] = t_claim.get("page_number", 1)
            if not rel_copy.get("source_paper_id"):
                rel_copy["source_paper_id"] = s_claim.get("paper_id", "")
            if not rel_copy.get("target_paper_id"):
                rel_copy["target_paper_id"] = t_claim.get("paper_id", "")
            enriched.append(rel_copy)

        return enriched

    @classmethod
    def get_analysis_results(cls, analysis_id: str, user_id: str) -> Dict[str, Any]:
        """Fetch analysis results (papers, claims, relationships) with complete evidence provenance."""
        analysis = cls.get_analysis(analysis_id, user_id)
        if analysis_id in ("demo-analysis", "demo"):
            return {
                "analysis": analysis,
                "papers": DEMO_ANALYSIS["papers"],
                "claims": DEMO_ANALYSIS["claims"],
                "relationships": DEMO_ANALYSIS["relationships"],
                "ai_status": "completed",
                "message": "Demo analysis results loaded successfully.",
            }

        client = get_supabase_client()
        claims: List[Dict[str, Any]] = []
        relationships: List[Dict[str, Any]] = []
        papers: List[Dict[str, Any]] = []

        if client:
            try:
                papers_res = client.table("papers").select("*").eq("analysis_id", analysis_id).execute()
                if papers_res.data and isinstance(papers_res.data, list):
                    papers = [dict(p) for p in papers_res.data if isinstance(p, dict)]

                paper_ids = [str(p["id"]) for p in papers if "id" in p]
                if paper_ids:
                    claims_res = client.table("claims").select("*").in_("paper_id", paper_ids).order("page_number").execute()
                    if claims_res.data and isinstance(claims_res.data, list):
                        claims = [dict(c) for c in claims_res.data if isinstance(c, dict)]

                rels_res = client.table("relationships").select("*").eq("analysis_id", analysis_id).execute()
                if rels_res.data and isinstance(rels_res.data, list):
                    relationships = [dict(r) for r in rels_res.data if isinstance(r, dict)]
            except Exception as e:
                print(f"Supabase results query: {e}")

        if not papers:
            papers = [p for p in _in_memory_papers.values() if p["analysis_id"] == analysis_id]
        if not claims:
            paper_ids_set = {str(p["id"]) for p in papers if "id" in p}
            claims = [c for c in _in_memory_claims.values() if str(c.get("paper_id")) in paper_ids_set or c.get("analysis_id") == analysis_id]
        if not relationships:
            relationships = [r for r in _in_memory_relationships.values() if r.get("analysis_id") == analysis_id]

        # Enrich relationships with full claim texts and page references
        claims_map = {str(c["id"]): c for c in claims if "id" in c}
        enriched_relationships = []
        for r in relationships:
            rel_copy = dict(r)
            s_claim = claims_map.get(str(r.get("source_claim_id")), {})
            t_claim = claims_map.get(str(r.get("target_claim_id")), {})
            if not rel_copy.get("source_claim_text"):
                rel_copy["source_claim_text"] = s_claim.get("claim_text", "")
            if not rel_copy.get("target_claim_text"):
                rel_copy["target_claim_text"] = t_claim.get("claim_text", "")
            if not rel_copy.get("source_page_number"):
                rel_copy["source_page_number"] = s_claim.get("page_number", 1)
            if not rel_copy.get("target_page_number"):
                rel_copy["target_page_number"] = t_claim.get("page_number", 1)
            if not rel_copy.get("source_paper_id"):
                rel_copy["source_paper_id"] = s_claim.get("paper_id", "")
            if not rel_copy.get("target_paper_id"):
                rel_copy["target_paper_id"] = t_claim.get("paper_id", "")
            enriched_relationships.append(rel_copy)

        status_val = analysis.get("status", "pending")
        if status_val == "completed":
            ai_status = "completed"
            msg = f"Analysis completed: {len(enriched_relationships)} cross-paper claim relationship(s) evaluated across {len(papers)} paper(s)."
        elif status_val == "failed":
            ai_status = "failed"
            msg = f"Analysis failed: {analysis.get('error', 'Pipeline execution encountered an error.')}"
        elif status_val == "processing":
            ai_status = "processing"
            msg = f"Analysis is currently running ({analysis.get('progress', 0)}% completed)..."
        elif len(enriched_relationships) > 0:
            ai_status = "completed"
            msg = f"Analysis completed: {len(enriched_relationships)} claim relationship(s) identified."
        elif len(claims) > 0:
            ai_status = "claims_extracted"
            msg = f"Extracted {len(claims)} scientific claim(s). Cross-paper similarity and NLI ready to execute."
        else:
            ai_status = "pending"
            msg = "No claims extracted yet. Upload papers and initiate analysis."

        return {
            "analysis": analysis,
            "papers": papers,
            "claims": claims,
            "relationships": enriched_relationships,
            "ai_status": ai_status,
            "message": msg,
        }

    @classmethod
    def delete_analysis(cls, analysis_id: str, user_id: str) -> bool:
        """Delete an analysis and all associated records after verifying ownership."""
        cls.get_analysis(analysis_id, user_id)  # Ownership verification
        if analysis_id in ("demo-analysis", "demo"):
            return False

        client = get_supabase_client()
        if client:
            try:
                client.table("relationships").delete().eq("analysis_id", analysis_id).execute()
                p_res = client.table("papers").select("id").eq("analysis_id", analysis_id).execute()
                p_data = p_res.data if isinstance(p_res.data, list) else []
                p_ids: List[str] = [str(p["id"]) for p in p_data if isinstance(p, dict) and "id" in p]
                if p_ids:
                    client.table("claims").delete().in_("paper_id", p_ids).execute()
                client.table("papers").delete().eq("analysis_id", analysis_id).execute()
                client.table("analyses").delete().eq("id", analysis_id).execute()
            except Exception as e:
                print(f"Supabase delete notice: {e}")

        # Purge in-memory state
        _in_memory_analyses.pop(analysis_id, None)
        p_ids_to_del = [pid for pid, p in _in_memory_papers.items() if p.get("analysis_id") == analysis_id]
        for pid in p_ids_to_del:
            _in_memory_papers.pop(pid, None)
            _in_memory_paper_pages.pop(pid, None)
            _in_memory_pdf_contents.pop(pid, None)
        c_ids_to_del = [cid for cid, c in _in_memory_claims.items() if c.get("analysis_id") == analysis_id or c.get("paper_id") in p_ids_to_del]
        for cid in c_ids_to_del:
            _in_memory_claims.pop(cid, None)
        r_ids_to_del = [rid for rid, r in _in_memory_relationships.items() if r.get("analysis_id") == analysis_id]
        for rid in r_ids_to_del:
            _in_memory_relationships.pop(rid, None)

        return True



supabase_service = SupabaseService()
