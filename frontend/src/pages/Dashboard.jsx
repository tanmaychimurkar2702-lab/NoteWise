import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Layers, 
  Search, 
  Upload, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Tag, 
  BarChart3, 
  AlertCircle,
  FolderOpen,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import StatCard from '../components/StatCard';

export default function Dashboard({ onOpenUpload }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  const hasDocs = stats && stats.total_documents > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Quick Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Academic Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time vector index statistics and quick semantic queries across your library.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/25 transition-all self-start md:self-auto cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Notes</span>
        </button>
      </div>

      {/* Prominent Search Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-navy-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Instant Semantic Querying</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Ask any academic question across all your notes
          </h2>
          <form onSubmit={handleQuickSearch} className="flex items-center gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. How does CPU scheduling prevent starvation? or What is 3NF?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold text-xs sm:text-sm transition-colors shrink-0 shadow-sm cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* 4 Dynamic Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Documents"
          value={stats?.total_documents || 0}
          subtitle="Uploaded PDFs & TXTs"
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title="Indexed Pages"
          value={stats?.total_pages || 0}
          subtitle="Processed via PyMuPDF"
          icon={BookOpen}
          color="emerald"
        />
        <StatCard
          title="Searchable Chunks"
          value={stats?.total_chunks || 0}
          subtitle="500-char overlapping units"
          icon={Layers}
          color="purple"
        />
        <StatCard
          title="Vector Dimension"
          value="384d"
          subtitle="all-MiniLM-L6-v2 FAISS"
          icon={Sparkles}
          color="amber"
        />
      </div>

      {/* Two Column Layout: Subject Distribution & Recent Searches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Subject-Wise Document Distribution */}
        <div className="lg:col-span-1 rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Subject Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {Object.keys(stats?.subject_distribution || {}).length} Subjects
            </span>
          </div>

          {stats?.subject_distribution && Object.keys(stats.subject_distribution).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.subject_distribution).map(([subj, count]) => {
                const percentage = stats.total_documents > 0 ? Math.round((count / stats.total_documents) * 100) : 0;
                return (
                  <div key={subj} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[180px]">{subj}</span>
                      <span className="font-semibold text-slate-900">{count} docs ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No documents uploaded yet.</p>
            </div>
          )}
        </div>

        {/* Recent Search Queries */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Recently Searched Queries</span>
            </h3>
            <Link to="/search" className="text-xs font-semibold text-indigo-600 hover:underline">
              Search Page &rarr;
            </Link>
          </div>

          {stats?.recent_searches && stats.recent_searches.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recent_searches.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <Link
                      to={`/search?q=${encodeURIComponent(item.query)}`}
                      className="font-medium text-slate-800 hover:text-indigo-600 transition-colors truncate block"
                    >
                      "{item.query}"
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{item.result_count} passages retrieved</span>
                      <span>•</span>
                      <span>Top score: {item.top_score}%</span>
                    </div>
                  </div>
                  <Link
                    to={`/search?q=${encodeURIComponent(item.query)}`}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold text-[11px] transition-colors"
                  >
                    Replay
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent search queries recorded yet.</p>
            </div>
          )}
        </div>

      </div>

      {/* Recent Documents Table */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recently Uploaded Documents</h3>
            <p className="text-xs text-slate-500">Your latest uploaded lecture notes and slide decks</p>
          </div>
          <Link to="/documents" className="text-xs font-semibold text-indigo-600 hover:underline">
            View All in Library &rarr;
          </Link>
        </div>

        {hasDocs ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3 pr-4">Document Name</th>
                  <th className="pb-3 px-4">Subject</th>
                  <th className="pb-3 px-4">Pages</th>
                  <th className="pb-3 px-4">Chunks</th>
                  <th className="pb-3 px-4">Uploaded</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recent_documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 pr-4 font-semibold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate max-w-xs">{doc.filename}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {doc.subject}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{doc.page_count} pages</td>
                    <td className="py-3.5 px-4 text-slate-600">{doc.chunk_count} chunks</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 pl-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/viewer/${doc.id}`}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold text-[11px] transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          to={`/search?subject=${encodeURIComponent(doc.subject)}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium text-[11px] transition-colors"
                        >
                          Search
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Your note library is empty</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload your first Operating Systems, Database, or Computer Networks PDF notes to begin semantic searching.
            </p>
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Your First Note</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
