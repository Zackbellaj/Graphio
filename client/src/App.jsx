import React, { useState, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Download, Image as ImageIcon, Table as TableIcon, FolderOpen, Save, RefreshCw } from 'lucide-react';
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
  const fileInputRef = useRef(null);
  
  const [options, setOptions] = useState({
    width: 800, height: 600, baseRadius: 6, showGrid: true, colorScheme: 'tableau10',
    xTitle: '', yTitle: '' // Nouveaux champs
  });

  const chartContainerRef = useRef(null);

  // --- SAUVEGARDER PROJET ---
  const handleSaveProject = () => {
    if (!data) return alert("Aucune donnée à sauvegarder.");
    const project = {
      timestamp: Date.now(),
      data,
      mapping,
      options,
      chartId: activeChart.id
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    saveAs(blob, "mon-projet-rawgraphs.json");
  };

  // --- CHARGER PROJET ---
  const handleLoadProject = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target.result);
        setData(project.data);
        setMapping(project.mapping || {});
        setOptions(project.options);
        const savedChart = CHARTS.find(c => c.id === project.chartId);
        if (savedChart) setActiveChart(savedChart);
        alert("Projet chargé avec succès !");
      } catch (err) {
        alert("Erreur lors du chargement du fichier projet.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  // --- EXPORT IMAGE (Logic PNG/SVG) ---
  const handleDownload = (format) => {
    if (!chartContainerRef.current) return;
    const svg = chartContainerRef.current.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    if (format === 'svg') {
      saveAs(blob, "chart.svg");
      URL.revokeObjectURL(url);
    } else if (format === 'png') {
      const canvas = document.createElement('canvas');
      const scale = 2; 
      canvas.width = options.width * scale;
      canvas.height = options.height * scale;
      const ctx = canvas.getContext('2d');
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
        
        {/* Navbar Pro */}
        <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 shadow-md z-20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg">Graphio</span>
          </div>
          <div className="flex gap-2">
            {/* Bouton Ouvrir */}
            <input type="file" ref={fileInputRef} onChange={handleLoadProject} className="hidden" accept=".json" />
            <button onClick={() => fileInputRef.current.click()} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-medium flex items-center gap-2 transition-colors">
               <FolderOpen size={16} /> Ouvrir Projet
            </button>
            
            {/* Bouton Sauvegarder */}
            <button onClick={handleSaveProject} className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-xs font-medium flex items-center gap-2 transition-colors">
               <Save size={16} /> Sauvegarder
            </button>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* GAUCHE : Données et Mapping */}
          <div className="w-[450px] flex flex-col border-r border-slate-200 bg-white shrink-0 shadow-xl z-10">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Section 1: Data */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <span className="bg-slate-200 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                    Source de Données
                  </h3>
                  {data && (
                    <button onClick={() => setShowDataGrid(!showDataGrid)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <TableIcon size={12} /> {showDataGrid ? 'Masquer' : 'Voir'} Table
                    </button>
                  )}
                </div>
                {!data && <DataLoader onDataLoaded={(d) => { setData(d); setMapping({}); }} />}
                {data && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-xs text-blue-800 font-medium">{data.length} lignes chargées</span>
                    <button onClick={() => { if(confirm('Tout effacer ?')) setData(null); }} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                       <RefreshCw size={12} /> Reset
                    </button>
                  </div>
                )}
                {showDataGrid && <div className="mt-2"><DataGrid data={data} /></div>}
              </div>

              {/* Section 2: Chart Selector */}
              {data && (
                <div>
                   <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                    <span className="bg-slate-200 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                    Type de Graphique
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {CHARTS.map(chart => (
                      <button 
                        key={chart.id}
                        onClick={() => setActiveChart(chart)}
                        className={`p-2 border rounded-lg text-center transition-all ${activeChart.id === chart.id ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 hover:border-blue-300'}`}
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
                    Mapping des Variables
                  </h3>
                  <DataMapper 
                    data={data} chartDef={activeChart} mapping={mapping} setMapping={setMapping}
                  />
                </div>
              )}
            </div>
          </div>

          {/* CENTRE : Canvas */}
          <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-8 relative">
            {data && (
              <div className="absolute top-4 right-4 flex gap-2 z-20">
                 <button onClick={() => handleDownload('svg')} className="bg-white px-3 py-2 rounded shadow text-slate-700 hover:text-blue-600 text-sm font-medium flex items-center gap-2 transition-transform hover:-translate-y-0.5">
                   <Download size={16} /> SVG
                 </button>
                 <button onClick={() => handleDownload('png')} className="bg-white px-3 py-2 rounded shadow text-slate-700 hover:text-blue-600 text-sm font-medium flex items-center gap-2 transition-transform hover:-translate-y-0.5">
                   <ImageIcon size={16} /> PNG
                 </button>
              </div>
            )}

            <div 
               className="bg-white shadow-2xl rounded-sm transition-all duration-300"
               style={{ width: options.width, height: options.height }}
            >
              {data && activeChart ? (
                 <ChartRenderer 
                    data={data} mapping={mapping} chartDef={activeChart} options={options} ref={chartContainerRef}
                 />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="font-medium text-lg">Chargez des données pour commencer</p>
                </div>
              )}
            </div>
          </div>

          {/* DROITE : Options */}
          <ChartOptions options={options} setOptions={setOptions} />

        </div>
      </div>
    </DndProvider>
  );
}

// Sub-component
const ChartRenderer = React.forwardRef(({ data, mapping, chartDef, options }, ref) => {
  const containerRef = React.useRef(null);
  React.useImperativeHandle(ref, () => containerRef.current);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const missing = chartDef.dimensions.filter(d => d.required && !mapping[d.id]?.[0]);
    if (missing.length > 0) {
      containerRef.current.innerHTML = '';
      return;
    }
    try {
      chartDef.render(containerRef.current, data, mapping, options.width, options.height, options);
    } catch(e) { console.error(e); }
  }, [data, mapping, chartDef, options]);

  return <div ref={containerRef} className="w-full h-full" />;
});

export default App;