import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical, X, Columns } from 'lucide-react';

const DraggableVariable = ({ name, type }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'VARIABLE',
    item: { name },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  return (
    <div 
      ref={drag} 
      title={name} 
      className={`
        group flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all select-none w-full
        ${isDragging ? 'opacity-40 grayscale' : ''}
      `}
    >
      <GripVertical size={14} className="text-slate-300 group-hover:text-blue-400" />
      <span className="text-sm font-medium text-slate-700 truncate flex-1">{name}</span>
      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{type === 'string' ? 'Str' : 'Num'}</span>
    </div>
  );
};

const DropZone = ({ dimension, mappedVars, onDrop, onRemove }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'VARIABLE',
    drop: (item) => onDrop(dimension.id, item.name),
    collect: (monitor) => ({ 
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    }),
  }), [onDrop]);

  return (
    <div ref={drop} className={`
      relative p-3 rounded-lg border-2 transition-all min-h-[90px] flex flex-col gap-2
      ${isOver ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-200 border-dashed'}
      ${canDrop && !isOver ? 'border-blue-200 bg-slate-50/50' : ''}
    `}>
      {/* Label */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
          {dimension.name}
          {dimension.required && <span className="w-1.5 h-1.5 rounded-full bg-red-400" title="Required"></span>}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">{dimension.type}</span>
      </div>
      
      {/* Mapped Items */}
      <div className="flex flex-col gap-1.5">
        {mappedVars?.map((v, i) => (
          <div key={i} className="flex items-center justify-between bg-white border border-blue-200 text-blue-700 text-xs pl-2 pr-1 py-1.5 rounded shadow-sm group">
            <span className="truncate max-w-[180px]" title={v}>{v}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(dimension.id, v); }} 
              className="p-0.5 rounded-full hover:bg-red-50 text-blue-300 hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Empty State Hint */}
      {(!mappedVars || mappedVars.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <span className="text-xs text-slate-300 font-medium">Drag variable here</span>
        </div>
      )}
    </div>
  );
};

const DataMapper = ({ data, chartDef, mapping, setMapping }) => {
  if (!data || !data.length) return null;
  const columns = Object.keys(data[0]);
  const colTypes = columns.map(c => typeof data[0][c]);

  const handleDrop = (dimId, varName) => {
    setMapping(prev => ({ ...prev, [dimId]: [varName] }));
  };

  const handleRemove = (dimId, varName) => {
    setMapping(prev => ({
      ...prev,
      [dimId]: prev[dimId].filter(v => v !== varName)
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Available Variables List (Top Stack) */}
      <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 inner-shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2">
          <Columns size={12} /> AVAILABLE VARIABLES
        </h4>
        <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
          {columns.map((col, i) => (
            <DraggableVariable key={col} name={col} type={colTypes[i]} />
          ))}
        </div>
      </div>

      {/* 2. Drop Zones (Bottom Stack) */}
      <div className="space-y-4">
        {chartDef.dimensions.map(dim => (
          <DropZone 
            key={dim.id} 
            dimension={dim} 
            mappedVars={mapping[dim.id]} 
            onDrop={handleDrop}
            onRemove={handleRemove}
          />
        ))}
      </div>
      
    </div>
  );
};

export default DataMapper;