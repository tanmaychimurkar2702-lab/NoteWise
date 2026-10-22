import sqlite3
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "notewise.db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Documents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            stored_filename TEXT NOT NULL,
            subject TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            page_count INTEGER NOT NULL DEFAULT 1,
            chunk_count INTEGER NOT NULL DEFAULT 0,
            file_hash TEXT UNIQUE NOT NULL,
            has_extractable_text INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Chunks table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            chunk_index INTEGER NOT NULL,
            page_number INTEGER NOT NULL,
            content TEXT NOT NULL,
            char_count INTEGER NOT NULL,
            faiss_id INTEGER UNIQUE NOT NULL,
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
        )
    """)

    # Search history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT NOT NULL,
            subject_filter TEXT,
            result_count INTEGER NOT NULL,
            top_score REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create indexes for search performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON chunks (document_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_faiss_id ON chunks (faiss_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_documents_subject ON documents (subject)")

    conn.commit()
    conn.close()

def add_document(
    filename: str,
    stored_filename: str,
    subject: str,
    file_type: str,
    file_size: int,
    page_count: int,
    chunk_count: int,
    file_hash: str,
    has_extractable_text: bool = True
) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO documents (
            filename, stored_filename, subject, file_type, 
            file_size, page_count, chunk_count, file_hash, has_extractable_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        filename, stored_filename, subject, file_type,
        file_size, page_count, chunk_count, file_hash,
        1 if has_extractable_text else 0
    ))
    doc_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return doc_id

def find_document_by_hash(file_hash: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE file_hash = ?", (file_hash,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_document(doc_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_documents(subject: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM documents WHERE 1=1"
    params = []

    if subject and subject.strip() and subject.lower() != 'all':
        query += " AND LOWER(subject) = LOWER(?)"
        params.append(subject.strip())

    if search and search.strip():
        query += " AND (filename LIKE ? OR subject LIKE ?)"
        term = f"%{search.strip()}%"
        params.extend([term, term])

    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_document(doc_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    doc = dict(row)
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()
    return doc

def add_chunks(chunks_data: List[Dict[str, Any]]):
    """
    Inserts a list of chunk dicts:
    [{'document_id': int, 'chunk_index': int, 'page_number': int, 'content': str, 'char_count': int, 'faiss_id': int}]
    """
    if not chunks_data:
        return
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.executemany("""
        INSERT INTO chunks (document_id, chunk_index, page_number, content, char_count, faiss_id)
        VALUES (:document_id, :chunk_index, :page_number, :content, :char_count, :faiss_id)
    """, chunks_data)
    conn.commit()
    conn.close()

def get_chunks_for_document(doc_id: int) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chunks WHERE document_id = ? ORDER BY chunk_index ASC", (doc_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_chunks_by_faiss_ids(faiss_ids: List[int]) -> List[Dict[str, Any]]:
    if not faiss_ids:
        return []
    conn = get_db_connection()
    cursor = conn.cursor()
    placeholders = ",".join(["?"] * len(faiss_ids))
    query = f"""
        SELECT c.*, d.filename, d.stored_filename, d.subject, d.page_count
        FROM chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE c.faiss_id IN ({placeholders})
    """
    cursor.execute(query, faiss_ids)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_all_chunks() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.*, d.filename, d.stored_filename, d.subject
        FROM chunks c
        JOIN documents d ON c.document_id = d.id
        ORDER BY c.faiss_id ASC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_next_faiss_id() -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(faiss_id) as max_id FROM chunks")
    row = cursor.fetchone()
    conn.close()
    if row and row["max_id"] is not None:
        return row["max_id"] + 1
    return 0

def record_search(query: str, result_count: int, top_score: float, subject_filter: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO search_history (query, subject_filter, result_count, top_score)
        VALUES (?, ?, ?, ?)
    """, (query, subject_filter, result_count, top_score))
    conn.commit()
    conn.close()

def get_recent_searches(limit: int = 5) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT query, subject_filter, result_count, top_score, created_at
        FROM search_history
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_dashboard_stats() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as doc_count, COALESCE(SUM(page_count), 0) as page_count, COALESCE(SUM(chunk_count), 0) as chunk_count FROM documents")
    totals = cursor.fetchone()

    cursor.execute("SELECT subject, COUNT(*) as count FROM documents GROUP BY subject ORDER BY count DESC")
    subject_rows = cursor.fetchall()
    subject_distribution = {row["subject"]: row["count"] for row in subject_rows}

    cursor.execute("SELECT * FROM documents ORDER BY created_at DESC LIMIT 5")
    recent_docs = [dict(r) for r in cursor.fetchall()]

    conn.close()

    recent_searches = get_recent_searches(limit=5)

    return {
        "total_documents": totals["doc_count"] if totals else 0,
        "total_pages": totals["page_count"] if totals else 0,
        "total_chunks": totals["chunk_count"] if totals else 0,
        "subject_distribution": subject_distribution,
        "recent_documents": recent_docs,
        "recent_searches": recent_searches
    }
