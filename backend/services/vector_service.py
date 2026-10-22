import os
import threading
import numpy as np
import faiss
from typing import List, Dict, Any, Optional, Tuple
from sentence_transformers import SentenceTransformer

from backend.models.database import (
    get_all_chunks,
    get_chunks_by_faiss_ids,
    record_search
)

INDEX_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "indexes")
INDEX_PATH = os.path.join(INDEX_DIR, "notewise_faiss.index")
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
VECTOR_DIMENSION = 384

class VectorSearchService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(VectorSearchService, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        self.model: Optional[SentenceTransformer] = None
        self.index: Optional[faiss.IndexFlatIP] = None
        self._index_lock = threading.RLock()
        self._initialized = True

    def get_model(self) -> SentenceTransformer:
        if self.model is None:
            with self._index_lock:
                if self.model is None:
                    print(f"Loading SentenceTransformer model: {EMBEDDING_MODEL_NAME}...", flush=True)
                    self.model = SentenceTransformer(EMBEDDING_MODEL_NAME)
                    print("SentenceTransformer model loaded successfully.", flush=True)
        return self.model


    def initialize_index(self):
        """
        Loads the FAISS index from disk or rebuilds it from the SQLite database.
        """
        with self._index_lock:
            os.makedirs(INDEX_DIR, exist_ok=True)
            chunks = get_all_chunks()
            
            if os.path.exists(INDEX_PATH):
                try:
                    loaded_index = faiss.read_index(INDEX_PATH)
                    if loaded_index.ntotal == len(chunks):
                        self.index = loaded_index
                        print(f"Loaded existing FAISS index from disk with {loaded_index.ntotal} vectors.", flush=True)
                        return
                    else:
                        print(f"FAISS index out-of-sync ({loaded_index.ntotal} in index vs {len(chunks)} in DB). Rebuilding...", flush=True)
                except Exception as e:
                    print(f"Could not load index file ({str(e)}). Rebuilding...", flush=True)

            # Build index from DB
            self._rebuild_index_from_db_locked(chunks)

    def _rebuild_index_from_db_locked(self, chunks: List[Dict[str, Any]]):
        """
        Reconstructs index from chunks array. Must be called with _index_lock held.
        Uses faiss.IndexFlatIP on normalized vectors for exact Cosine Similarity.
        """
        # Create fresh index
        new_index = faiss.IndexFlatIP(VECTOR_DIMENSION)

        if not chunks:
            self.index = new_index
            faiss.write_index(new_index, INDEX_PATH)
            print("Initialized empty FAISS index.", flush=True)
            return

        print(f"Rebuilding FAISS index for {len(chunks)} chunks...", flush=True)
        model = self.get_model()
        texts = [c["content"] for c in chunks]
        embeddings = model.encode(texts, batch_size=32, show_progress_bar=False, normalize_embeddings=True)
        embeddings = np.array(embeddings, dtype=np.float32)

        new_index.add(embeddings)
        self.index = new_index
        faiss.write_index(new_index, INDEX_PATH)
        print(f"FAISS index rebuilt and persisted with {new_index.ntotal} vectors.", flush=True)


    def add_document_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Encodes and appends new document chunks to the FAISS index and persists to disk.
        """
        if not chunks:
            return 0

        with self._index_lock:
            if self.index is None:
                self.initialize_index()

            model = self.get_model()
            texts = [c["content"] for c in chunks]
            embeddings = model.encode(texts, batch_size=32, show_progress_bar=False, normalize_embeddings=True)
            embeddings = np.array(embeddings, dtype=np.float32)

            self.index.add(embeddings)
            faiss.write_index(self.index, INDEX_PATH)
            print(f"Added {len(chunks)} vectors to FAISS index. Total vectors: {self.index.ntotal}")
            return len(chunks)

    def rebuild_index(self):
        """
        Public method to force re-indexing all chunks from SQLite.
        """
        with self._index_lock:
            chunks = get_all_chunks()
            self._rebuild_index_from_db_locked(chunks)

    def search(
        self,
        query: str,
        top_k: int = 5,
        subject_filter: Optional[str] = None,
        min_score: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        Executes semantic search:
        1. Encodes query vector and normalizes.
        2. Retrieves top candidates from FAISS index.
        3. Retrieves chunk details and document metadata from SQLite.
        4. Applies subject filter and score threshold.
        5. Formats results with human-readable similarity percentage.
        """
        query = query.strip()
        if not query:
            return []

        if self.index is None:
            self.initialize_index()

        if self.index is None or self.index.ntotal == 0:
            return []

        model = self.get_model()
        query_vector = model.encode([query], normalize_embeddings=True)
        query_vector = np.array(query_vector, dtype=np.float32)

        # Retrieve a broader pool of candidates if filtering by subject
        search_k = min(self.index.ntotal, top_k * 5 if (subject_filter and subject_filter.lower() != 'all') else top_k * 2)
        search_k = max(search_k, min(self.index.ntotal, 10))

        with self._index_lock:
            distances, indices = self.index.search(query_vector, search_k)

        faiss_indices = indices[0].tolist()
        scores = distances[0].tolist()

        # Filter out invalid indices (-1 in FAISS when fewer results than k)
        valid_pairs = [(idx, score) for idx, score in zip(faiss_indices, scores) if idx >= 0]
        if not valid_pairs:
            return []

        valid_faiss_ids = [p[0] for p in valid_pairs]
        id_to_score = {p[0]: p[1] for p in valid_pairs}

        # Query chunks from database
        chunk_records = get_chunks_by_faiss_ids(valid_faiss_ids)

        results = []
        for chunk in chunk_records:
            f_id = chunk["faiss_id"]
            raw_score = id_to_score.get(f_id, 0.0)

            # Cosine similarity on normalized vectors is between -1 and 1.
            # MiniLM-L6-v2 cosine similarities for related text typically fall in [0.25, 0.95].
            # We scale this cleanly to a 0-100% relevance score.
            similarity_pct = max(0.0, min(100.0, round(float(raw_score) * 100, 1)))

            # Subject filter check
            if subject_filter and subject_filter.strip() and subject_filter.lower() != 'all':
                if chunk["subject"].lower() != subject_filter.strip().lower():
                    continue

            if similarity_pct < min_score:
                continue

            # Query term highlighting/overlap hints
            content_lower = chunk["content"].lower()
            query_terms = [t.lower() for t in query.split() if len(t) > 2]
            matched_terms = [term for term in query_terms if term in content_lower]

            results.append({
                "chunk_id": chunk["id"],
                "document_id": chunk["document_id"],
                "filename": chunk["filename"],
                "stored_filename": chunk["stored_filename"],
                "subject": chunk["subject"],
                "page_number": chunk["page_number"],
                "total_pages": chunk["page_count"],
                "excerpt": chunk["content"],
                "similarity_score": similarity_pct,
                "raw_score": round(float(raw_score), 4),
                "matched_terms": matched_terms
            })

        # Sort strictly descending by similarity score
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        final_results = results[:top_k]

        # Record search query in search history
        top_score = final_results[0]["similarity_score"] if final_results else 0.0
        record_search(query, len(final_results), top_score, subject_filter)

        return final_results

    def generate_exam_preparation_answer(
        self,
        query: str,
        marks: int = 5,
        subject_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes an exam-tailored answer grounded strictly in retrieved note passages.
        If notes lack sufficient content, explicitly informs the student without hallucination.
        """
        retrieved_passages = self.search(
            query=query,
            top_k=5,
            subject_filter=subject_filter,
            min_score=35.0
        )

        if not retrieved_passages:

            return {
                "grounded": False,
                "query": query,
                "marks": marks,
                "answer": (
                    "No relevant passages were found in your uploaded notes. "
                    "Please upload relevant lecture slides, textbooks, or notes for this subject "
                    "to generate an exam-oriented answer grounded in your curriculum."
                ),
                "citations": []
            }

        # Build citations list
        citations = []
        unique_citations = set()
        for p in retrieved_passages:
            cite_key = (p["filename"], p["page_number"])
            if cite_key not in unique_citations:
                unique_citations.add(cite_key)
                citations.append({
                    "document_id": p["document_id"],
                    "filename": p["filename"],
                    "page_number": p["page_number"],
                    "excerpt": p["excerpt"][:200] + "..." if len(p["excerpt"]) > 200 else p["excerpt"]
                })

        # Synthesize structured exam answer from the top grounded excerpts
        primary_chunks = [p["excerpt"] for p in retrieved_passages[:3]]
        
        # Prepare structured sections for academic answers
        is_comparison = any(w in query.lower() for w in ["compare", "difference", "vs", "versus"])
        
        structured_sections = []
        structured_sections.append(f"### Exam Preparation Response ({marks} Marks Target)\n")
        structured_sections.append(f"**Question/Topic:** {query}\n")

        if is_comparison:
            structured_sections.append("#### 1. Conceptual Overview & Key Differences")
            for i, p in enumerate(retrieved_passages[:3], 1):
                structured_sections.append(f"- **Key Point {i}** (Source: *{p['filename']}*, Page {p['page_number']}): {p['excerpt']}")
        else:
            structured_sections.append("#### 1. Core Definition & Principle")
            structured_sections.append(f"{primary_chunks[0]}\n")
            if len(primary_chunks) > 1:
                structured_sections.append("#### 2. Key Mechanisms & Important Details")
                for i, p in enumerate(retrieved_passages[1:4], 1):
                    structured_sections.append(f"- **Point {i}** (*{p['filename']}*, Page {p['page_number']}): {p['excerpt']}")

        structured_sections.append("\n#### 3. Summary for Exam Revision")
        structured_sections.append(
            f"Review the primary concepts above as documented on Page {citations[0]['page_number']} of '{citations[0]['filename']}'. "
            f"Ensure diagrams and key algorithm steps are included during written tests."
        )

        answer_text = "\n".join(structured_sections)

        return {
            "grounded": True,
            "query": query,
            "marks": marks,
            "answer": answer_text,
            "citations": citations,
            "passages": retrieved_passages
        }


# Singleton accessor
vector_service = VectorSearchService()
