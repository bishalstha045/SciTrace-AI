# SciTrace AI — Scientific Contradiction Detection & Evidence Analysis

SciTrace AI is an enterprise-grade AI system designed to detect empirical contradictions, corroborations, and rhetorical discrepancies across scientific research literature. Users can upload two or more peer-reviewed scientific papers (in PDF format) and run a 6-stage NLP pipeline that extracts verifiable claims, computes cross-document semantic similarity, classifies premise-hypothesis pairs using Natural Language Inference (NLI), and visualizes interactive evidence graphs and downloadable CSV reports.

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                         │
│  - Modern Dashboard & Upload Workspace                                 │
│  - Interactive Evidence Comparison & Provenance Cards                  │
│  - Scientific Evidence Relationship Diagram                            │
│  - Multi-attribute CSV Export Engine                                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Reverse Proxy /api → :8000)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI + Python)                      │
│                                                                        │
│  Stage 1: Text Extraction (PyMuPDF)                                    │
│  Stage 2: Claim Extraction (Empirical/Rhetorical Rule Heuristics)      │
│  Stage 3: Embedding & Filtering (all-MiniLM-L6-v2, Cosine Similarity)  │
│  Stage 4: Relationship Classification (facebook/bart-large-mnli)       │
│  Stage 5: Provenance & Exact Page Citation Mapping                     │
│  Stage 6: Persistent Storage (Supabase PostgreSQL + Storage)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL + Auth + Storage)              │
│  - Row Level Security (RLS) on analyses, papers, claims, relationships │
│  - Private file storage bucket: {user_id}/{analysis_id}/{filename}     │
│  - Resilient In-Memory Caching Fallback for Development                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 AI Pipeline Stages

1. **PDF Text Extraction (`pdf_service.py`):**
   - Validates file size, magic bytes (`%PDF`), and structural integrity.
   - Extracts text page-by-page preserving document layout.
   - Automatically detects scanned or image-only PDFs.
2. **Scientific Claim Extraction (`claim_extractor.py`):**
   - Segments text into clean sentences while preserving scientific abbreviations (e.g., *et al.*, *vs.*, *Fig.*).
   - Identifies empirical findings, experimental conclusions, and quantitative assertions.
   - Preserves negations (*not*, *failed to*, *never*) and modal qualifiers (*may*, *suggests*).
3. **Semantic Similarity Filtering (`similarity_service.py`):**
   - Generates high-density embeddings using `sentence-transformers/all-MiniLM-L6-v2`.
   - Computes cross-paper cosine similarity matrices and filters candidate pairs meeting threshold (default: 65%).
4. **NLI Relationship Classification (`nli_service.py`):**
   - Evaluates candidate claim pairs bidirectionally using `facebook/bart-large-mnli`.
   - Dynamically maps label indices from model configurations to prevent classification inversion.
   - Categorizes relationships into `contradiction`, `supporting`, or `neutral`.
5. **Traceable Evidence Mapping (`analyses.py`):**
   - Associates every relationship with exact paper IDs, claim IDs, source page numbers, target page numbers, and model probability distributions.
6. **Data Export (`/api/analyses/{id}/export`):**
   - Generates standards-compliant CSV files with formula-injection mitigation (`=`, `+`, `-`, `@`).

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python:** 3.10+ (tested up to 3.13)
- **Node.js:** 18+ (tested with npm 10+)
- **Supabase Account:** Free tier project configured

---

### macOS / Linux Setup

#### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI dev server (port 8000)
python run.py
```
Backend runs at: `http://localhost:8000`  
Interactive Swagger Docs: `http://localhost:8000/docs`

#### 2. Frontend Setup (in a separate terminal)
```bash
# In the root repository directory
npm install

# Run Vite development server (port 5173)
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

### Windows Setup (PowerShell)

#### 1. Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

#### 2. Frontend Setup
```powershell
# From project root
npm install
npm run dev
```

---

## ⚙️ Environment Variables

### Root Frontend (`.env.local` or `.env`)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_anon_key
VITE_API_BASE_URL=http://localhost:8000/api
# Set to 'true' only if you wish to run frontend purely in mock mode without backend
VITE_USE_MOCK=false
```

### Backend (`backend/.env`)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=sb_publishable_your_anon_key
# Required for live database writes through Row Level Security:
SUPABASE_SERVICE_ROLE_KEY=
ENVIRONMENT=development
PORT=8000
HOST=0.0.0.0
ALLOW_TEST_AUTH=true
```

> [!NOTE]
> When `SUPABASE_SERVICE_ROLE_KEY` is omitted, the backend runs in a resilient **In-Memory Cache Mode**, enabling complete local testing and AI pipeline execution without requiring live database access.

---

## 🧪 Testing & Verification

### Run Backend Test Suite (Pytest)
```bash
cd backend
./venv/bin/pytest -v
```
*Current test suite: **41 / 41 passing (100%)**.*

### Run Frontend Linter (Oxlint)
```bash
npm run lint
```
*Current linter status: **0 errors, 0 warnings**.*

### Run Frontend Production Build
```bash
npm run build
```
*Production build produces static assets in `dist/` in ~500ms.*

### Run Real End-to-End Scientific PDF Test
```bash
cd backend
python ../.gemini/antigravity-ide/brain/fdb01d8d-9170-4bce-b0a0-6f83ca8cb982/scratch/test_real_pdf_workflow.py
```
This tests:
1. Creating an analysis.
2. Uploading `paper_A_marine_calcification.pdf` and `paper_B_resilience_calcification.pdf`.
3. Extracting real claims across both papers.
4. Running the full Sentence Transformers + BART-large-MNLI pipeline.
5. Exporting verifiable CSV output.
6. Verifying cross-tenant security rejection (HTTP 403).

---

## 🗄️ Database Schema & RLS Setup

To deploy the schema to your Supabase PostgreSQL instance:
1. Open the [Supabase SQL Editor](https://supabase.com/dashboard).
2. Open `supabase/schema_fixed.sql` and run the script.
3. Verify RLS policies using `supabase/verify_rls.sql`.

---

## 🔒 Security Best Practices
- **No Shared Secrets:** `backend/.env`, `.env.local`, and secrets are excluded via `.gitignore`.
- **Tenant Isolation:** Supabase RLS enforces `auth.uid() = analyses.user_id`. Cross-user access is blocked at both the API and database levels.
- **Storage Isolation:** PDFs are stored under private paths: `{user_id}/{analysis_id}/{filename}`.
- **Formula Injection Defense:** CSV export sanitizes fields beginning with `=`, `+`, `-`, or `@`.
