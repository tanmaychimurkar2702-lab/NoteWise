import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ExternalLink, 
  Copy, 
  Check, 
  Tag, 
  BookOpen, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function ResultCard({ result, rank }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.excerpt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const score = result.similarity_score;
  const getScoreBadge = () => {
    if (score >= 60) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        bar: 'bg-emerald-500',
        label: 'High Relevance'
      };
    } else if (score >= 35) {
      return {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        bar: 'bg-indigo-500',
        label: 'Relevant'
      };
    } else {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        bar: 'bg-amber-500',
        label: 'Moderate Match'
      };
    }
  };

  const badge = getScoreBadge();

  // Highlight matched terms if any
  const renderHighlightedExcerpt = (text, matchedTerms) => {
    if (!matchedTerms || matchedTerms.length === 0) return text;
    
    // Create regex matching all matched terms
    const escaped = matchedTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    if (!escaped) return text;

    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => 
      matchedTerms.some(term => term.toLowerCase() === part.toLowerCase()) ? (
        <mark key={i} className="bg-amber-100 text-amber-900 px-0.5 rounded font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="group rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        
        {/* Document Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
              {result.filename}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <Tag className="w-3 h-3 text-slate-400" />
                {result.subject}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded-full border border-indigo-100">
                <BookOpen className="w-3 h-3" />
                Page {result.page_number} {result.total_pages > 1 ? `of ${result.total_pages}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Relevance Score Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-sm font-extrabold text-slate-900">{score}%</span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
              {badge.label}
            </span>
          </div>
        </div>

      </div>

      {/* Excerpt Passage */}
      <div className="mt-3.5 text-xs text-slate-700 leading-relaxed bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 font-sans">
        <p className="whitespace-pre-line">
          {renderHighlightedExcerpt(result.excerpt, result.matched_terms)}
        </p>
      </div>

      {/* Action Footer */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied Excerpt</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Passage</span>
            </>
          )}
        </button>

        <Link
          to={`/viewer/${result.document_id}?page=${result.page_number}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
        >
          <span>Open PDF at Page {result.page_number}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
