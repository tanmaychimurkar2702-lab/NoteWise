import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Sparkles, 
  ArrowUpDown, 
  Layers, 
  AlertCircle, 
  HelpCircle,
  FileQuestion,
  Loader2,
  X
} from 'lucide-react';
import { api } from '../services/api';
import ResultCard from '../components/ResultCard';

const SUGGESTED_QUERIES = [
  "How does an operating system manage multiple processes?",
  "What happens when the CPU switches from one task to another?",
  "Explain the different methods of CPU scheduling.",
  "How does normalization reduce database redundancy?",
  "Explain the role of DNS in converting domain names to IP addresses."
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialSubject = searchParams.get('subject') || 'All';

  const [query, setQuery] = useState(initialQuery);
  const [subjectFilter, setSubjectFilter] = useState(initialSubject);
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance' | 'page' | 'name'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [searchTimeMs, setSearchTimeMs] = useState(null);
  const [subjectsList, setSubjectsList] = useState(['All']);

  // Fetch subjects for filter dropdown
  useEffect(() => {
    api.getDashboardStats()
      .then(res => {
        if (res.success && res.data.subject_distribution) {
          const keys = Object.keys(res.data.subject_distribution);
          setSubjectsList(['All', ...keys]);
        }
      })
      .catch(() => {});
  }, []);

  // Execute search when URL query param changes
  useEffect(() => {
    const q = searchParams.get('q');
    const s = searchParams.get('subject');
    if (q) {
      setQuery(q);
      if (s) setSubjectFilter(s);
      performSearch(q, s || subjectFilter);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery, subject) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    const startTime = performance.now();

    try {
      const response = await api.search({
        query: searchQuery.trim(),
        subjectFilter: subject,
        topK: 10,
        minScore: 0,
      });

      setSearchTimeMs(Math.round(performance.now() - startTime));
      if (response.success) {
        setResults(response.results);
      } else {
        setError(response.error || 'Search encountered an issue');
      }
    } catch (err) {
      setError(err.message || 'Failed to complete semantic search.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query.trim(), subject: subjectFilter });
    performSearch(query, subjectFilter);
  };

  const handleSuggestionClick = (suggested) => {
    setQuery(suggested);
    setSearchParams({ q: suggested, subject: subjectFilter });
    performSearch(suggested, subjectFilter);
  };

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'relevance') {
      return b.similarity_score - a.similarity_score;
    } else if (sortBy === 'page') {
      return a.page_number - b.page_number;
    } else if (sortBy === 'name') {
      return a.filename.localeCompare(b.filename);
    }
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title */}
      <div className="max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Natural Language Semantic Search
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Search by conceptual meaning. Retrieve relevant textbook paragraphs, formulas, and slide excerpts.
        </p>
      </div>

      {/* Main Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-slate-200/90 shadow-md focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <div className="pl-3 text-indigo-600">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Ask anything, e.g., 'What happens during a context switch?' or 'Explain 3NF database design'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Searching...</span>
              </span>
            ) : (
              <span>Search</span>
            )}
          </button>
        </div>
      </form>

      {/* Quick Suggestions Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
          <HelpCircle className="w-3 h-3" />
          <span>Suggestions:</span>
        </span>
        {SUGGESTED_QUERIES.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSuggestionClick(s)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200/60 transition-colors cursor-pointer text-left truncate max-w-xs"
          >
            "{s}"
          </button>
        ))}
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 border-b border-slate-200/80 text-xs">
        
        {/* Results Count & Response Time */}
        <div className="flex items-center gap-2 text-slate-600">
          {searched && (
            <>
              <span className="font-semibold text-slate-900">
                {results.length} relevant {results.length === 1 ? 'passage' : 'passages'} found
              </span>
              {searchTimeMs !== null && (
                <span className="text-slate-400 text-[11px]">
                  ({searchTimeMs} ms)
                </span>
              )}
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                if (query.trim()) performSearch(query, e.target.value);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {subjectsList.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Subjects' : s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="relevance">Sort: Highest Match</option>
              <option value="page">Sort: Page Number</option>
              <option value="name">Sort: Document Name</option>
            </select>
          </div>

        </div>

      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
              <div className="h-16 bg-slate-100 rounded-xl"></div>
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Results List */}
      {!loading && searched && sortedResults.length > 0 && (
        <div className="space-y-4">
          {sortedResults.map((result, idx) => (
            <ResultCard key={result.chunk_id} result={result} rank={idx + 1} />
          ))}
        </div>
      )}

      {/* Empty State: Searched but 0 Results */}
      {!loading && searched && sortedResults.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No matching passages found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find semantically relevant content for "{query}" under the selected subject filter.
          </p>
          <div className="pt-2 text-xs text-indigo-600 font-semibold space-y-1">
            <p>&bull; Try rephrasing your question</p>
            <p>&bull; Switch subject filter to "All Subjects"</p>
            <p>&bull; Upload notes covering this topic</p>
          </div>
        </div>
      )}

      {/* Initial Empty State: Before search */}
      {!searched && !loading && (
        <div className="text-center py-16 bg-slate-50/60 rounded-2xl border border-slate-200/60 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Ready to search your materials</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Type any question in natural language above or click one of the suggested sample questions to see semantic retrieval in action.
          </p>
        </div>
      )}

    </div>
  );
}
