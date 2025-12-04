import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

// --- Calendar Helper Functions ---
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CalendarWidget = React.memo(({ transactions = [], onDayClick, theme = 'light' }) => {
  const [view, setView] = useState('month'); // 'month' | 'year'
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // --- Aggregate Data ---
  const { dailyTotals, monthlyTotals } = useMemo(() => {
    const daily = {};
    const monthly = {};

    transactions.forEach(tx => {
      // Skip income for spending calendar
      if (tx.isIncome) return;

      const date = new Date(tx.date + 'T12:00:00'); // Fix TZ issues
      const dKey = tx.date; // YYYY-MM-DD
      const mKey = `${date.getFullYear()}-${date.getMonth()}`; // YYYY-M

      daily[dKey] = (daily[dKey] || 0) + (parseFloat(tx.amount) || 0);
      monthly[mKey] = (monthly[mKey] || 0) + (parseFloat(tx.amount) || 0);
    });

    return { dailyTotals: daily, monthlyTotals: monthly };
  }, [transactions]);

  // --- Handlers ---
  const prevPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(currentMonth - 1);
    else newDate.setFullYear(currentYear - 1);
    setCurrentDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(currentMonth + 1);
    else newDate.setFullYear(currentYear + 1);
    setCurrentDate(newDate);
  };

  const handleMonthClick = (monthIndex) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    setView('month');
  };

  // --- Renders ---
  
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const startDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Empty slots for start
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 bg-slate-50/50 dark:bg-slate-800/20 border-r border-b border-slate-100 dark:border-slate-800"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const total = dailyTotals[dateStr] || 0;
      
      days.push(
        <div 
          key={d} 
          onClick={() => onDayClick(dateStr)}
          className={`h-16 p-1 border-r border-b border-slate-100 dark:border-slate-800 relative group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center`}
        >
          <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{d}</span>
          {total > 0 && (
            <div className="mt-1">
              <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                {formatCurrency(total)}
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 border-t border-l border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className={`p-2 text-center text-[10px] font-bold uppercase tracking-wider border-r border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderYearView = () => {
    return (
      <div className="grid grid-cols-3 gap-4">
        {MONTH_NAMES.map((name, index) => {
          const mKey = `${currentYear}-${index}`;
          const total = monthlyTotals[mKey] || 0;
          return (
            <div 
              key={name}
              onClick={() => handleMonthClick(index)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col items-center justify-center h-32
                ${theme === 'dark' 
                  ? 'bg-slate-800/30 border-slate-700 hover:bg-slate-800 hover:border-slate-600' 
                  : 'bg-white border-slate-200 hover:border-zillion-300 hover:shadow-md'
                }`}
            >
              <span className={`text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{name}</span>
              <span className={`text-lg font-bold ${total > 0 ? 'text-zillion-500' : theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`}>
                {total > 0 ? formatCurrency(total) : '-'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="glass-card w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800 text-zillion-400' : 'bg-zillion-50 text-zillion-500'}`}>
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
            {view === 'month' ? `${MONTH_NAMES[currentMonth]} ${currentYear}` : currentYear}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {view === 'month' && (
             <button 
               onClick={() => setView('year')} 
               className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
             >
               View Year
             </button>
          )}
          <div className={`flex rounded-md border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <button onClick={prevPeriod} className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-md ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className={`w-px ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            <button onClick={nextPeriod} className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-md ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {view === 'month' ? renderMonthView() : renderYearView()}
    </div>
  );
});
CalendarWidget.displayName = 'CalendarWidget';