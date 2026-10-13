import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field


class ExtractedClaimData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    analysis_id: str
    paper_id: str
    claim_text: str  # Exact original sentence from paper
    normalized_text: str  # Cleaned spacing without altering words/qualifiers
    page_number: int  # 1-indexed page
    section_name: Optional[str] = None  # Reliably detected section (or None)
    source_evidence: Optional[str] = None  # Surrounding text context
    confidence_score: int = 75  # Heuristic confidence (0-100)
    extraction_method: str = "scientific_heuristic_v1"
    has_negation: bool = False
    has_qualifier: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ClaimExtractionResult(BaseModel):
    paper_id: str
    filename: str
    page_count: int
    claims_count: int
    is_scanned: bool
    warning: Optional[str] = None
    claims: List[ExtractedClaimData] = []


class ScientificClaimExtractor:
    """
    Transparent linguistic and rhetorical claim extraction engine for scientific literature.
    Identifies experimental findings, statistical outcomes, conclusions, and causal relations
    while strictly preserving negation, qualifiers, and exact original citations.
    """

    # 1. Linguistic Patterns for Scientific Findings & Outcomes
    FINDING_VERBS = re.compile(
        r"\b(demonstrat(e|es|ed|ing)|show(s|ed|ing)?|indicat(e|es|ed|ing)|"
        r"reveal(s|ed|ing)?|confirm(s|ed|ing)?|observ(e|es|ed|ing)|"
        r"found|find(s|ing)?|exhibit(s|ed|ing)?|yield(s|ed|ing)?|"
        r"identif(y|ies|ied)|determin(e|es|ed|ing)|report(s|ed|ing)?|"
        r"fails? to|failed to|did not)\b",
        re.IGNORECASE,
    )

    # 2. Causation, Association & Directional Effects
    RELATION_PATTERNS = re.compile(
        r"\b(correlat(e|es|ed|ing|ion)|associat(ed|ion|ions)|"
        r"increas(e|es|ed|ing)|decreas(e|es|ed|ing)|reduc(e|es|ed|ing)|"
        r"enhanc(e|es|ed|ing)|promot(e|es|ed|ing)|inhibit(s|ed|ing|ion)|"
        r"trigger(s|ed|ing)?|leads? to|causes?|caused|impact(s|ed)?|"
        r"influenc(e|es|ed|ing)?|modulat(e|es|ed|ing)|alter(s|ed|ing)?|"
        r"affect(s|ed|ing)?|suppress(es|ed|ing)?|prevent(s|ed|ing)?|"
        r"mitigat(e|es|ed|ing)|attenuat(e|es|ed|ing)|exacerbat(e|es|ed|ing)|"
        r"accelerat(e|es|ed|ing))\b",
        re.IGNORECASE,
    )

    # 3. Quantitative & Statistical Outcomes
    STATISTICAL_PATTERNS = re.compile(
        r"(\b(significantly (higher|lower|greater|different|more|less|increased|decreased))|"
        r"\b(compared (to|with)|in comparison with|relative to|greater than|less than)|"
        r"\b(fold increase|fold reduction|two-fold|three-fold)|"
        r"\d+(\.\d+)?\s*%|"
        r"\bp\s*[<>=]\s*0\.\d+|\bp-value|"
        r"95%\s*CI|\bconfidence interval|\bstandard deviation|\b±\s*\d+)",
        re.IGNORECASE,
    )

    # 4. Syntheses, Conclusions & Hypotheses
    CONCLUSION_PATTERNS = re.compile(
        r"\b(we conclude( that)?|these (results|data|findings|observations|patterns) (suggest|demonstrate|indicate|show|imply)|"
        r"in conclusion|taken together|our (results|data|findings|observations) (suggest|demonstrate|show|indicate)|"
        r"provides? (evidence|support) that|we hypothesiz(e|ed)|it is hypothesized that|"
        r"may be attributed to|could account for|suggest(s|ed)? that)\b",
        re.IGNORECASE,
    )

    # 5. Negation Markers (Must be preserved & detected)
    NEGATION_WORDS = re.compile(
        r"\b(not|no|never|none|neither|nor|fails? to|failed to|did not|does not|without|hardly|scarcely)\b",
        re.IGNORECASE,
    )

    # 6. Epistemic Qualifiers & Modals (Must be preserved & detected)
    QUALIFIER_WORDS = re.compile(
        r"\b(may|might|could|suggests?|potential(ly)?|plausible|likely|under these conditions|in this model)\b",
        re.IGNORECASE,
    )

    # 7. Exclusion / Boilerplate Filters
    BOILERPLATE_PATTERNS = re.compile(
        r"(\b(conflict of interest|author contributions?|funding support|grant (number|sponsor)|"
        r"supplementary (material|information)|all rights reserved|permission to reproduce|"
        r"downloaded from|cookie policy|terms of use|ethics approval|informed consent|"
        r"this paper is organized as follows|in section \d|see figure \d|table \d shows)\b|"
        r"^(references|bibliography|acknowledgements?)\b|"
        r"^\[\d+\]\s+[A-Z]|"
        r"\bdoi:\s*10\.\d+)",
        re.IGNORECASE,
    )

    # Section Headers Detector
    SECTION_HEADER_REGEX = re.compile(
        r"^(\d+(\.\d+)*\s*)?(abstract|introduction|background|methods|materials and methods|"
        r"results|experimental results|discussion|conclusions?)\s*$",
        re.IGNORECASE,
    )

    @staticmethod
    def segment_sentences(text: str) -> List[str]:
        """
        Segment academic paragraph text into clean sentence units.
        Handles scientific abbreviations (e.g., 'et al.', 'i.e.', 'p < 0.05') without splitting.
        """
        if not text:
            return []

        # Replace internal linebreaks within sentences with spaces
        clean_text = re.sub(r"\n+", " ", text)
        clean_text = re.sub(r"\s+", " ", clean_text).strip()

        # Protect common scientific abbreviations before splitting
        abbreviations = [
            (r"\bet al\.", "__ETAL__"),
            (r"\be\.g\.,", "__EG__"),
            (r"\bi\.e\.,", "__IE__"),
            (r"\bvs\.", "__VS__"),
            (r"\bFig\.", "__FIG__"),
            (r"\bTab\.", "__TAB__"),
            (r"\bapprox\.", "__APPROX__"),
            (r"\bvol\.", "__VOL__"),
            (r"\bno\.", "__NO__"),
            (r"\bp\s*\.\s*", "__PAGE__"),
            (r"\bpp\s*\.\s*", "__PAGES__"),
            (r"\bRef\.", "__REF__"),
            (r"\bEq\.", "__EQ__"),
            (r"(\d+)\.(\d+)", r"\1__DECIMAL__\2"),  # Preserve 3.14 or p < 0.05
        ]

        protected = clean_text
        for pattern, replacement in abbreviations:
            protected = re.sub(pattern, replacement, protected)

        # Split on sentence terminals: . ! ? followed by space and uppercase letter or EOF
        raw_sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])", protected)

        sentences = []
        for s in raw_sentences:
            # Restore protected abbreviations
            restored = (
                s.replace("__ETAL__", "et al.")
                .replace("__EG__", "e.g.,")
                .replace("__IE__", "i.e.,")
                .replace("__VS__", "vs.")
                .replace("__FIG__", "Fig.")
                .replace("__TAB__", "Tab.")
                .replace("__APPROX__", "approx.")
                .replace("__VOL__", "vol.")
                .replace("__NO__", "no.")
                .replace("__PAGE__", "p. ")
                .replace("__PAGES__", "pp. ")
                .replace("__REF__", "Ref.")
                .replace("__EQ__", "Eq.")
                .replace("__DECIMAL__", ".")
                .strip()
            )
            if restored:
                sentences.append(restored)

        return sentences

    @classmethod
    def evaluate_sentence_claim(
        cls, sentence: str, section_name: Optional[str] = None
    ) -> Tuple[bool, int, str]:
        """
        Evaluate whether a sentence represents a scientific claim.
        Returns: (is_claim: bool, score: int, rationale: str)
        """
        words = sentence.split()
        word_count = len(words)

        # Length constraint: Claims must be substantive sentences
        if word_count < 7 or word_count > 95:
            return False, 0, "Length out of scientific claim bounds"

        # Check for boilerplate or reference citations
        if cls.BOILERPLATE_PATTERNS.search(sentence):
            return False, 0, "Matched boilerplate or bibliographic reference pattern"

        # Check for presence of key scientific semantic patterns
        has_finding = bool(cls.FINDING_VERBS.search(sentence))
        has_relation = bool(cls.RELATION_PATTERNS.search(sentence))
        has_stat = bool(cls.STATISTICAL_PATTERNS.search(sentence))
        has_conclusion = bool(cls.CONCLUSION_PATTERNS.search(sentence))

        # A valid claim must match at least one primary scientific indicator
        match_count = sum([has_finding, has_relation, has_stat, has_conclusion])
        if match_count == 0:
            return False, 0, "Lacks scientific finding or outcome indicators"

        # Calculate heuristic confidence score (65 - 98)
        base_score = 70
        if has_finding:
            base_score += 8
        if has_relation:
            base_score += 8
        if has_stat:
            base_score += 10
        if has_conclusion:
            base_score += 6

        # Favorable section bonus
        if section_name:
            sec_lower = section_name.lower()
            if "result" in sec_lower:
                base_score += 5
            elif "conclusion" in sec_lower or "discussion" in sec_lower:
                base_score += 4
            elif "abstract" in sec_lower:
                base_score += 3
            elif "method" in sec_lower:
                base_score -= 8  # Deprioritize procedural methodology descriptions

        score = min(max(base_score, 60), 98)
        return True, score, "Qualified scientific finding"

    @classmethod
    def extract_claims_from_pages(
        cls,
        analysis_id: str,
        paper_id: str,
        pages_data: List[Dict[str, Any]],
        max_claims_per_paper: int = 40,
    ) -> List[ExtractedClaimData]:
        """
        Extract scientific claims from structured page text.
        Tracks active section names and preserves surrounding sentence evidence.
        """
        claims: List[ExtractedClaimData] = []
        current_section = None

        for page in pages_data:
            page_number = page.get("page_number", 1)
            raw_text = page.get("text", "")
            if not raw_text or not raw_text.strip():
                continue

            # Process text line by line to detect section headers
            lines = raw_text.splitlines()
            buffer_sentences: List[str] = []

            for line in lines:
                stripped_line = line.strip()
                # Check for section header line
                match_sec = cls.SECTION_HEADER_REGEX.match(stripped_line)
                if match_sec:
                    # Found section header
                    clean_sec = match_sec.group(3) if match_sec.group(3) else match_sec.group(0)
                    current_section = clean_sec.capitalize()
                    continue

                buffer_sentences.append(stripped_line)

            full_page_text = " ".join(buffer_sentences)
            sentences = cls.segment_sentences(full_page_text)

            for i, sent in enumerate(sentences):
                is_claim, score, _ = cls.evaluate_sentence_claim(sent, current_section)
                if not is_claim:
                    continue

                # Clean normalization: collapse multiple spaces while preserving words & symbols
                normalized = re.sub(r"\s+", " ", sent).strip()

                # Source evidence context: include preceding and succeeding sentence if available
                context_prev = sentences[i - 1] + " " if i > 0 else ""
                context_next = " " + sentences[i + 1] if i < len(sentences) - 1 else ""
                evidence = (context_prev + sent + context_next).strip()

                has_neg = bool(cls.NEGATION_WORDS.search(sent))
                has_qual = bool(cls.QUALIFIER_WORDS.search(sent))

                claim = ExtractedClaimData(
                    analysis_id=analysis_id,
                    paper_id=paper_id,
                    claim_text=sent,
                    normalized_text=normalized,
                    page_number=page_number,
                    section_name=current_section,
                    source_evidence=evidence,
                    confidence_score=score,
                    extraction_method="scientific_heuristic_v1",
                    has_negation=has_neg,
                    has_qualifier=has_qual,
                )
                claims.append(claim)

                if len(claims) >= max_claims_per_paper:
                    break

            if len(claims) >= max_claims_per_paper:
                break

        return claims


claim_extractor = ScientificClaimExtractor()
