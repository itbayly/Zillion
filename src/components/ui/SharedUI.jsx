import React from 'react';
import { X } from 'lucide-react';

// --- Ambient Background ---
export const AmbientBackground = ({ theme = 'light' }) => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float ${theme === 'dark' ? 'bg-zillion-900/20' : 'bg-zillion-200'} transition-colors duration-1000`}></div>
    <div className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-delayed ${theme === 'dark' ? 'bg-indigo-900/20' : 'bg-blue-200'} transition-colors duration-1000`}></div>
  </div>
);

// --- Modal Wrapper ---
export const ModalWrapper = ({ children, onClose, theme = 'light', title, maxWidth = 'max-w-lg' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
    <div 
      className={`w-full ${maxWidth} p-6 rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] transition-all duration-300
      ${theme === 'dark' 
        ? 'bg-slate-900/95 border border-white/10 text-slate-100' 
        : 'bg-white/95 border border-white/60 text-slate-800'
      } backdrop-blur-xl`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h3 className="text-xl font-bold">{title}</h3>
        <button 
          onClick={onClose} 
          className={`p-1 rounded-full transition-colors ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// --- Progress Bar ---
export function ProgressBar({ progress, theme = 'light' }) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  let colorClass = 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]'; // Indigo glow
  
  if (clampedProgress > 100) {
    colorClass = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'; // Red glow
  } else if (clampedProgress > 90) {
    colorClass = 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]'; // Yellow glow
  } else if (clampedProgress < 0) {
     colorClass = 'bg-red-500';
  }

  return (
    <div className={`mt-3 h-1.5 w-full rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${Math.min(clampedProgress, 100)}%` }}
      ></div>
    </div>
  );
}

// --- Status Pill (for Category Cards) ---
export function StatusPill({ type, theme = 'light' }) {
  if (type === 'debt') {
    return (
      <div className={`ml-3 flex items-center justify-center rounded-full px-2 py-0.5 ${theme === 'dark' ? 'bg-purple-900/30 border border-purple-700/50' : 'bg-purple-50 border border-purple-100'}`}>
        <span className={`text-[9px] font-bold tracking-wider uppercase ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
          DEBT
        </span>
      </div>
    );
  }
  if (type === 'fund') {
    return (
      <div className={`ml-3 flex items-center justify-center rounded-full px-2 py-0.5 ${theme === 'dark' ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-blue-50 border border-blue-100'}`}>
        <span className={`text-[9px] font-bold tracking-wider uppercase ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
          FUND
        </span>
      </div>
    );
  }
  return null;
}

// --- Debt Info Row (for Debt Tiles & Modals) ---
export function DebtInfoRow({ icon: Icon, label, value, isMainValue = false, theme = 'light' }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Icon className={`h-5 w-5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
        <span className={`ml-3 text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
      </div>
      {isMainValue ? (
        <span className={`text-xl font-bold ${theme === 'dark' ? 'text-zillion-400' : 'text-zillion-600'}`}>{value}</span>
      ) : (
        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{value}</span>
      )}
    </div>
  );
}