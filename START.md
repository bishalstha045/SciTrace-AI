# SciTrace AI — Quick Start Guide

## Prerequisites
- Python 3.10+ with virtual environment at `backend/venv/`
- Node.js 18+ with npm packages installed
- A Supabase project (already configured at clbvdlkedonbiboqfkvd.supabase.co)

---

## 🚨 STEP 1: Set Up Supabase Database (ONE TIME)

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard/project/clbvdlkedonbiboqfkvd)**
2. Navigate to **SQL Editor** → **New Query**
3. Copy and run the entire contents of `supabase/schema_fixed.sql`
4. Click **Run** — this creates all tables, indexes, RLS policies, and storage bucket

---

## 🔑 STEP 2: Add Service Role Key (REQUIRED for backend writes)

1. Go to **Supabase Dashboard** → **Project Settings** → **API**
2. Copy the **service_role** secret key (starts with `eyJ...`)
3. Open `backend/.env` and set:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key...
   ```

Without the service role key, uploads and AI analysis will still work via in-memory mode but won't persist to the database.

---

## ▶️ STEP 3: Start the Application

### Start Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate
python run.py
```
Backend runs at: http://localhost:8000
API Docs: http://localhost:8000/docs

### Start Frontend (Terminal 2)
```bash
npm run dev
```
Frontend runs at: http://localhost:5173

---

## 🧪 How to Test the Full Workflow

1. Go to http://localhost:5173
2. Sign up or sign in with your account
3. Click **New Analysis**
4. Upload 2+ PDF research papers
5. Watch the AI pipeline run in real-time
6. View the contradiction/supporting evidence results

---

## 📁 Architecture

```
Frontend (React/Vite :5173)
    ↕ Vite proxy /api → :8000
Backend (FastAPI :8000)
    ├── PDF extraction (PyMuPDF)
    ├── Claim extraction (heuristic NLP)
    ├── Semantic similarity (all-MiniLM-L6-v2)
    ├── NLI classification (BART-large-MNLI)
    └── Supabase (PostgreSQL + Storage)
```

## ⚠️ Notes

- First analysis run downloads AI models (~500MB) from HuggingFace — this takes 2-5 minutes
- Without `SUPABASE_SERVICE_ROLE_KEY`, data is stored in-memory (lost on restart)
- The demo analysis at `/analysis/demo-analysis/results` always works without login
