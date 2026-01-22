import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Upload, FileText } from 'lucide-react';

const SAMPLE_DATA = `sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica`;

const DataLoader = ({ onDataLoaded }) => {
  const parseData = (content) => {
    Papa.parse(content, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) onDataLoaded(results.data);
      }
    });
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => parseData(reader.result);
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, accept: {'text/csv': ['.csv']} 
  });

  return (
    <div className="section-card">
      <div className="section-header">
        <h2 className="section-title"><Upload size={20} /> 1. Load Data</h2>
        <button 
          onClick={() => parseData(SAMPLE_DATA)}
          className="text-sm text-blue-600 font-semibold hover:underline"
        >
          Use Sample Data
        </button>
      </div>
      
      <div className="p-6">
        <div {...getRootProps()} className={`
          border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer transition-all
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}
        `}>
          <input {...getInputProps()} />
          <FileText className={`w-10 h-10 mb-2 ${isDragActive ? 'text-blue-500' : 'text-slate-400'}`} />
          <p className="text-slate-600 font-medium">Drag & drop your CSV file here</p>
        </div>
      </div>
    </div>
  );
};

export default DataLoader;