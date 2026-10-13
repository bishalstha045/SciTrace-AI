# SciTrace AI — FastAPI Backend

**AI-Based Scientific Literature Contradiction Detection and Evidence Analysis**

This backend provides the RESTful API for SciTrace AI, managing academic PDF ingestion, text extraction via PyMuPDF, Supabase database and private storage operations, and orchestrating the AI analysis pipeline.

---

## 1. Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   └── endpoints/
│   │       ├── analyses.py     # Analyses CRUD, PDF upload, execution, CSV export
│   │       └── health.py       # Health check status endpoint
│   ├── core/
│   │   ├── auth.py             # Supabase Bearer JWT authentication & validation
│   │   └── config.py           # Application settings and environment variables
│   ├── models/
│   │   └── schemas.py          # Pydantic request and response models
│   ├── services/
│   │   ├── pdf_service.py          # PyMuPDF text extractor and PDF validator
│   │   ├── claim_extractor.py      # Scientific claim extraction & abbreviation preservation
│   │   ├── similarity_service.py   # Sentence-Transformers embeddings & cosine filtering
│   │   ├── nli_service.py          # BART-large-MNLI bidirectional inference & label mapping
│   │   ├── contradiction_engine.py # 6-stage scientific contradiction analysis orchestration
│   │   └── supabase_service.py     # Supabase database & storage client with resilient cache
│   └── main.py                     # FastAPI application, middleware, CORS
├── tests/
│   ├── conftest.py                 # Pytest fixtures, test users, and test PDFs
│   ├── test_analyses_api.py        # API tests for CRUD, uploads, and permissions
│   ├── test_health.py              # Health check tests
│   ├── test_pdf_service.py         # PyMuPDF extraction, magic bytes, and scanned PDF tests
│   ├── test_claim_extraction.py    # Claim extraction, qualifiers, and abbreviation tests
│   ├── test_similarity_service.py  # Embedding generation and pair filtering tests
│   ├── test_nli_service.py         # Dynamic label indices and inference classification tests
│   ├── test_contradiction_engine.py# End-to-end 6-stage pipeline & idempotency tests
│   └── test_evaluation_benchmark.py# Scientific benchmark evaluation tests
├── .env.example                # Environment variables template
├── requirements.txt            # Python dependencies
├── run.py                      # Development server runner
└── README.md                   # This documentation
```

---

## 2. Windows Setup & Run Instructions

### Prerequisites
- Python 3.10+ installed ([python.org](https://www.python.org/downloads/)).
- When installing Python on Windows, **check "Add python.exe to PATH"**.

### Step 1: Open Terminal in the `backend` folder
Using **PowerShell** or **Command Prompt**:
```powershell
cd "path\to\your\project\backend"
```

### Step 2: Create a Virtual Environment
```powershell
python -m venv venv
```

### Step 3: Activate the Virtual Environment
- **PowerShell:**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
  *(If you get a script execution policy error, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*
- **Command Prompt (CMD):**
  ```cmd
  venv\Scripts\activate.bat
  ```

### Step 4: Install Dependencies
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 5: Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
copy .env.example .env
```
Open `.env` and fill in your Supabase project URL and keys.

### Step 6: Start the Server
```powershell
python run.py
```
Or directly with Uvicorn:
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The interactive OpenAPI documentation will be accessible at:
- **Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/health`

---

## 3. macOS / Linux Setup & Run Instructions

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
python run.py
```

---

## 4. Environment Variables Reference

| Variable | Description | Source / Where to Obtain |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Running mode: `development`, `production`, or `test`. | Set to `development` for local work. |
| `PORT` | Local port for FastAPI. Default: `8000`. | Local preference. |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins. | E.g. `http://localhost:5173,http://localhost:3000`. |
| `SUPABASE_URL` | Your Supabase project REST URL. | Supabase Dashboard → Settings → API → Project URL. |
| `SUPABASE_KEY` | Supabase Anon / Publishable key. | Supabase Dashboard → Settings → API → `anon` public key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend service-role secret key (bypasses RLS for admin queries). | Supabase Dashboard → Settings → API → `service_role` secret. *(Never expose in frontend).* |
| `SUPABASE_JWT_SECRET` | Secret used to verify Supabase Auth JWTs offline. | Supabase Dashboard → Settings → API → JWT Secret. |
| `MAX_FILE_SIZE_BYTES` | Maximum allowed PDF upload size in bytes (default: `52428800` = 50 MB). | Application policy. |

---

