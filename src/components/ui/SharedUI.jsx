import React from 'react';

// --- Progress Bar ---
export function ProgressBar({ progress }) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  let colorClass = 'bg-indigo-600';
  if (clampedProgress > 90) {
    colorClass = 'bg-red-600';
  } else if (clampedProgress > 75) {
    colorClass = 'bg-yellow-500';
  }

  return (
    <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
      <div
        className={`h-2 rounded-full ${colorClass}`}
        style={{ width: `${clampedProgress}%` }}
      ></div>
    </div>
  );
}

// --- Status Pill (for Category Cards) ---
export function StatusPill({ type }) {
  if (type === 'debt') {
    return (
      <div className="ml-3 flex items-center justify-center rounded-xl bg-[#F5F3FF] px-3 py-1">
        <span className="font-montserrat text-[10px] font-bold text-[#7C3AED]">
          DEBT
        </span>
      </div>
    );
  }
  if (type === 'fund') {
    return (
      <div className="ml-3 flex items-center justify-center rounded-xl bg-[#DBEAFE] px-3 py-1">
        <span className="font-montserrat text-[10px] font-bold text-[#1E40AF]">
          FUND
        </span>
      </div>
    );
  }
  return null;
}

// --- Debt Info Row (for Debt Tiles & Modals) ---
export function DebtInfoRow({ icon: Icon, label, value, isMainValue = false }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Icon className="h-5 w-5 text-gray-400" />
        <span className="ml-3 text-sm font-medium text-gray-600">{label}</span>
      </div>
      {isMainValue ? (
        <span className="text-xl font-semibold text-indigo-700">{value}</span>
      ) : (
        <span className="text-sm font-medium text-gray-900">{value}</span>
      )}
    </div>
  );
}