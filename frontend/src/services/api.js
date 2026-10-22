const API_BASE = '/api';

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  // Document Management
  getDocuments: async (subject, search) => {
    const params = new URLSearchParams();
    if (subject && subject !== 'All') params.append('subject', subject);
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/documents?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  getDocumentDetails: async (docId) => {
    const res = await fetch(`${API_BASE}/documents/${docId}`);
    if (!res.ok) throw new Error('Failed to fetch document details');
    return res.json();
  },

  uploadDocument: async (file, subject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject || 'General');

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  },

  deleteDocument: async (docId) => {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete document');
    }
    return data;
  },

  reindexAll: async () => {
    const res = await fetch(`${API_BASE}/documents/reindex`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Re-indexing failed');
    }
    return data;
  },

  getFileUrl: (docId) => {
    return `${API_BASE}/documents/${docId}/file`;
  },

  getPageInfo: async (docId, pageNum) => {
    const res = await fetch(`${API_BASE}/documents/${docId}/page/${pageNum}`);
    if (!res.ok) throw new Error('Failed to load page info');
    return res.json();
  },

  // Semantic Search
  search: async ({ query, subjectFilter, topK = 6, minScore = 0 }) => {
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        subject_filter: subjectFilter === 'All' ? null : subjectFilter,
        top_k: topK,
        min_score: minScore,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Search failed');
    return data;
  },

  // Exam Preparation Mode
  examPrep: async ({ query, marks = 5, subjectFilter }) => {
    const res = await fetch(`${API_BASE}/exam-prep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        marks,
        subject_filter: subjectFilter === 'All' ? null : subjectFilter,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Exam preparation query failed');
    return data;
  },
};
