// components/filters/DateRangeFilter.tsx
'use client';

import { useState } from 'react';
import { IconCalendar } from '@/components/common/Icons';
import { DarkDatePicker } from '@/components/common/DarkDatePicker';

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
      <div className="flex items-center gap-2 flex-wrap max-w-full">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-1 shrink-0">
          <IconCalendar className="w-3.5 h-3.5 text-zinc-500" />
          <span>Period:</span>
        </div>

        {/* Preset Segmented Group */}
        <div className="inline-flex items-center p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 gap-1 overflow-x-auto max-w-full">
          {presets.map((preset) => {
            const isSelected = selectedRange === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset.id as DateRange)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-zinc-800 text-lime-400 shadow-2xs font-semibold border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                {preset.label}
              </button>
            );
          })}

          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${
              selectedRange === 'custom'
                ? 'bg-zinc-800 text-lime-400 shadow-2xs font-semibold border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Range Popout / Drawer */}
      {showCustom && (
        <div className="flex items-end gap-2.5 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl w-full sm:w-auto">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Start Date
            </label>
            <DarkDatePicker
              value={customStart}
              onChange={(val) => setCustomStart(val)}
              triggerClassName="w-36 h-8 px-2.5 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              End Date
            </label>
            <DarkDatePicker
              value={customEnd}
              onChange={(val) => setCustomEnd(val)}
              align="right"
              triggerClassName="w-36 h-8 px-2.5 rounded-lg text-xs"
            />
          </div>
          <button
            onClick={handleCustomApply}
            className="h-8 px-3.5 bg-lime-400 hover:bg-lime-300 text-black rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}