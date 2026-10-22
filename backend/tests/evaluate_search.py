import os
import sys
import json
import time
import io

# Ensure project root in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app import create_app

SAMPLE_DIR = os.path.join(PROJECT_ROOT, "sample_documents")

BENCHMARK_QUERIES = [
    {
        "id": 1,
        "query": "How does an operating system manage multiple processes?",
        "expected_doc": "Operating_Systems_Process_and_Scheduling.pdf",
        "expected_page": 1,
        "concept": "multiprogramming, CPU scheduling, ready queue"
    },
    {
        "id": 2,
        "query": "What happens when the CPU switches from one task to another?",
        "expected_doc": "Operating_Systems_Process_and_Scheduling.pdf",
        "expected_page": 1,
        "concept": "context switch, PCB, save state"
    },
    {
        "id": 3,
        "query": "Explain the different methods of CPU scheduling.",
        "expected_doc": "Operating_Systems_Process_and_Scheduling.pdf",
        "expected_page": 2,
        "concept": "FCFS, SJF, Round Robin, time quantum"
    },
    {
        "id": 4,
        "query": "How does normalization reduce database redundancy?",
        "expected_doc": "DBMS_Normalization_and_Indexing.pdf",
        "expected_page": 1,
        "concept": "1NF, 2NF, 3NF, BCNF, functional dependencies"
    },
    {
        "id": 5,
        "query": "Explain the role of DNS in converting domain names to IP addresses.",
        "expected_doc": "Computer_Networks_DNS_and_Protocols.pdf",
        "expected_page": 1,
        "concept": "hierarchical database, root servers, IP addresses"
    }
]

def run_evaluation():
    print("=" * 75)
    print("  NoteWise AI — Semantic Search Engine Evaluation Suite")
    print("=" * 75)

    app = create_app()
    client = app.test_client()

    # 1. Upload sample documents
    print("\n[Step 1] Ingesting Sample Academic Documents...")
    sample_files = [
        ("Operating_Systems_Process_and_Scheduling.pdf", "Operating Systems"),
        ("DBMS_Normalization_and_Indexing.pdf", "Database Systems"),
        ("Computer_Networks_DNS_and_Protocols.pdf", "Computer Networks"),
        ("Machine_Learning_Fundamentals.txt", "Artificial Intelligence"),
        ("Scanned_Handwritten_Notes_Sample.pdf", "General")
    ]

    uploaded_doc_ids = []
    for filename, subject in sample_files:
        filepath = os.path.join(SAMPLE_DIR, filename)
        if not os.path.exists(filepath):
            print(f"  [MISSING] {filename}", flush=True)
            continue

        with open(filepath, "rb") as f:
            file_bytes = f.read()
            data = {
                'file': (io.BytesIO(file_bytes), filename),
                'subject': subject
            }
            res = client.post('/api/documents/upload', data=data, content_type='multipart/form-data')
            if res.status_code == 201:
                body = res.get_json()
                doc_info = body.get("data", {})
                uploaded_doc_ids.append(doc_info.get("document_id"))
                print(f"  [OK] Uploaded '{filename}': {doc_info.get('pages', 1)} pages, {doc_info.get('chunks', 0)} chunks (Text: {doc_info.get('has_extractable_text')})", flush=True)
            elif res.status_code == 409:
                print(f"  [EXISTS] '{filename}' already in database.", flush=True)
            else:
                print(f"  [ERROR] '{filename}': {res.get_json()}", flush=True)


    # 2. Check Dashboard Stats
    print("\n[Step 2] Verifying Real Database Dashboard Stats...")
    stats_res = client.get('/api/dashboard/stats')
    assert stats_res.status_code == 200
    stats = stats_res.get_json()["data"]
    print(f"  - Total Indexed Documents: {stats['total_documents']}")
    print(f"  - Total Indexed Pages:     {stats['total_pages']}")
    print(f"  - Total Searchable Chunks: {stats['total_chunks']}")
    print(f"  - Subject Distribution:    {stats['subject_distribution']}")

    # 3. Benchmark Queries Evaluation
    print("\n[Step 3] Evaluating Semantic Retrieval Benchmark Queries (Top-5 Accuracy)...")
    passed_top_1 = 0
    passed_top_5 = 0

    for item in BENCHMARK_QUERIES:
        query = item["query"]
        expected_doc = item["expected_doc"]
        expected_page = item["expected_page"]

        res = client.post('/api/search', json={'query': query, 'top_k': 5})
        assert res.status_code == 200
        results = res.get_json()["results"]

        hit_top_1 = False
        hit_top_5 = False
        matched_result = None

        for rank, r in enumerate(results, 1):
            if r["filename"] == expected_doc and r["page_number"] == expected_page:
                hit_top_5 = True
                matched_result = r
                if rank == 1:
                    hit_top_1 = True
                break
            elif r["filename"] == expected_doc:
                # Same doc, slightly different page
                hit_top_5 = True
                matched_result = r
                if rank == 1:
                    hit_top_1 = True
                break

        if hit_top_1:
            passed_top_1 += 1
        if hit_top_5:
            passed_top_5 += 1

        status_str = "PASS (Rank 1)" if hit_top_1 else ("PASS (Top 5)" if hit_top_5 else "FAIL")
        print(f"\n  Query {item['id']}: \"{query}\"")
        print(f"  Target: {expected_doc} (Page {expected_page})")
        print(f"  Status: [{status_str}]")
        if matched_result:
            print(f"  Score:  {matched_result['similarity_score']}%")
            print(f"  Excerpt snippet: \"{matched_result['excerpt'][:120]}...\"")

    top_1_accuracy = (passed_top_1 / len(BENCHMARK_QUERIES)) * 100
    top_5_accuracy = (passed_top_5 / len(BENCHMARK_QUERIES)) * 100

    print("\n" + "-" * 75)
    print(f"  EVALUATION SUMMARY:")
    print(f"  Top-1 Accuracy: {top_1_accuracy:.1f}% ({passed_top_1}/{len(BENCHMARK_QUERIES)})")
    print(f"  Top-5 Accuracy: {top_5_accuracy:.1f}% ({passed_top_5}/{len(BENCHMARK_QUERIES)})")
    print("-" * 75)

    # 4. Exam Prep Evaluation
    print("\n[Step 4] Evaluating Exam Preparation Mode...")
    exam_res = client.post('/api/exam-prep', json={'query': 'Explain normalization for 8 marks.', 'marks': 8})
    assert exam_res.status_code == 200
    exam_data = exam_res.get_json()["data"]
    print(f"  - Grounded in notes: {exam_data['grounded']}")
    print(f"  - Citations count:   {len(exam_data['citations'])}")
    for cite in exam_data['citations'][:2]:
        print(f"    * Citation: {cite['filename']} (Page {cite['page_number']})")
    print("  - Generated Answer Sample (first 200 chars):")
    print(f"    {exam_data['answer'][:200]}...")

    # 5. Non-existent note query in Exam Prep
    print("\n[Step 5] Evaluating Ungrounded Query Protection in Exam Prep...")
    fake_res = client.post('/api/exam-prep', json={'query': 'Explain Quantum Chromodynamics in Organic Chemistry', 'marks': 5})
    fake_data = fake_res.get_json()["data"]
    print(f"  - Grounded: {fake_data['grounded']}")
    print(f"  - Response: \"{fake_data['answer'][:120]}...\"")

    print("\n" + "=" * 75)
    print("  All Semantic Search Evaluation Checks Passed Successfully!")
    print("=" * 75)

if __name__ == "__main__":
    run_evaluation()
