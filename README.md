<<<<<<< HEAD
# NoteWise AI — Semantic Search Engine for College Notes and PDFs

> **"Find the concept, not just the keyword."**  
> An AI-powered academic search engine that allows students to upload, organize, and retrieve study materials by meaning and intent rather than exact keyword matches.

---

## 1. Project Overview

College students frequently struggle with lecture materials spanning hundreds of slides and textbook pages. Standard lexical search tools (`Ctrl+F`) fail when a student asks:
> *"How does the CPU manage multiple tasks?"*

The relevant textbook passages describe **multiprogramming**, **process scheduling**, **FCFS**, **Round Robin**, and **context switching**, but never use the exact phrasing *"manage multiple tasks"*.

**NoteWise AI** solves this problem by transforming academic PDFs and text notes into dense mathematical vector representations (embeddings). When a query is submitted, NoteWise AI performs high-speed vector similarity search using **FAISS** to retrieve the most semantically relevant paragraphs, complete with **exact PDF page numbers**, **relevance percentage scores**, and **direct in-browser page viewing**.

---

## 2. Key Features

- **Dense Semantic Retrieval**: Powered by the open-source `sentence-transformers/all-MiniLM-L6-v2` model (384-dimensional dense vectors).
- **Sub-Millisecond Vector Search**: Utilizes **FAISS** (Facebook AI Similarity Search) with an `IndexFlatIP` inner product on L2-normalized vectors for exact cosine similarity.
- **Page-Level PDF Citations**: Preserves original PDF page numbers and displays the exact source page for every retrieved passage.
- **In-Browser Document Viewer**: Built-in split-screen viewer synchronizes original PDF page rendering with indexed page chunks.
- **Curriculum-Grounded Exam Mode**: Generates structured, exam-oriented responses targeting 2, 5, 8, or 10 marks grounded strictly in your uploaded notes with citations. If evidence is lacking, it alerts the student rather than hallucinating.
- **Scanned / Image PDF Detection**: Identifies scanned documents lacking selectable text and alerts the user cleanly.
- **Duplicate Document Detection**: Computes SHA-256 cryptographic hashes of uploaded files to prevent redundant indexing.
- **Re-indexing & Index Persistence**: Vector indexes persist to disk (`notewise_faiss.index`) and automatically sync with the SQLite metadata store (`notewise.db`).
- **100% Local Inference**: Zero paid external AI API keys required (no OpenAI, no Anthropic dependencies). All processing runs locally on your machine.

---

## 3. System Architecture

```mermaid
flowchart TD
    subgraph Frontend["Frontend (React + Vite + Tailwind CSS)"]
        UI_Home[Landing Page]
        UI_Dash[Dashboard & Stats]
        UI_Search[Semantic Search Interface]
        UI_Lib[Document Library & Upload Modal]
        UI_Exam[Exam Preparation Mode]
        UI_Viewer[In-Browser PDF Viewer]
    end

    subgraph Backend["Backend API (Flask + Python)"]
        API_Routes[REST API Blueprints]
        DocService[Document Processing & Chunker]
        VecService[Vector Search Service (FAISS + SentenceTransformers)]
        DB_Layer[SQLite Metadata Database]
    end

    subgraph Storage["Persistent Local Storage"]
        Disk_Uploads["backend/uploads/ (PDF & TXT files)"]
        Disk_DB["backend/notewise.db (SQLite)"]
        Disk_FAISS["backend/indexes/notewise_faiss.index"]
        Model_Cache["Local HuggingFace Cache (all-MiniLM-L6-v2)"]
    end

    UI_Search -->|POST /api/search| API_Routes
    UI_Lib -->|POST /api/documents/upload| API_Routes
    UI_Exam -->|POST /api/exam-prep| API_Routes
    UI_Viewer -->|GET /api/documents/:id/file| API_Routes
    UI_Dash -->|GET /api/dashboard/stats| API_Routes

    API_Routes --> DocService
    API_Routes --> VecService
    DocService -->|PyMuPDF Text Extract| DB_Layer
    DocService -->|Save File| Disk_Uploads
    VecService -->|Query Embedding| Model_Cache
    VecService -->|Cosine Similarity Search| Disk_FAISS
    DB_Layer -->|Metadata & Chunks| Disk_DB
```

