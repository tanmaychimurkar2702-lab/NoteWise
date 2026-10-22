import os
import hashlib
import re
import uuid
from typing import List, Dict, Any, Tuple
from werkzeug.utils import secure_filename
import pymupdf

ALLOWED_EXTENSIONS = {'.pdf', '.txt'}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB

def is_allowed_file(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS

def compute_file_hash(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()

def generate_safe_filename(original_filename: str) -> str:
    base = secure_filename(original_filename)
    if not base:
        base = "document"
    unique_suffix = uuid.uuid4().hex[:8]
    name, ext = os.path.splitext(base)
    return f"{name}_{unique_suffix}{ext.lower()}"

def extract_text_from_file(file_path: str, file_type: str) -> Tuple[List[Dict[str, Any]], bool, int]:
    """
    Extracts text per page from PDF or TXT file.
    Returns:
        (pages_data, has_extractable_text, total_pages)
        where pages_data is [{'page_number': 1, 'text': '...'}]
    """
    pages_data = []
    has_extractable_text = False

    if file_type.lower() == 'pdf':
        try:
            doc = pymupdf.open(file_path)
            total_pages = len(doc)
            for page_idx in range(total_pages):
                page = doc.load_page(page_idx)
                text = page.get_text("text").strip()
                if text:
                    has_extractable_text = True
                pages_data.append({
                    "page_number": page_idx + 1,
                    "text": text
                })
            doc.close()
        except Exception as e:
            raise ValueError(f"Failed to read PDF document: {str(e)}")
    elif file_type.lower() == 'txt':
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read().strip()
            total_pages = 1
            if content:
                has_extractable_text = True
            pages_data.append({
                "page_number": 1,
                "text": content
            })
        except Exception as e:
            raise ValueError(f"Failed to read TXT document: {str(e)}")
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

    return pages_data, has_extractable_text, total_pages

def chunk_text_sliding_window(
    text: str, 
    page_number: int, 
    start_chunk_idx: int,
    chunk_size: int = 500, 
    overlap: int = 100
) -> List[Dict[str, Any]]:
    """
    Splits page text into clean, contextual overlapping chunks preserving sentence boundaries where possible.
    """
    text = re.sub(r'[ \t]+', ' ', text).strip()
    if not text:
        return []

    # If text is smaller than chunk_size, return single chunk
    if len(text) <= chunk_size:
        return [{
            "chunk_index": start_chunk_idx,
            "page_number": page_number,
            "content": text,
            "char_count": len(text)
        }]

    # Paragraph/sentence boundary aware chunking
    chunks = []
    current_idx = start_chunk_idx
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size

        if end >= text_len:
            chunk_content = text[start:].strip()
            if chunk_content:
                chunks.append({
                    "chunk_index": current_idx,
                    "page_number": page_number,
                    "content": chunk_content,
                    "char_count": len(chunk_content)
                })
            break

        # Look for natural punctuation breakpoint near the end
        boundary = -1
        for punct in ['. ', '.\n', '?\n', '? ', '!\n', '! ', '\n\n', '\n']:
            found = text.rfind(punct, start + int(chunk_size * 0.6), end)
            if found != -1 and found > boundary:
                boundary = found + len(punct)

        # Fallback to space breakpoint
        if boundary == -1:
            space_boundary = text.rfind(' ', start + int(chunk_size * 0.6), end)
            if space_boundary != -1:
                boundary = space_boundary + 1
            else:
                boundary = end

        chunk_content = text[start:boundary].strip()
        if chunk_content:
            chunks.append({
                "chunk_index": current_idx,
                "page_number": page_number,
                "content": chunk_content,
                "char_count": len(chunk_content)
            })
            current_idx += 1

        # Advance start position taking overlap into account
        start = max(start + 1, boundary - overlap)

    return chunks

def process_document_into_chunks(pages_data: List[Dict[str, Any]], chunk_size: int = 500, overlap: int = 100) -> List[Dict[str, Any]]:
    """
    Processes all pages into ordered chunks with continuous chunk indices and accurate page numbers.
    """
    all_chunks = []
    chunk_counter = 0

    for page in pages_data:
        page_num = page["page_number"]
        page_text = page["text"]
        if not page_text:
            continue
        
        page_chunks = chunk_text_sliding_window(
            text=page_text,
            page_number=page_num,
            start_chunk_idx=chunk_counter,
            chunk_size=chunk_size,
            overlap=overlap
        )
        for c in page_chunks:
            all_chunks.append(c)
            chunk_counter += 1

    return all_chunks
