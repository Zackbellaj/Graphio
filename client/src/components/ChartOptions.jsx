import React from 'react';

const ChartOptions = ({ options, setOptions }) => {
  const handleChange = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white border-l border-slate-200 w-80 h-full flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-slate-700">Options du Graphique</h3>
      </div>
      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        
        {/* 1. Dimensions */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dimensions</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1 font-medium text-slate-600">Largeur</label>
              <input 
                type="number" value={options.width}
                onChange={(e) => handleChange('width', +e.target.value)}
                className="w-full p-2 border rounded text-sm focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium text-slate-600">Hauteur</label>
              <input 
                type="number" value={options.height}
                onChange={(e) => handleChange('height', +e.target.value)}
                className="w-full p-2 border rounded text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Textes & Labels (NOUVEAU) */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Textes & Labels</h4>
          <div>
            <label className="block text-xs mb-1 font-medium text-slate-600">Titre Axe X</label>
            <input 
              type="text" value={options.xTitle || ''}
              onChange={(e) => handleChange('xTitle', e.target.value)}
              placeholder="Auto"
              className="w-full p-2 border rounded text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 font-medium text-slate-600">Titre Axe Y</label>
            <input 
              type="text" value={options.yTitle || ''}
              onChange={(e) => handleChange('yTitle', e.target.value)}
              placeholder="Auto"
              className="w-full p-2 border rounded text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* 3. Apparence */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apparence</h4>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-700">Afficher la Grille</label>
            <input 
              type="checkbox" checked={options.showGrid} 
              onChange={(e) => handleChange('showGrid', e.target.checked)}
              className="accent-blue-600 h-4 w-4"
            />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium text-slate-600">Taille des éléments ({options.baseRadius}px)</label>
            <input 
              type="range" min="2" max="20" 
              value={options.baseRadius}
              onChange={(e) => handleChange('baseRadius', +e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
          
           <div>
            <label className="block text-xs mb-1 font-medium text-slate-600">Palette de couleurs</label>
            <select 
              value={options.colorScheme}
              onChange={(e) => handleChange('colorScheme', e.target.value)}
              className="w-full p-2 border rounded text-sm bg-white focus:border-blue-500 outline-none"
            >
              <option value="tableau10">Tableau 10 (Catégories)</option>
              <option value="viridis">Viridis (Séquentiel)</option>
              <option value="magma">Magma (Chaud)</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChartOptions;