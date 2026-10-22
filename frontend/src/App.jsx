import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UploadModal from './components/UploadModal';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import SearchPage from './pages/SearchPage';
import DocumentsPage from './pages/DocumentsPage';
import ViewerPage from './pages/ViewerPage';
import ExamPrepPage from './pages/ExamPrepPage';

export default function App() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleUploadSuccess = () => {
    // Optionally trigger refreshes across pages
    window.dispatchEvent(new CustomEvent('notewise:document-uploaded'));
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
        
        {/* Persistent Navigation */}
        <Navbar onOpenUpload={() => setIsUploadOpen(true)} />

        {/* Dynamic Route Pages */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage onOpenUpload={() => setIsUploadOpen(true)} />} />
            <Route path="/dashboard" element={<Dashboard onOpenUpload={() => setIsUploadOpen(true)} />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/documents" element={<DocumentsPage onOpenUpload={() => setIsUploadOpen(true)} />} />
            <Route path="/viewer/:id" element={<ViewerPage />} />
            <Route path="/exam-prep" element={<ExamPrepPage />} />
          </Routes>
        </main>

        {/* Global Upload Notes Modal */}
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />

        {/* Site Footer */}
        <Footer />

      </div>
    </Router>
  );
}
