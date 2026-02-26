import { useRef, ReactNode } from 'react';

interface ChartExportProps {
  children: ReactNode;
  data?: Record<string, unknown>[];
  filename?: string;
}

export function ChartExport({ children, data, filename = 'chart' }: ChartExportProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const exportToPng = async () => {
    if (!chartRef.current) return;

    try {
      // Dynamically import html2canvas to avoid bundle size issues
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
      alert('Failed to export chart as PNG. Please try again.');
    }
  };

  const exportToCsv = () => {
    if (!data || data.length === 0) {
      alert('No data available to export');
      return;
    }

    // Get headers from first item
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    // Add data rows
    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value ?? '');
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const copyToClipboard = async () => {
    if (!data || data.length === 0) {
      alert('No data available to copy');
      return;
    }

    try {
      const headers = Object.keys(data[0]);
      const rows = [headers.join('\t')];
      data.forEach((row) => {
        const values = headers.map((h) => String(row[h] ?? ''));
        rows.push(values.join('\t'));
      });
      await navigator.clipboard.writeText(rows.join('\n'));
      alert('Data copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy data to clipboard');
    }
  };

  return (
    <div className="relative group">
      {/* Export buttons - visible on hover */}
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
        <button
          onClick={exportToPng}
          className="p-1.5 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition-colors"
          title="Export as PNG"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        {data && (
          <>
            <button
              onClick={exportToCsv}
              className="p-1.5 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition-colors"
              title="Export as CSV"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              onClick={copyToClipboard}
              className="p-1.5 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 transition-colors"
              title="Copy to clipboard"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Chart content */}
      <div ref={chartRef}>
        {children}
      </div>
    </div>
  );
}
