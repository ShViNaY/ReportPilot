// components/filters/DateRangeFilter.tsx

'use client';

import { useState } from 'react';

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
    { id: 'thisMonth', label: 'This Month', icon: '📅' },
    { id: 'lastMonth', label: 'Last Month', icon: '📆' },
    { id: 'last3Months', label: 'Last 3 Months', icon: '📊' },
    { id: 'last6Months', label: 'Last 6 Months', icon: '📈' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
      <span className="text-sm font-medium text-slate-700">Filter by:</span>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset.id as DateRange)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedRange === preset.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {preset.icon} {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Range Toggle */}
      <button
        onClick={() => setShowCustom(!showCustom)}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          selectedRange === 'custom'
            ? 'bg-purple-600 text-white shadow-md'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        🔧 Custom
      </button>

      {/* Custom Date Range */}
      {showCustom && (
        <div className="flex gap-2 items-end w-full sm:w-auto">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
          <button
            onClick={handleCustomApply}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}