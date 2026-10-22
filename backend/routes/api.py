import os
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename

from backend.models.database import (
    init_db,
    add_document,
    delete_document,
    get_document,
    get_all_documents,
    find_document_by_hash,
    add_chunks,
    get_chunks_for_document,
    get_next_faiss_id,
    get_dashboard_stats,
    get_recent_searches
)
from backend.services.document_service import (
    is_allowed_file,
    compute_file_hash,
    generate_safe_filename,
    extract_text_from_file,
    process_document_into_chunks,
    MAX_FILE_SIZE_BYTES
)
from backend.services.vector_service import vector_service

api_bp = Blueprint('api', __name__)
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint confirming API status and model readiness."""
    return jsonify({
        "status": "healthy",
        "service": "NoteWise AI Backend",
        "model": "sentence-transformers/all-MiniLM-L6-v2",
        "vector_dimension": 384,
        "indexed_vectors": vector_service.index.ntotal if vector_service.index else 0
    }), 200

@api_bp.route('/dashboard/stats', methods=['GET'])
def dashboard_stats():
    """Returns dynamic statistics aggregated directly from SQLite."""
    try:
        stats = get_dashboard_stats()
        return jsonify({
            "success": True,
            "data": stats
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to retrieve dashboard stats: {str(e)}"
        }), 500

@api_bp.route('/documents/upload', methods=['POST'])
def upload_document():
    """
    Accepts PDF or TXT files, extracts text page-by-page, chunks with overlap,
    generates FAISS embeddings, and stores document records in SQLite.
    """
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded in form field 'file'"}), 400

    file = request.files['file']
    if not file or file.filename.strip() == '':
        return jsonify({"success": False, "error": "No selected file"}), 400

    original_filename = file.filename
    if not is_allowed_file(original_filename):
        return jsonify({
            "success": False, 
            "error": "Unsupported file format. Please upload a .pdf or .txt file."
        }), 400

    subject = request.form.get('subject', 'General').strip()
    if not subject:
        subject = 'General'

    # Read bytes to check file size and compute hash
    file_bytes = file.read()
    file_size = len(file_bytes)

    if file_size == 0:
        return jsonify({"success": False, "error": "Uploaded file is empty (0 bytes)."}), 400

    if file_size > MAX_FILE_SIZE_BYTES:
        return jsonify({
            "success": False,
            "error": f"File size exceeds maximum limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
        }), 400

    file_hash = compute_file_hash(file_bytes)

    # Check for duplicate document
    existing_doc = find_document_by_hash(file_hash)
    if existing_doc:
        return jsonify({
            "success": False,
            "error": f"Duplicate file detected: '{existing_doc['filename']}' already exists in your library (Subject: {existing_doc['subject']}).",
            "duplicate": True,
            "document_id": existing_doc['id']
        }), 409

    # Generate secure stored filename and save to uploads folder
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    stored_filename = generate_safe_filename(original_filename)
    file_path = os.path.join(UPLOAD_DIR, stored_filename)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    ext = os.path.splitext(original_filename)[1].lower().replace('.', '')

    try:
        # Extract page text
        pages_data, has_extractable_text, total_pages = extract_text_from_file(file_path, ext)

        if not has_extractable_text:
            # We record the document so user sees it in library, but mark it with a clear note
            doc_id = add_document(
                filename=original_filename,
                stored_filename=stored_filename,
                subject=subject,
                file_type=ext.upper(),
                file_size=file_size,
                page_count=total_pages,
                chunk_count=0,
                file_hash=file_hash,
                has_extractable_text=False
            )
            return jsonify({
                "success": True,
                "warning": "No selectable text found in this PDF. It appears to be scanned or contains image-only pages. Full semantic indexing requires text-searchable PDFs.",
                "data": {
                    "document_id": doc_id,
                    "filename": original_filename,
                    "pages": total_pages,
                    "chunks": 0,
                    "has_extractable_text": False
                }
            }), 201

        # Chunk text
        chunks = process_document_into_chunks(pages_data, chunk_size=500, overlap=100)
        
        # Assign next sequential faiss IDs
        start_faiss_id = vector_service.index.ntotal if vector_service.index else get_next_faiss_id()
        
        # Insert document record into SQLite
        doc_id = add_document(
            filename=original_filename,
            stored_filename=stored_filename,
            subject=subject,
            file_type=ext.upper(),
            file_size=file_size,
            page_count=total_pages,
            chunk_count=len(chunks),
            file_hash=file_hash,
            has_extractable_text=True
        )

        # Prepare chunk records with foreign key and faiss_id
        chunk_records = []
        for i, c in enumerate(chunks):
            c["document_id"] = doc_id
            c["faiss_id"] = start_faiss_id + i
            chunk_records.append(c)

        # Insert chunks into SQLite
        add_chunks(chunk_records)

        # Encode and append to FAISS vector index
        vector_service.add_document_chunks(chunk_records)

        return jsonify({
            "success": True,
            "message": f"Successfully processed and indexed '{original_filename}'.",
            "data": {
                "document_id": doc_id,
                "filename": original_filename,
                "subject": subject,
                "pages": total_pages,
                "chunks": len(chunks),
                "has_extractable_text": True
            }
        }), 201

    except Exception as e:
        # Cleanup uploaded file on fatal processing failure
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        return jsonify({
            "success": False,
            "error": f"Document processing failed: {str(e)}"
        }), 500

@api_bp.route('/documents', methods=['GET'])
def list_documents():
    """Lists all documents, supporting optional subject filter and search query."""
    subject = request.args.get('subject')
    search = request.args.get('search')
    try:
        docs = get_all_documents(subject=subject, search=search)
        return jsonify({
            "success": True,
            "data": docs
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@api_bp.route('/documents/<int:doc_id>', methods=['GET'])
def document_details(doc_id: int):
    """Retrieves document details and its indexed chunks."""
    doc = get_document(doc_id)
    if not doc:
        return jsonify({"success": False, "error": "Document not found"}), 404

    chunks = get_chunks_for_document(doc_id)
    return jsonify({
        "success": True,
        "data": {
            **doc,
            "chunks": chunks
        }
    }), 200

@api_bp.route('/documents/<int:doc_id>', methods=['DELETE'])
def remove_document(doc_id: int):
    """Deletes document, removes chunks from SQLite, drops stored file, and rebuilds FAISS index."""
    doc = delete_document(doc_id)
    if not doc:
        return jsonify({"success": False, "error": "Document not found"}), 404

    # Remove stored physical file safely
    stored_path = os.path.join(UPLOAD_DIR, doc["stored_filename"])
    if os.path.exists(stored_path):
        try:
            os.remove(stored_path)
        except Exception:
            pass

    # Rebuild FAISS vector index from remaining SQLite chunks
    vector_service.rebuild_index()

    return jsonify({
        "success": True,
        "message": f"Document '{doc['filename']}' and its vector embeddings were removed."
    }), 200

@api_bp.route('/documents/reindex', methods=['POST'])
def reindex_all():
    """Forces rebuilding of the FAISS index from stored SQLite chunks."""
    try:
        vector_service.rebuild_index()
        return jsonify({
            "success": True,
            "message": "FAISS vector index rebuilt successfully.",
            "total_vectors": vector_service.index.ntotal if vector_service.index else 0
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@api_bp.route('/documents/<int:doc_id>/file', methods=['GET'])
def get_document_file(doc_id: int):
    """Safely serves the original PDF/TXT file for browser inline viewing."""
    doc = get_document(doc_id)
    if not doc:
        return jsonify({"success": False, "error": "Document not found"}), 404

    safe_name = secure_filename(doc["stored_filename"])
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    # Path traversal protection
    real_upload_dir = os.path.abspath(UPLOAD_DIR)
    real_file_path = os.path.abspath(file_path)
    if not real_file_path.startswith(real_upload_dir) or not os.path.exists(real_file_path):
        return jsonify({"success": False, "error": "File not found on server"}), 404

    mimetype = "application/pdf" if doc["file_type"] == "PDF" else "text/plain"
    return send_file(
        real_file_path,
        mimetype=mimetype,
        as_attachment=False,
        download_name=doc["filename"]
    )

@api_bp.route('/documents/<int:doc_id>/page/<int:page_num>', methods=['GET'])
def get_document_page_info(doc_id: int, page_num: int):
    """Returns chunks specifically belonging to a given page in a document."""
    doc = get_document(doc_id)
    if not doc:
        return jsonify({"success": False, "error": "Document not found"}), 404

    all_chunks = get_chunks_for_document(doc_id)
    page_chunks = [c for c in all_chunks if c["page_number"] == page_num]

    return jsonify({
        "success": True,
        "data": {
            "document": doc,
            "page_number": page_num,
            "chunks": page_chunks
        }
    }), 200

@api_bp.route('/search', methods=['POST'])
def semantic_search():
    """Performs semantic similarity search across indexed document passages."""
    data = request.get_json(silent=True) or {}
    query = data.get('query', '').strip()
    if not query:
        return jsonify({"success": False, "error": "Search query cannot be empty"}), 400

    subject_filter = data.get('subject_filter')
    top_k = int(data.get('top_k', 6))
    min_score = float(data.get('min_score', 0.0))

    try:
        results = vector_service.search(
            query=query,
            top_k=top_k,
            subject_filter=subject_filter,
            min_score=min_score
        )
        return jsonify({
            "success": True,
            "query": query,
            "total_results": len(results),
            "results": results
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Search error: {str(e)}"}), 500

@api_bp.route('/exam-prep', methods=['POST'])
def exam_prep():
    """Synthesizes an exam preparation answer grounded in retrieved passages."""
    data = request.get_json(silent=True) or {}
    query = data.get('query', '').strip()
    if not query:
        return jsonify({"success": False, "error": "Question cannot be empty"}), 400

    marks = int(data.get('marks', 5))
    subject_filter = data.get('subject_filter')

    try:
        prep_response = vector_service.generate_exam_preparation_answer(
            query=query,
            marks=marks,
            subject_filter=subject_filter
        )
        return jsonify({
            "success": True,
            "data": prep_response
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Exam preparation error: {str(e)}"}), 500
