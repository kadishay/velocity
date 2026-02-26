import { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';

interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}

const PRESETS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

export function DateRangeFilter({ startDate, endDate, onChange }: DateRangeFilterProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customStart, setCustomStart] = useState(format(startDate, 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(endDate, 'yyyy-MM-dd'));

  // Sync custom inputs when props change
  useEffect(() => {
    setCustomStart(format(startDate, 'yyyy-MM-dd'));
    setCustomEnd(format(endDate, 'yyyy-MM-dd'));
  }, [startDate, endDate]);

  const handlePresetClick = (days: number) => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, days));
    setIsCustom(false);
    onChange(start, end);
  };

  const handleCustomApply = () => {
    const start = startOfDay(new Date(customStart));
    const end = endOfDay(new Date(customEnd));
    if (start <= end) {
      setIsCustom(false);
      onChange(start, end);
    }
  };

  // Calculate which preset is active (with tolerance for time zone issues)
  const daysDiff = differenceInDays(endDate, startDate);
  const activePreset = PRESETS.find((p) => Math.abs(p.days - daysDiff) <= 1);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Preset buttons */}
      <div className="flex bg-gray-100 rounded-lg p-0.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.days}
            onClick={() => handlePresetClick(preset.days)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activePreset?.days === preset.days && !isCustom
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setIsCustom(!isCustom)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            isCustom || !activePreset
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom date inputs */}
      {isCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCustomApply}
            className="px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      {/* Current range display (only when not in custom mode) */}
      {!isCustom && (
        <div className="text-xs text-gray-500">
          {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
        </div>
      )}
    </div>
  );
}