---

## 4. Viva Voce & Technical Concept Guide

### What is Semantic Search?
Traditional keyword search (Lexical Search / BM25 / TF-IDF) looks for exact matching word tokens. If a student searches for *"process switching"*, lexical search cannot match a paragraph describing a *"context switch"* unless exact synonyms are manually configured.

**Semantic search** converts textual meaning into a continuous numerical vector space. Sentences with similar meanings are mapped close to one another in this high-dimensional space, regardless of the specific vocabulary used.

### What are Vector Embeddings?
An embedding model converts text into an array of floating-point numbers:
$$\vec{v} \in \mathbb{R}^{384}$$

In `sentence-transformers/all-MiniLM-L6-v2`, every sentence or paragraph is transformed into a 384-dimensional vector. Vectors capture syntactic, semantic, and contextual relationships.

### What is Cosine Similarity?
The semantic similarity between query vector $\vec{q}$ and document chunk vector $\vec{d}$ is measured by the cosine of the angle between them:
$$\text{Cosine Similarity}(\vec{q}, \vec{d}) = \frac{\vec{q} \cdot \vec{d}}{\|\vec{q}\|_2 \|\vec{d}\|_2}$$

Because NoteWise AI L2-normalizes vectors ($\|\vec{v}\|_2 = 1$) prior to indexing, the inner product $\vec{q} \cdot \vec{d}$ is mathematically identical to cosine similarity:
$$\text{Similarity}(\vec{q}, \vec{d}) = \sum_{i=1}^{384} q_i \cdot d_i$$

This allows FAISS `IndexFlatIP` to execute exact cosine similarity search in microsecond latencies.

---

## 5. Technology Stack

### Frontend
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS v4 (Slate/Navy theme, indigo accents, subtle glassmorphism)
- **Icons**: Lucide React
- **Routing**: React Router v6

### Backend
- **Framework**: Python 3.12+ with Flask & Flask-CORS
- **PDF Extraction**: PyMuPDF (`fitz` / `pymupdf`)
- **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2` (Local HuggingFace cache)
- **Vector Index**: FAISS (`faiss-cpu`)
- **Relational Store**: SQLite3 (`notewise.db`)

---

## 6. Installation & Setup Guide (Windows / PowerShell)

### Prerequisites
- Python 3.11 or 3.12
- Node.js v18+ and npm
- Windows PowerShell

### Step 1: Clone or Navigate to the Workspace
```powershell
cd "c:\Users\tanma\OneDrive\Desktop\semantic  search engine for college notes"
```

### Step 2: Set Up Python Virtual Environment
Using `uv` (recommended):
```powershell
uv venv .venv --python 3.12
uv pip install --python .venv\Scripts\python.exe flask flask-cors pymupdf sentence-transformers faiss-cpu pytest
```
Or standard Python:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Step 3: Install Frontend Dependencies
```powershell
cd frontend
npm install
cd ..
```

---

## 7. Running the Application

### Option A: Running Backend & Frontend in Two PowerShell Windows

**Window 1: Start Flask Backend (Port 5000)**
```powershell
cd "c:\Users\tanma\OneDrive\Desktop\semantic  search engine for college notes"
.\.venv\Scripts\python.exe backend/app.py
```
*Backend will start at: `http://127.0.0.1:5000`*

**Window 2: Start Vite Frontend (Port 5173)**
```powershell
cd "c:\Users\tanma\OneDrive\Desktop\semantic  search engine for college notes\frontend"
npm run dev
```
*Frontend will open at: `http://localhost:5173`*

Open `http://localhost:5173` in your browser.

---

## 8. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend status, model details, and indexed vector count |
| `GET` | `/api/dashboard/stats` | Dynamic metrics: total docs, pages, chunks, subject distributions |
| `POST` | `/api/documents/upload` | Multipart upload (`file`, `subject`). Validates, chunks, and indexes |
| `GET` | `/api/documents` | List uploaded documents with optional `?subject=` and `?search=` |
| `GET` | `/api/documents/<id>` | Full document details and list of indexed chunks |
| `DELETE` | `/api/documents/<id>` | Deletes document, drops chunks, removes physical file, rebuilds FAISS |
| `POST` | `/api/documents/reindex` | Force rebuilds FAISS index from SQLite database records |
| `GET` | `/api/documents/<id>/file` | Safely streams original PDF/TXT file with path traversal defense |
| `GET` | `/api/documents/<id>/page/<page>` | Returns chunk records belonging to a specific page number |
| `POST` | `/api/search` | Performs semantic vector search (`query`, `subject_filter`, `top_k`) |
| `POST` | `/api/exam-prep` | Generates exam answers grounded in notes (`query`, `marks`, `subject_filter`) |

