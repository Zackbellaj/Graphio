import React, { useState, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Download, Image as ImageIcon, Settings, Table as TableIcon, Layout } from 'lucide-react';
import { saveAs } from 'file-saver';

import DataLoader from './components/DataLoader';
import DataMapper from './components/DataMapper';
import DataGrid from './components/DataGrid';
import ChartOptions from './components/ChartOptions';
import { CHARTS } from './charts/definitions';

function App() {
  const [data, setData] = useState(null);
  const [activeChart, setActiveChart] = useState(CHARTS[0]);
  const [mapping, setMapping] = useState({});
  const [showDataGrid, setShowDataGrid] = useState(false);
  
  const [options, setOptions] = useState({
    width: 800,
    height: 600,
    baseRadius: 6,
    showGrid: true,
    colorScheme: 'tableau10'
  });

  const chartContainerRef = useRef(null);

  // --- FIXED DOWNLOAD LOGIC ---
  const handleDownload = (format) => {
    if (!chartContainerRef.current) return;
    const svg = chartContainerRef.current.querySelector('svg');
    if (!svg) return;

    // 1. Serialize SVG to String
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    // 2. Add NameSpaces if missing (fixes broken images)
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    // 3. Create Blob
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    if (format === 'svg') {
      saveAs(blob, "chart.svg");
      URL.revokeObjectURL(url);
    } else if (format === 'png') {
      // 4. Draw to Canvas
      const canvas = document.createElement('canvas');
      // Double resolution for high-quality PNGs (Retina)
      const scale = 2; 
      canvas.width = options.width * scale;
      canvas.height = options.height * scale;
      
      const ctx = canvas.getContext('2d');
      // Fill White Background (prevent transparency)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(pngBlob => {
          saveAs(pngBlob, "chart.png");
          URL.revokeObjectURL(url);
        });
      };
      img.src = url;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden font-sans">
        
        {/* Navbar */}
        <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 shadow-md z-20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg">Graphio</span>
          </div>
          <div className="flex gap-2">
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Controls & Data (Scrollable) */}
          <div className="w-[450px] flex flex-col border-r border-slate-200 bg-white shrink-0 shadow-xl z-10">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Section 1: Data */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <span className="bg-slate-200 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                    Data Source
                  </h3>
                  {data && (
                    <button 
                      onClick={() => setShowDataGrid(!showDataGrid)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <TableIcon size={12} /> {showDataGrid ? 'Hide' : 'View'} Table
                    </button>
                  )}
                </div>
                <DataLoader onDataLoaded={(d) => { setData(d); setMapping({}); }} />
                {showDataGrid && <div className="mt-2"><DataGrid data={data} /></div>}
              </div>

              {/* Section 2: Chart Selector */}
              {data && (
                <div>
                   <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                    <span className="bg-slate-200 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                    Chart Type
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {CHARTS.map(chart => (
                      <button 
                        key={chart.id}
                        onClick={() => setActiveChart(chart)}
                        className={`p-2 border rounded-lg text-center transition-all ${activeChart.id === chart.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-300'}`}
                      >
                         <div className="text-xl mb-1">{chart.thumb}</div>
                         <div className="text-[10px] font-bold truncate">{chart.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: Mapping */}
              {data && (
                <div>
                  <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                    <span className="bg-slate-200 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                    Mapping
                  </h3>
                  <DataMapper 
                    data={data}
                    chartDef={activeChart}
                    mapping={mapping}
                    setMapping={setMapping}
                  />
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE: Canvas (Flexible) */}
          <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-8 relative">
            <div className="absolute top-4 right-4 flex gap-2">
               <button onClick={() => handleDownload('svg')} className="bg-white px-3 py-2 rounded shadow text-slate-700 hover:text-blue-600 text-sm font-medium flex items-center gap-2">
                 <Download size={16} /> SVG
               </button>
               <button onClick={() => handleDownload('png')} className="bg-white px-3 py-2 rounded shadow text-slate-700 hover:text-blue-600 text-sm font-medium flex items-center gap-2">
                 <ImageIcon size={16} /> PNG
               </button>
            </div>

            {/* The Actual Chart */}
            <div 
               className="bg-white shadow-2xl rounded-sm transition-all duration-300"
               style={{ width: options.width, height: options.height }}
            >
              {data && activeChart && (
                 <ChartRenderer 
                    data={data} 
                    mapping={mapping} 
                    chartDef={activeChart} 
                    options={options} 
                    ref={chartContainerRef}
                 />
              )}
              {(!data) && (
                <div className="h-full flex items-center justify-center text-slate-300 font-bold text-2xl">
                  Load data to start
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Options (Fixed Width) */}
          <ChartOptions options={options} setOptions={setOptions} />

        </div>
      </div>
    </DndProvider>
  );
}

// Sub-component for clean refs
const ChartRenderer = React.forwardRef(({ data, mapping, chartDef, options }, ref) => {
  const containerRef = React.useRef(null);
  
  // Sync refs
  React.useImperativeHandle(ref, () => containerRef.current);

  React.useEffect(() => {
    if (!containerRef.current) return;
    
    // Safety check for required dimensions
    const missing = chartDef.dimensions.filter(d => d.required && !mapping[d.id]?.[0]);
    if (missing.length > 0) {
      containerRef.current.innerHTML = '';
      return;
    }

    try {
      chartDef.render(containerRef.current, data, mapping, options.width, options.height, options);
    } catch(e) {
      console.error(e);
    }
  }, [data, mapping, chartDef, options]);

  return <div ref={containerRef} className="w-full h-full" />;
});

export default App;