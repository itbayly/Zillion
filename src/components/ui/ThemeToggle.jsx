import React from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className={`
        fixed top-4 right-4 z-50 p-3 rounded-full transition-all duration-300
        ${theme === 'dark' 
          ? 'bg-slate-800/50 text-zillion-400 hover:bg-slate-700/50 border border-slate-700 shadow-[0_0_15px_rgba(52,211,153,0.3)]' 
          : 'bg-white/50 text-slate-600 hover:bg-white/80 border border-slate-200 shadow-lg'
        }
        backdrop-blur-md
      `}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};