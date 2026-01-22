import React, { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import { saveAs } from 'file-saver';

const Visualizer = ({ data, mapping, chartDef }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data || !chartDef) return;
    containerRef.current.innerHTML = ''; // Clear
    
    // Check requirements
    const missing = chartDef.dimensions.filter(d => d.required && (!mapping[d.id] || !mapping[d.id].length));
    if (missing.length > 0) {
      containerRef.current.innerHTML = `<div class="h-full flex items-center justify-center text-slate-400 italic">Map required variables to see the chart</div>`;
      return;
    }

    try {
      chartDef.render(containerRef.current, data, mapping, 900, 600);
    } catch (e) {
      console.error(e);
      containerRef.current.innerHTML = `<div class="text-red-500 p-4">Error rendering chart. Check console.</div>`;
    }
  }, [data, mapping, chartDef]);

  const handleDownload = () => {
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    saveAs(blob, "rawgraphs-clone-export.svg");
  };

  if (!data) return null;

  return (
    <div className="section-card">
      <div className="section-header">
        <h2 className="section-title">4. Visualization</h2>
        <button onClick={handleDownload} className="btn-primary text-sm">
          <Download size={16} /> Export SVG
        </button>
      </div>
      <div className="p-4 bg-white overflow-auto flex justify-center min-h-[400px]" ref={containerRef}>
        {/* D3 Render Target */}
      </div>
    </div>
  );
};

export default Visualizer;