import React from 'react';

const DataGrid = ({ data }) => {
  if (!data || data.length === 0) return null;
  const headers = Object.keys(data[0]);
  const previewData = data.slice(0, 100); // Performance: only show first 100 rows

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white text-sm">
      <div className="overflow-x-auto max-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              {headers.map((h) => (
                <th key={h} className="p-2 border-b border-r font-semibold text-slate-600 text-xs uppercase tracking-wider last:border-r-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50 transition-colors">
                {headers.map((h, j) => (
                  <td key={`${i}-${j}`} className="p-2 border-b border-r text-slate-700 last:border-r-0 whitespace-nowrap">
                    {row[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-2 bg-slate-50 border-t text-xs text-slate-500 text-center">
        Showing first {previewData.length} of {data.length} rows
      </div>
    </div>
  );
};

export default DataGrid;