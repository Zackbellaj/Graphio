import React from 'react';

const ChartOptions = ({ options, setOptions }) => {
  const handleChange = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white border-l border-slate-200 w-80 h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-slate-700">Chart Options</h3>
      </div>
      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        
        {/* Dimensions */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dimensions</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1 font-medium text-slate-600">Width</label>
              <input 
                type="number" 
                value={options.width}
                onChange={(e) => handleChange('width', +e.target.value)}
                className="w-full p-2 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium text-slate-600">Height</label>
              <input 
                type="number" 
                value={options.height}
                onChange={(e) => handleChange('height', +e.target.value)}
                className="w-full p-2 border rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Appearance</h4>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-700">Show Grid</label>
            <input 
              type="checkbox" 
              checked={options.showGrid} 
              onChange={(e) => handleChange('showGrid', e.target.checked)}
              className="accent-blue-600 h-4 w-4"
            />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium text-slate-600">Symbol Size</label>
            <input 
              type="range" min="2" max="20" 
              value={options.baseRadius}
              onChange={(e) => handleChange('baseRadius', +e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
          
           <div>
            <label className="block text-xs mb-1 font-medium text-slate-600">Color Scheme</label>
            <select 
              value={options.colorScheme}
              onChange={(e) => handleChange('colorScheme', e.target.value)}
              className="w-full p-2 border rounded text-sm bg-white"
            >
              <option value="tableau10">Tableau 10 (Standard)</option>
              <option value="viridis">Viridis (Sequential)</option>
              <option value="magma">Magma (Dark)</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChartOptions;