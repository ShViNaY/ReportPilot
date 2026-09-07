// components/common/DarkDatePicker.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface DarkDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  align?: 'left' | 'right';
}

export function DarkDatePicker({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'dd / mm / yyyy',
  className = '',
  triggerClassName = '',
  align = 'left',
}: DarkDatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsedDate = value ? new Date(value + 'T00:00:00') : null;
  const initialYear = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.getFullYear() : new Date().getFullYear();
  const initialMonth = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.getMonth() : new Date().getMonth();

  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayLabels = ['Su', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const toDateString = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const todayStr = toDateString(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );

  const handleSelectDay = (day: number) => {
    const dateStr = toDateString(viewYear, viewMonth, day);
    onChange(dateStr);
    setOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onChange(todayStr);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setOpen(false);
  };

  const formatDisplay = (val: string) => {
    if (!val) return '';
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  return (
    <div ref={containerRef} className={`relative ${open ? 'z-50' : 'z-10'} ${className}`}>
      <input
        type="text"
        value={value}
        onChange={() => {}}
        required={required}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`flex items-center justify-between gap-2 border transition-all text-left ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-zinc-950 border-zinc-850 text-zinc-600'
            : open
            ? 'bg-zinc-950 border-lime-400 ring-1 ring-lime-400/30 text-zinc-100 cursor-pointer shadow-xs'
            : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-100 cursor-pointer'
        } ${triggerClassName || 'w-full h-11 px-4 rounded-xl text-sm'}`}
      >
        <span className={`truncate ${value ? 'text-zinc-100 font-medium' : 'text-zinc-500 font-normal'}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <svg
          className={`w-3.5 h-3.5 shrink-0 transition-colors ${open ? 'text-lime-400' : 'text-zinc-400'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && !disabled && (
        <div
          className={`absolute top-full mt-2 z-50 w-72 bg-[#141416] border border-zinc-800/90 rounded-2xl p-3.5 shadow-2xl shadow-black/95 animate-in fade-in zoom-in-95 duration-100 select-none ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-xs font-semibold text-zinc-100 tracking-wide">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {dayLabels.map((lbl, idx) => (
              <span
                key={lbl}
                className={`text-[10px] font-semibold tracking-wider ${
                  idx === 0 ? 'text-rose-400/80' : 'text-zinc-500'
                }`}
              >
                {lbl}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => {
              const dayNum = prevMonthDays - firstDayOfWeek + idx + 1;
              return (
                <div
                  key={`prev-${idx}`}
                  className="h-8 flex items-center justify-center text-xs text-zinc-600/70 font-normal cursor-default"
                >
                  {dayNum}
                </div>
              );
            })}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = toDateString(viewYear, viewMonth, dayNum);
              const isSelected = value === dateStr;
              const isToday = todayStr === dateStr;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 w-full flex items-center justify-center rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-lime-400 text-black font-bold shadow-xs shadow-lime-400/25 scale-105'
                      : isToday
                      ? 'border border-lime-400/50 text-lime-400 hover:bg-zinc-800'
                      : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Shortcuts */}
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800/60 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[11px] font-semibold text-lime-400 hover:text-lime-300 transition-colors px-2 py-1 rounded-md hover:bg-lime-400/10 cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