## 5. API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Server status, version, and database readiness. | No |
| `POST` | `/api/analyses` | Create an analysis for the authenticated user. | Yes (Bearer JWT) |
| `GET` | `/api/analyses` | List all analyses owned by current user. | Yes (Bearer JWT) |
| `GET` | `/api/analyses/{id}` | Get analysis status, progress, and paper list. | Yes (Owner check) |
| `POST` | `/api/analyses/{id}/papers` | Upload a PDF; validates `%PDF-` header and extracts page text. | Yes (Owner check) |
| `POST` | `/api/analyses/{id}/run` | Initiate analysis workflow on uploaded papers (Background or Sync). | Yes (Owner check) |
| `GET` | `/api/analyses/{id}/claims` | Retrieve candidate scientific claims across papers. | Yes (Owner check) |
| `GET` | `/api/analyses/{id}/relationships` | Retrieve evaluated cross-paper claim relationships. | Yes (Owner check) |
| `GET` | `/api/analyses/{id}/results` | Retrieve stored claims, detected relationships, and provenance. | Yes (Owner check) |
| `GET` | `/api/analyses/{id}/export` | Stream downloadable CSV of scientific findings. | Yes (Owner check) |

---

## 6. AI Contradiction Detection Engine (Step 5)

SciTrace AI implements an evidence-grounded AI pipeline designed to identify contradictions, supporting evidence, and neutral relationships across scientific literature:

### Core Models & Pipeline Stages:
1. **PyMuPDF Extraction**: Extracts clean text streams per page while preserving character/word metrics and detecting scanned documents.
2. **Scientific Claim Extraction**: Segments text into candidate scientific assertions using rhetorical discourse patterns, statistical markers, and section heuristics while preserving negations and qualifiers.
3. **Semantic Similarity Matching (`sentence-transformers/all-MiniLM-L6-v2`)**:
   - Generates normalized dense vector embeddings for all extracted claims.
   - Computes cross-paper cosine similarity matrices (filtering out intra-paper comparisons).
   - Retrieves candidate claim pairs exceeding the configurable similarity threshold (`SIMILARITY_THRESHOLD = 0.55`).
4. **Natural Language Inference (`facebook/bart-large-mnli`)**:
   - Evaluates premise-hypothesis relationships for each candidate claim pair.
   - Dynamically inspects `model.config.label2id` / `id2label` mappings to extract exact output probabilities for `contradiction`, `neutral`, and `entailment`.
   - Evaluates both forward (Claim A → Claim B) and reverse (Claim B → Claim A) directions to account for entailment asymmetry.
   - Maps entailment to `supporting` and contradiction to `contradiction`; classifies ambiguous or low-margin pairs as `neutral`.
5. **Evidence Provenance & Persistence**:
   - Records relationship ID, claim IDs, paper IDs, exact claim texts, source page numbers, similarity scores, raw NLI probabilities, and model metadata.

### Hardware Constraints & Model Requirements:
- **Disk Storage**: ~1.7 GB total for pretrained model weights (`all-MiniLM-L6-v2`: ~90 MB; `facebook/bart-large-mnli`: ~1.6 GB).
- **RAM / Memory**: Minimum 4 GB available system RAM (8 GB recommended for concurrent inference).
- **Compute / Acceleration**: Automatically utilizes Apple Silicon GPU (`mps`) or CUDA GPU if detected; falls back to multicore CPU inference.

---

## 7. Model Evaluation & Benchmark Results

The pipeline includes an automated test benchmark (`tests/test_evaluation_benchmark.py`) consisting of 15 manually curated scientific claim pairs across clear contradictions, supporting findings, neutral/unrelated pairs, population/condition divergences, and numerical/negation statements:

```
============================================================
SCITRACE AI — STEP 5 NLI EVALUATION BENCHMARK REPORT
============================================================
Dataset Size: 15 manually annotated scientific claim pairs
Overall Accuracy: 93.3% (14/15 correct)
Macro F1 Score: 0.944

Per-Class Metrics:
  • Contradiction : Precision=83.3%, Recall=100.0%, F1=0.909
  • Supporting    : Precision=100.0%, Recall=100.0%, F1=1.000
  • Neutral       : Precision=100.0%, Recall=85.7%, F1=0.923

Confusion Matrix (Rows: Ground Truth, Cols: Predicted):
                 Contradiction    Supporting       Neutral         
Contradiction    5                0                0               
Supporting       0                3                0               
Neutral          1                0                6               
============================================================
```

### Incomplete Features & Known Limitations:
1. **Benchmark Scope**: The 15-pair test suite is a regression and sanity benchmark; wide domain generalization requires broader datasets such as SciFact.
2. **Context & Methodology Extraction**: Differences in study cohorts (e.g. pediatric vs. geriatric, in vitro vs. in vivo) are often labeled neutral because full methodology context requires deep section parsing.
3. **OCR for Scanned PDFs**: Image-only or scanned PDFs are flagged and require an OCR pre-processor before claims can be extracted.

---

## 8. Running the Test Suite

Run the full automated test suite using pytest:
```bash
# In active venv
pytest -v
```
All 39 automated tests run with an isolated in-memory test runner without writing to production databases.
