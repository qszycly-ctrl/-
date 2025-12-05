import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { parseCSV } from '../utils/csvParser';
import { SheetData } from '../types';

interface FileUploaderProps {
  onDataLoaded: (data: SheetData) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onDataLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text, file.name);
        onDataLoaded(data);
      } catch (err) {
        console.error(err);
        setError('Failed to parse CSV. Ensure it is a valid export from CSP.');
      }
    };
    reader.onerror = () => setError('Error reading file.');
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div 
      className={`
        flex flex-col items-center justify-center w-full max-w-xl p-12 
        border-2 border-dashed rounded-xl transition-colors cursor-pointer
        ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />
      
      <div className="bg-blue-600 p-4 rounded-full mb-4 shadow-lg shadow-blue-900/20">
        <FileSpreadsheet className="w-8 h-8 text-white" />
      </div>
      
      <h3 className="text-xl font-semibold text-slate-200 mb-1 text-center">
        Import CSP CSV
      </h3>
      <p className="text-xs text-slate-500 mb-4 font-medium text-center">
         导入 CSP CSV / CSP CSVをインポート
      </p>
      
      <p className="text-slate-400 text-center mb-1 text-sm max-w-lg">
        Export your timeline from Clip Studio Paint as CSV, then drop it here to generate a Law Table (X-Sheet).
      </p>
      <p className="text-slate-500 text-xs text-center mb-6 max-w-lg leading-relaxed">
        从 Clip Studio Paint 导出时间轴 CSV，拖入此处生成律表。
        <br />
        Clip Studio PaintからタイムラインをCSVで書き出し、ここにドロップして律表（タイムシート）を作成します。
      </p>
      
      <button className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex flex-col items-center gap-1 border border-slate-700">
        <span className="text-sm font-medium">Browse Files</span>
        <span className="text-xs text-slate-400">浏览文件 / ファイルを選択</span>
      </button>

      {error && (
        <div className="mt-6 p-3 bg-red-900/50 border border-red-800 text-red-200 text-sm rounded-lg flex flex-col gap-1 w-full text-center">
          <div className="flex items-center justify-center gap-2 font-medium">
             <span>⚠️</span> {error}
          </div>
          <div className="text-xs text-red-300 opacity-75">
             请确保上传的是有效的 CSV 文件。 / 有効なCSVファイルをアップロードしてください。
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;