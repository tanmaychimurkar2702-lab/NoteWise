import os
import pymupdf

SAMPLES_DIR = os.path.dirname(os.path.abspath(__file__))

def create_pdf(filename: str, title: str, pages_content: list):
    pdf_path = os.path.join(SAMPLES_DIR, filename)
    doc = pymupdf.open()
    
    for page_num, text in enumerate(pages_content, 1):
        page = doc.new_page(width=595, height=842) # A4 size
        # Header banner
        page.draw_rect(pymupdf.Rect(40, 40, 555, 75), color=(0.15, 0.23, 0.36), fill=(0.15, 0.23, 0.36))
        page.insert_text(pymupdf.Point(50, 62), f"NoteWise Academic Notes: {title}", fontsize=14, color=(1, 1, 1))
        page.insert_text(pymupdf.Point(50, 825), f"Page {page_num} of {len(pages_content)}  |  NoteWise AI Demo Material", fontsize=9, color=(0.5, 0.5, 0.5))
        
        # Insert body text
        rect = pymupdf.Rect(50, 95, 545, 800)
        page.insert_textbox(rect, text, fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))
        
    doc.save(pdf_path)
    doc.close()
    print(f"Created sample PDF: {pdf_path}")

def generate_all_samples():
    os.makedirs(SAMPLES_DIR, exist_ok=True)

    # 1. Operating Systems Notes
    os_p1 = """CHAPTER 4: CPU SCHEDULING AND MULTIPROGRAMMING

4.1 Concept of CPU Scheduling
In a multiprogramming operating system, the CPU is switched among multiple processes to maximize processor utilization. When one process waits for an I/O operation to complete, the operating system takes the CPU away from that process and allocates it to another ready process. This scheduling mechanism ensures that the central processing unit does not remain idle.

4.2 The Process Scheduler and Queues
Processes enter the system and reside in the Ready Queue, waiting for allocation of CPU core time. The short-term scheduler (or CPU scheduler) selects a process from those in memory that are ready to execute and allocates the CPU to it.

4.3 Context Switching
When the CPU switches from executing process P1 to process P2, the kernel must save the state and context of P1 in its Process Control Block (PCB) and load the saved state of P2. This procedure is called a context switch. During a context switch, the CPU performs no productive user work; therefore, context-switch speed is critical to overall system throughput. State details saved include program counter, CPU registers, memory management registers, and I/O status information."""

    os_p2 = """4.4 Scheduling Algorithms and Policies

4.4.1 First-Come, First-Served (FCFS) Scheduling
FCFS is the simplest non-preemptive CPU scheduling algorithm. The process that requests the CPU first is allocated the CPU first. While straightforward to implement with a FIFO queue, FCFS suffers from the 'convoy effect', where short processes get stuck waiting behind long, CPU-heavy processes, resulting in high average turnaround and waiting times.

4.4.2 Shortest-Job-First (SJF) Scheduling
SJF associates each process with the length of its next CPU burst. The process having the shortest expected CPU burst time is assigned the CPU first. SJF is provably optimal because it yields the minimum average waiting time for a given set of processes. Its preemptive variant is called Shortest-Remaining-Time-First (SRTF).

4.4.3 Round Robin (RR) Scheduling
Designed specifically for time-sharing systems, Round Robin defines a small unit of time called a time quantum (typically 10 to 100 milliseconds). The ready queue is treated as a circular queue. The scheduler traverses the queue, allocating the CPU to each process for a duration up to one time slice. If the process does not terminate within the time quantum, it is preempted and returned to the end of the ready queue."""

    os_p3 = """4.5 Deadlocks and Synchronization

4.5.1 Deadlock Conditions
A deadlock occurs when two or more processes are permanently blocked because each holds a resource that the other requires. Four necessary conditions must hold simultaneously for a deadlock to arise:
1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.
2. Hold and Wait: A process must hold at least one resource and simultaneously wait to acquire other resources held by other processes.
3. No Preemption: Resources cannot be forcibly taken from a process holding them; they must be voluntarily released.
4. Circular Wait: A closed chain of processes exists such that each process holds resources requested by the next process in the chain.

4.5.2 Deadlock Prevention Methods
Deadlock prevention ensures that at least one of the four necessary conditions can never hold. For example, to prevent circular wait, the operating system can impose a total ordering on all resource types and require that every process requests resources in strictly increasing order of enumeration."""

    create_pdf("Operating_Systems_Process_and_Scheduling.pdf", "Operating Systems", [os_p1, os_p2, os_p3])

    # 2. DBMS Normalization and Indexing
    dbms_p1 = """UNIT 3: RELATIONAL DATABASE DESIGN & NORMALIZATION

3.1 Purpose of Database Normalization
Normalization is a systematic technique of designing relational schemas to minimize data redundancy and eliminate update, insertion, and deletion anomalies. By decomposing tables with excessive dependencies into smaller, well-structured relations, normalization ensures that every non-key attribute directly depends on candidate keys.

3.2 First Normal Form (1NF)
A relation is in First Normal Form if every attribute contains only atomic (indivisible) values, and there are no repeating groups or multivalued columns within any tuple. Every row must be uniquely identifiable by a primary key.

3.3 Second Normal Form (2NF)
A relation is in Second Normal Form if it is in 1NF and contains no partial functional dependencies. That is, every non-prime attribute must be fully functionally dependent on the entire primary key, rather than on a proper subset of a composite candidate key. If the primary key is a single attribute, 1NF relations automatically satisfy 2NF."""

    dbms_p2 = """3.4 Third Normal Form (3NF) and Boyce-Codd Normal Form (BCNF)

3.4.1 Third Normal Form (3NF)
A schema is in 3NF if it is in 2NF and there is no transitive dependency. Formally, for every non-trivial functional dependency X -> Y, either X is a superkey, or Y is a prime attribute. In simple terms, non-key attributes must depend on nothing except the primary key.

3.4.2 Boyce-Codd Normal Form (BCNF)
BCNF is a stricter form of 3NF. A relation is in BCNF if for every functional dependency X -> Y, X must be a superkey. BCNF resolves anomalies arising when a table has overlapping candidate keys.

3.5 Indexing Techniques in Relational Databases
Database indexing optimizes data retrieval speed without scanning every disk block:
1. B-Tree and B+ Tree Indexing: Balanced search trees that keep data sorted and allow search, sequential access, insertions, and deletions in logarithmic time O(log n). B+ trees store all records in leaf nodes linked sequentially, making range queries exceptionally efficient.
2. Hash Indexing: Uses an internal hash function to map search keys to specific disk buckets, offering O(1) average lookup time for point queries (exact equality matches), but unable to support range comparisons."""

    create_pdf("DBMS_Normalization_and_Indexing.pdf", "Database Systems", [dbms_p1, dbms_p2])

    # 3. Computer Networks Notes
    cn_p1 = """CHAPTER 5: APPLICATION LAYER AND DOMAIN NAME SYSTEM (DNS)

5.1 The Domain Name System (DNS)
Humans remember mnemonic host names such as 'university.edu' or 'wikipedia.org', while IP routers require numerical IP addresses (e.g., 192.0.2.1 for IPv4 or 2001:db8::1 for IPv6). The Domain Name System provides a globally distributed, hierarchical database that translates human-friendly host names into numerical IP addresses.

5.2 DNS Resolution Hierarchy
The DNS namespace is organized into a tree hierarchy:
1. Root DNS Servers: Top of the tree; contact Top-Level Domain (TLD) servers.
2. TLD Servers: Manage domains such as .com, .org, .edu, and country codes like .in or .uk.
3. Authoritative DNS Servers: Host the actual DNS resource records for specific organizations.
4. Local DNS Resolver / Cache: Caches mappings locally to speed up subsequent queries and reduce network round-trips.

5.3 Transport Layer: TCP vs UDP
- Transmission Control Protocol (TCP): Connection-oriented, reliable protocol providing flow control, congestion control, and ordered segment delivery via a 3-way handshake (SYN, SYN-ACK, ACK).
- User Datagram Protocol (UDP): Connectionless, lightweight transport protocol with no guaranteed delivery, minimal overhead, and low latency, widely used for DNS queries, video streaming, and VoIP."""

    create_pdf("Computer_Networks_DNS_and_Protocols.pdf", "Computer Networks", [cn_p1])

    # 4. Text Notes on Machine Learning
    ml_txt_path = os.path.join(SAMPLES_DIR, "Machine_Learning_Fundamentals.txt")
    with open(ml_txt_path, "w", encoding="utf-8") as f:
        f.write("""MACHINE LEARNING & VECTOR EMBEDDINGS LECTURE NOTES

Supervised Learning vs Unsupervised Learning:
Supervised learning trains models using labeled datasets where ground truth outputs are provided (e.g. classification and regression). Unsupervised learning identifies underlying patterns, clusters, and representations from unlabeled inputs (e.g. K-Means clustering, PCA).

Semantic Embeddings in NLP:
Traditional keyword search relies on Lexical Matching (such as TF-IDF or BM25), which searches for exact words. Semantic search converts words, sentences, or paragraphs into dense vector representations in high-dimensional continuous vector space. Models like Sentence-BERT (MiniLM-L6-v2) capture contextual semantics: synonyms, paraphrases, and conceptual meaning.

Vector Similarity Metrics:
1. Cosine Similarity: Measures the cosine of the angle between two multi-dimensional vectors. When vectors are L2-normalized, cosine similarity equals the dot product (inner product).
2. Euclidean Distance (L2): Geometric distance between points.
FAISS (Facebook AI Similarity Search) provides high-performance vector indexing allowing billion-scale retrieval in sub-millisecond latencies.""")
    print(f"Created sample text file: {ml_txt_path}")

    # 5. Scanned / Empty PDF simulation
    scanned_path = os.path.join(SAMPLES_DIR, "Scanned_Handwritten_Notes_Sample.pdf")
    doc_scan = pymupdf.open()
    page_scan = doc_scan.new_page(width=595, height=842)
    # Draw shapes only (no extractable text) to simulate image scans
    page_scan.draw_rect(pymupdf.Rect(50, 50, 545, 800), color=(0.8, 0.8, 0.8), width=2)
    page_scan.draw_circle(pymupdf.Point(300, 400), 100, color=(0.2, 0.4, 0.8), width=3)
    doc_scan.save(scanned_path)
    doc_scan.close()
    print(f"Created simulated scanned PDF: {scanned_path}")

if __name__ == "__main__":
    generate_all_samples()
