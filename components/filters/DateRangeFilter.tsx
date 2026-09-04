// components/filters/DateRangeFilter.tsx
'use client';

import { useState } from 'react';
import { IconCalendar } from '@/components/common/Icons';

export type DateRange = 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'custom';

interface DateRangeFilterProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange, startDate?: Date, endDate?: Date) => void;
}

export function DateRangeFilter({ selectedRange, onRangeChange }: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Get date range for each preset
  const getDateRange = (range: DateRange): { start: Date; end: Date } => {
    const today = new Date();
    const end = new Date(today);
    const start = new Date(today);

    switch (range) {
      case 'thisMonth':
        start.setDate(1);
        break;
      case 'lastMonth':
        start.setMonth(today.getMonth() - 1);
        start.setDate(1);
        end.setDate(0); // Last day of last month
        break;
      case 'last3Months':
        start.setMonth(today.getMonth() - 3);
        start.setDate(1);
        break;
      case 'last6Months':
        start.setMonth(today.getMonth() - 6);
        start.setDate(1);
        break;
      default:
        return { start, end };
    }

    return { start, end };
  };

  const handlePresetClick = (range: DateRange) => {
    const { start, end } = getDateRange(range);
    onRangeChange(range, start, end);
    setShowCustom(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      if (start <= end) {
        onRangeChange('custom', start, end);
        setShowCustom(false);
      }
    }
  };

  const presets = [
    { id: 'thisMonth', label: 'This Month' },
    { id: 'lastMonth', label: 'Last Month' },
    { id: 'last3Months', label: 'Last 3 Months' },
    { id: 'last6Months', label: 'Last 6 Months' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
          <IconCalendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Period:</span>
        </div>

        {/* Preset Segmented Group */}
        <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-lg border border-slate-200/80 gap-1">
          {presets.map((preset) => {
            const isSelected = selectedRange === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset.id as DateRange)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {preset.label}
              </button>
            );
          })}

          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer ${
              selectedRange === 'custom'
                ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Range Popout / Drawer */}
      {showCustom && (
        <div className="flex items-end gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg shadow-xs w-full sm:w-auto">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            />
          </div>
          <button
            onClick={handleCustomApply}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition-colors shadow-2xs cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}