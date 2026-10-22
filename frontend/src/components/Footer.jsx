import React from 'react';
import { Sparkles, Heart, ShieldCheck, Database, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/50 backdrop-blur-sm text-slate-500 text-xs py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">NoteWise AI</span>
            <span>— Semantic Academic Search Engine</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span>all-MiniLM-L6-v2 (384d)</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>FAISS FlatIP Index</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Local Inference</span>
            </span>
          </div>

          <div>
            <p className="text-[11px] text-slate-400">
              College Mini-Project Demonstration
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
