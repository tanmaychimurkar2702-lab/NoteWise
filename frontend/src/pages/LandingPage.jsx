import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ArrowRight, 
  FileText, 
  Layers, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  Database,
  Cpu,
  ChevronRight,
  Upload
} from 'lucide-react';

export default function LandingPage({ onOpenUpload }) {
  const sampleQueries = [
    "How does the CPU manage multiple tasks?",
    "What happens during a context switch?",
    "Explain deadlock prevention mechanisms.",
    "How does 3NF eliminate transitive dependencies?",
    "Why does DNS use UDP instead of TCP?"
  ];

  return (
    <div className="space-y-20 pb-16">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-gradient-to-b from-indigo-100/50 via-slate-50/20 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 px-4">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>AI-Powered Academic Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Find the <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-navy-800 bg-clip-text text-transparent">concept</span>, not just the keyword.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            NoteWise AI searches your lecture slides, textbook PDFs, and handwritten notes by conceptual meaning. Retrieve exact excerpts with page-level citations in milliseconds.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Explore Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs transition-all hover:border-slate-300 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Upload Notes</span>
            </button>
          </div>

          {/* Demonstration Search Bar Preview */}
          <div className="pt-6 max-w-2xl mx-auto">
            <div className="p-2 rounded-2xl bg-white shadow-lg border border-slate-200/90 flex items-center gap-3">
              <div className="pl-3 text-indigo-600">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                readOnly
                value="How does the CPU manage multiple tasks?"
                className="w-full text-xs sm:text-sm text-slate-800 bg-transparent focus:outline-none cursor-default"
              />
              <Link
                to="/search?q=How%20does%20the%20CPU%20manage%20multiple%20tasks%3F"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>Search Demo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Quick Demo Queries */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Try asking:</span>
              {sampleQueries.slice(0, 3).map((q, idx) => (
                <Link
                  key={idx}
                  to={`/search?q=${encodeURIComponent(q)}`}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100/80 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors border border-slate-200/60"
                >
                  "{q}"
                </Link>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Feature Comparison: Exact Keyword vs Semantic Search */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-navy-950 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Why Semantic Search Matters</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
              Traditional Ctrl+F Fails When Wording Differs
            </h2>
            <p className="text-slate-300 text-sm mt-2">
              Textbooks rarely use the exact words you type into a search bar. NoteWise AI understands academic intent and maps student questions to the underlying concepts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Traditional Keyword Box */}
            <div className="rounded-2xl bg-slate-800/60 p-6 border border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Traditional Lexical Search</span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">Keyword Dependent</span>
              </div>
              <p className="text-xs font-mono text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                Query: "How does the computer execute several jobs simultaneously?"
              </p>
              <div className="text-xs text-rose-200/90 space-y-1.5 bg-rose-950/20 p-3 rounded-xl border border-rose-900/30">
                <p className="font-semibold text-rose-300">0 matches found.</p>
                <p className="text-[11px] text-slate-400">
                  Fails because textbook chapter uses terms like "multiprogramming", "CPU scheduling", and "process context switching".
                </p>
              </div>
            </div>

            {/* NoteWise AI Semantic Box */}
            <div className="rounded-2xl bg-indigo-950/40 p-6 border border-indigo-500/30 space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">NoteWise AI Dense Vectors</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">91.8% Semantic Match</span>
              </div>
              <p className="text-xs font-mono text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                Query: "How does the computer execute several jobs simultaneously?"
              </p>
              <div className="text-xs text-slate-200 space-y-1.5 bg-indigo-900/30 p-3 rounded-xl border border-indigo-800/40">
                <p className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Retrieved: Operating_Systems.pdf (Page 1)</span>
                </p>
                <p className="text-[11px] text-slate-300 italic">
                  "...In a multiprogramming operating system, the CPU is switched among multiple processes to maximize processor utilization. When one process waits for I/O..."
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4 Feature Pillars */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Key Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Designed for College Students</h2>
          <p className="text-xs sm:text-sm text-slate-500">Every feature is built around the real workflow of revising academic material.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Dense Vector Search</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Powered by all-MiniLM-L6-v2 embeddings. 384-dimensional semantic representations map questions to conceptual passages.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Page-Level Citations</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Never hunt through 200-page slide decks. Results pinpoint the exact PDF page number and highlight matching context.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Exam Preparation Mode</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Target answers for 2, 5, 8, or 10 marks. Generates grounded explanations citing your specific course notes without hallucinations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">100% Local & Free</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No OpenAI or paid API keys required. All text parsing, vector generation, and FAISS indexing run locally on your machine.
            </p>
          </div>

        </div>
      </section>

      {/* Visual Workflow: How Document Search Works */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="rounded-3xl bg-slate-50 border border-slate-200/90 p-8 sm:p-12">
          <div className="text-center max-w-lg mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Architecture Pipeline</span>
            <h2 className="text-2xl font-extrabold text-slate-900">How NoteWise AI Indexes Your Notes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold text-xs">1</div>
              <h4 className="text-xs font-bold text-slate-900">PDF Ingestion</h4>
              <p className="text-[11px] text-slate-500">PyMuPDF extracts raw text per page while preserving page numbers.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold text-xs">2</div>
              <h4 className="text-xs font-bold text-slate-900">Sliding Chunker</h4>
              <p className="text-[11px] text-slate-500">500-character overlapping chunks preserve sentence semantics.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold text-xs">3</div>
              <h4 className="text-xs font-bold text-slate-900">Dense Vectors</h4>
              <p className="text-[11px] text-slate-500">MiniLM-L6-v2 transforms chunks into 384-dimensional embeddings.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold text-xs">4</div>
              <h4 className="text-xs font-bold text-slate-900">FAISS Index</h4>
              <p className="text-[11px] text-slate-500">High-speed inner product search retrieves cosine-similar chunks.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center font-bold text-xs">5</div>
              <h4 className="text-xs font-bold text-slate-900">Page Retrieval</h4>
              <p className="text-[11px] text-slate-500">Student sees ranked excerpts and opens the exact PDF page.</p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
