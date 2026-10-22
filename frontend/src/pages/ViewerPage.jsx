import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Layers, 
  ExternalLink, 
  Download, 
  AlertCircle,
  BookOpen,
  Sparkles,
  Search
} from 'lucide-react';
import { api } from '../services/api';

export default function ViewerPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [doc, setDoc] = useState(null);
  const [pageInfo, setPageInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDocument();
  }, [id]);

  useEffect(() => {
    if (doc) {
      loadPageData(currentPage);
    }
  }, [id, currentPage, doc]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDocumentDetails(id);
      if (res.success) {
        setDoc(res.data);
      } else {
        setError(res.error || 'Failed to load document');
      }
    } catch (err) {
      setError(err.message || 'Error fetching document');
    } finally {
      setLoading(false);
    }
  };

  const loadPageData = async (pageNum) => {
    try {
      const res = await api.getPageInfo(id, pageNum);
      if (res.success) {
        setPageInfo(res.data);
      }
    } catch (err) {
      console.error('Error loading page details:', err);
    }
  };

  const goToPage = (num) => {
    if (!doc) return;
    const target = Math.max(1, Math.min(doc.page_count, num));
    setCurrentPage(target);
    setSearchParams({ page: target.toString() });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/4 mx-auto"></div>
        <div className="h-96 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Document Unavailable</h2>
        <p className="text-xs text-slate-500">{error || 'Requested note could not be retrieved.'}</p>
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>
      </div>
    );
  }

  const fileUrl = api.getFileUrl(doc.id);
  const isPdf = doc.file_type === 'PDF';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      
      {/* Top Navigation & Metadata Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        
        <div className="flex items-center gap-3">
          <Link
            to="/documents"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title="Back to Document Library"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-md">
              {doc.filename}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-indigo-600">{doc.subject}</span>
              <span>•</span>
              <span>{doc.page_count} {doc.page_count === 1 ? 'Page' : 'Pages'}</span>
              <span>•</span>
              <span>{doc.chunk_count} Chunks</span>
            </div>
          </div>
        </div>

        {/* Page Navigation Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs text-xs">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2 font-semibold text-slate-800">
              Page {currentPage} of {doc.page_count}
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= doc.page_count}
              className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-xs font-medium flex items-center gap-1.5"
            title="Open file in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

      </div>

      {/* Main Split Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PDF / File Embed View (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-[750px]">
          {isPdf ? (
            <iframe
              key={`${fileUrl}-page-${currentPage}`}
              src={`${fileUrl}#page=${currentPage}`}
              title={doc.filename}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 leading-relaxed bg-slate-50 h-full whitespace-pre-wrap">
              {doc.chunks && doc.chunks.map(c => c.content).join('\n\n')}
            </div>
          )}
        </div>

        {/* Side Panel: Contextual Retreival & Page Chunks (1 col) */}
        <div className="lg:col-span-1 rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-4 flex flex-col h-[750px]">
          
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Page {currentPage} Semantic Chunks</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Overlapping passages indexed into FAISS for this page
            </p>
          </div>

          {/* Chunks List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {pageInfo?.chunks && pageInfo.chunks.length > 0 ? (
              pageInfo.chunks.map((chunk, idx) => (
                <div
                  key={chunk.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span>Chunk #{chunk.chunk_index + 1}</span>
                    <span>{chunk.char_count} chars</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-sans">
                    {chunk.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No text chunks extracted for Page {currentPage}.</p>
                {doc.has_extractable_text === 0 && (
                  <p className="text-[11px] text-amber-600 mt-2 font-medium">
                    This file contains scanned or image-based pages without selectable text.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Query CTA */}
          <div className="pt-3 border-t border-slate-100">
            <Link
              to={`/search?subject=${encodeURIComponent(doc.subject)}`}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search in {doc.subject}</span>
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