---

## 9. Evaluation & Testing

NoteWise AI includes sample academic lecture notes in `sample_documents/` and an evaluation script:

### Generate Sample Notes
```powershell
.\.venv\Scripts\python.exe sample_documents/generate_samples.py
```

### Run Benchmark Evaluation Suite
```powershell
.\.venv\Scripts\python.exe backend/tests/evaluate_search.py
```

### Benchmark Queries Tested:
1. *"How does an operating system manage multiple processes?"* &rarr; Operating Systems, Page 1
2. *"What happens when the CPU switches from one task to another?"* &rarr; Operating Systems, Page 1
3. *"Explain the different methods of CPU scheduling."* &rarr; Operating Systems, Page 2
4. *"How does normalization reduce database redundancy?"* &rarr; DBMS, Page 1
5. *"Explain the role of DNS in converting domain names to IP addresses."* &rarr; Computer Networks, Page 1

**Results**: **100.0% Top-1 Accuracy** across all benchmark queries.

---

## 10. Demonstration Workflow for Evaluators / Viva

1. **Overview & Dashboard**:
   - Open `http://localhost:5173/`.
   - Observe the value proposition, comparison between exact keyword search and semantic dense vector search, and the architecture pipeline diagram.
   - Navigate to the **Dashboard** (`/dashboard`) to view actual database counts: total documents, pages, chunks, and subject distributions.

2. **Upload & Vectorization**:
   - Click **"Upload Notes"**.
   - Drag and drop `sample_documents/Operating_Systems_Process_and_Scheduling.pdf` or browse files.
   - Select subject: *"Operating Systems"*.
   - Click **"Index Document"**. Observe real-time chunking and FAISS vector generation.

3. **Semantic Querying**:
   - Go to **Semantic Search** (`/search`).
   - Query: *"How does the CPU switch between programs?"*
   - Observe that NoteWise AI ranks the **Context Switching** passage with a high similarity score (~58–65%), displaying `Page 1` and highlighted terms.

4. **In-Browser Verification**:
   - Click **"Open PDF at Page 1"** on the result card.
   - NoteWise AI opens the document viewer displaying the exact PDF page alongside the indexed chunk breakdown.

5. **Exam Mode Demonstration**:
   - Navigate to **Exam Mode** (`/exam-prep`).
   - Click sample prompt: *"Explain normalization for 8 marks."*
   - NoteWise AI synthesizes a structured academic answer citing `DBMS_Normalization_and_Indexing.pdf (Page 1 & 2)`.
   - Try an ungrounded prompt: *"Explain Quantum Chromodynamics in Organic Chemistry"*.
   - NoteWise AI identifies that the notes lack sufficient evidence and displays an honest notice without hallucination.

---

## 11. Project Limitations & Future Scope

### Limitations
- **Scanned Hand-written Notes**: Scanned image-only PDFs require optical character recognition (OCR) before extraction. NoteWise AI currently detects scanned files and alerts the user rather than processing them as images.
- **Single-User Local Prototype**: Authentication and multi-tenant access control are omitted for lightweight local college project deployment.

### Future Scope
- **Tesseract OCR Integration**: Add local OCR pipeline to support non-searchable image PDFs and photographed lecture notes.
- **Hybrid Retrieval (BM25 + Dense Vectors)**: Reciprocal Rank Fusion (RRF) combining lexical BM25 and dense vector embeddings.
- **Audio Lecture Transcription**: Transcribe voice recordings of professors using Whisper and index timestamps.
- **Vector Quantization (IVF-PQ)**: Scale vector indexing to hundreds of thousands of documents with minimal RAM footprint.
=======
# NoteWise
....
>>>>>>> e9221bc775e2f46e05e3d498309275a0872b8467
