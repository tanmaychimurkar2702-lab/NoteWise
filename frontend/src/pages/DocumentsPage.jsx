import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Trash2, 
  Upload, 
  RefreshCw, 
  Search, 
  Filter, 
  ExternalLink, 
  BookOpen, 
  Layers, 
  AlertTriangle, 
  CheckCircle2,
  FolderOpen,
  Calendar,
  HardDrive
} from 'lucide-react';
import { api } from '../services/api';

export default function DocumentsPage({ onOpenUpload }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [actionMessage, setActionMessage] = useState(null);
  const [reindexing, setReindexing] = useState(false);
  const [subjectsList, setSubjectsList] = useState(['All']);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.getDocuments(subjectFilter, search);
      if (res.success) {
        setDocuments(res.data);
        const uniqueSubjects = ['All', ...new Set(res.data.map(d => d.subject))];
        setSubjectsList(uniqueSubjects);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [subjectFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDocuments();
  };

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Are you sure you want to remove '${filename}'? This will delete its vector embeddings as well.`)) {
      return;
    }

    try {
      const res = await api.deleteDocument(docId);
      if (res.success) {
        setActionMessage({ type: 'success', text: `Document '${filename}' was removed.` });
        loadDocuments();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to delete document.' });
    }
  };

  const handleReindex = async () => {
    try {
      setReindexing(true);
      const res = await api.reindexAll();
      if (res.success) {
        setActionMessage({ type: 'success', text: `Vector index successfully refreshed (${res.total_vectors} vectors).` });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to re-index vector store.' });
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Academic Document Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your uploaded lecture slides, textbooks, and notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReindex}
            disabled={reindexing || documents.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            title="Rebuild FAISS index from stored database chunks"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${reindexing ? 'animate-spin' : ''}`} />
            <span>Re-Index Store</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Notes</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {actionMessage && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between ${
          actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </form>

        {/* Subject Filter */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {subjectsList.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/4 mx-auto"></div>
          <div className="h-32 bg-slate-100 rounded-xl"></div>
        </div>
      ) : documents.length > 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Pages</th>
                  <th className="py-3 px-4">Chunks</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Date Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Name & Type */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/viewer/${doc.id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block truncate max-w-xs"
                          >
                            {doc.filename}
                          </Link>
                          {doc.has_extractable_text === 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              Scanned PDF (No text)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {doc.subject}
                      </span>
                    </td>

                    {/* Pages */}
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}
                    </td>

                    {/* Chunks */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{doc.chunk_count}</span>
                      <span className="text-slate-400 text-[11px]"> vectors</span>
                    </td>

                    {/* Size */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/viewer/${doc.id}`}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          title="Open Document in Viewer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No documents found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? `No materials match "${search}".` : 'You have not uploaded any lecture materials yet.'}
          </p>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Notes</span>
          </button>
        </div>
      )}

    </div>
  );
}
