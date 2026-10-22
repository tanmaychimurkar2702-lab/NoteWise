import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Loader2, 
  Copy, 
  Check, 
  ExternalLink,
  Award
} from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_EXAM_QUESTIONS = [
  { text: "Explain normalization for 8 marks.", marks: 8 },
  { text: "Compare FCFS and Round Robin CPU scheduling.", marks: 5 },
  { text: "Explain the working of deadlock prevention.", marks: 5 },
  { text: "Give important points about database indexing.", marks: 5 },
  { text: "Explain the role of DNS in converting domain names to IP addresses.", marks: 8 }
];

export default function ExamPrepPage() {
  const [query, setQuery] = useState('');
  const [marks, setMarks] = useState(8);
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (q = query, m = marks) => {
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await api.examPrep({
        query: q.trim(),
        marks: m,
        subjectFilter: subjectFilter === 'All' ? null : subjectFilter
      });

      if (res.success) {
        setResponse(res.data);
      } else {
        setError(res.error || 'Failed to generate exam response');
      }
    } catch (err) {
      setError(err.message || 'Error executing exam preparation query.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnswer = () => {
    if (response?.answer) {
      navigator.clipboard.writeText(response.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Curriculum-Grounded Exam Mode</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Exam Preparation Assistant
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Generate structured, mark-targeted answers synthesized directly from your uploaded lecture notes with page citations. Zero external hallucinations.
        </p>
      </div>

      {/* Query & Configuration Box */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200/90 shadow-md space-y-5">
        
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Exam Question or Syllabus Concept
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 'Explain normalization for 8 marks.' or 'Compare FCFS and Round Robin'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              onClick={() => handleGenerate()}
              disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Answer</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Target Marks & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
          
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>Target Marks Weightage:</span>
            </span>
            <div className="flex items-center gap-1">
              {[2, 5, 8, 10].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMarks(m)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    marks === m
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m} Marks
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Subject:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none"
            >
              <option value="All">All Subjects</option>
              <option value="Operating Systems">Operating Systems</option>
              <option value="Database Systems">Database Systems</option>
              <option value="Computer Networks">Computer Networks</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
            </select>
          </div>

        </div>

        {/* Preset Sample Prompts */}
        <div className="pt-2">
          <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
            Sample University Exam Questions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_EXAM_QUESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(item.text);
                  setMarks(item.marks);
                  handleGenerate(item.text, item.marks);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 hover:bg-purple-50 hover:text-purple-700 text-slate-600 border border-slate-200/60 transition-colors cursor-pointer text-left"
              >
                "{item.text}" ({item.marks}M)
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Display */}
      {response && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Answer Card */}
          <div className="rounded-2xl bg-white p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                  {response.marks} Marks Formulation
                </span>
                {response.grounded ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Grounded in Course Notes</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Insufficient Evidence</span>
                  </span>
                )}
              </div>

              <button
                onClick={handleCopyAnswer}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Answer'}</span>
              </button>
            </div>

            {/* Answer Body */}
            <div className="prose prose-sm max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
              {response.answer}
            </div>

          </div>

          {/* Supporting Citations Section */}
          {response.citations && response.citations.length > 0 && (
            <div className="rounded-2xl bg-slate-50 p-6 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Supporting Syllabus Citations ({response.citations.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {response.citations.map((cite, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                        {cite.filename}
                      </span>
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        Page {cite.page_number}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic line-clamp-3 bg-slate-50 p-2 rounded-lg">
                      "{cite.excerpt}"
                    </p>
                    <Link
                      to={`/viewer/${cite.document_id}?page=${cite.page_number}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline pt-1"
                    >
                      <span>Verify in PDF at Page {cite.page_number}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
