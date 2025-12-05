import React, { useState, useRef } from 'react';
import { SheetData } from './types';
import FileUploader from './components/FileUploader';
import XSheetTable from './components/XSheetTable';
import GeminiPanel from './components/GeminiPanel';
import { generateCSV } from './utils/csvParser';
import { Download, LayoutTemplate, Sparkles, Trash2, FileOutput, Image as ImageIcon, FileImage } from 'lucide-react';
// @ts-ignore
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'jpg' | 'png' | null>(null);
  
  const tableRef = useRef<HTMLTableElement>(null);

  const handleDataLoaded = (data: SheetData) => {
    setSheetData(data);
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the current sheet?")) {
      setSheetData(null);
      setShowAiPanel(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!sheetData) return;
    const csvContent = generateCSV(sheetData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${sheetData.name}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadImage = async (format: 'jpg' | 'png') => {
    if (!sheetData || !tableRef.current) return;
    
    setExportingFormat(format);
    try {
      // Small delay to let UI update state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const originalTable = tableRef.current;
      
      // 1. Create a deep clone of the table container to manipulate styles without affecting UI
      // We clone the parent div to capture context if needed, but primarily we need the table.
      // However, cloning the table directly is safer for isolation.
      const clone = originalTable.cloneNode(true) as HTMLElement;
      
      // 2. Set up a hidden container for the clone
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '0';
      // Force white background on container to ensure transparent parts of table are white
      container.style.backgroundColor = '#ffffff'; 
      container.style.width = `${originalTable.scrollWidth}px`; // Match original width
      container.appendChild(clone);
      document.body.appendChild(container);

      // 3. Modify styles in the clone for "Export Mode"
      // Remove fixed heights, allow text wrap, align top
      
      // Fix Header
      const thead = clone.querySelector('thead');
      if (thead) {
        thead.style.position = 'static'; // Remove sticky
        thead.style.height = 'auto';
      }

      // Fix Rows
      const rows = clone.querySelectorAll('tr');
      rows.forEach(row => {
        row.style.height = 'auto';
        row.classList.remove('h-10'); // Remove fixed height class
      });

      // Fix Cells (th and td)
      const cells = clone.querySelectorAll('td, th');
      cells.forEach(cell => {
        const el = cell as HTMLElement;
        // Remove truncation classes
        el.classList.remove('truncate', 'h-10', 'overflow-hidden', 'text-ellipsis', 'whitespace-nowrap');
        
        // Apply expansion styles
        el.style.height = 'auto';
        el.style.whiteSpace = 'normal';
        el.style.wordBreak = 'break-word';
        el.style.verticalAlign = 'top';
        el.style.padding = '4px 2px'; // Add a little padding for top alignment
        
        // Ensure symbols like circles are also top aligned if they are inside spans
        const span = el.querySelector('span');
        if (span) {
           span.classList.remove('truncate');
           span.style.whiteSpace = 'normal';
        }
      });

      // 4. Measure the new natural height
      const fullHeight = clone.scrollHeight;
      const fullWidth = clone.scrollWidth;

      // 5. Adjust scale
      let scale = 2;
      if (fullHeight > 15000) scale = 1;
      if (fullHeight > 30000) scale = 0.5;

      // 6. Generate Canvas
      const canvas = await html2canvas(clone, {
        scale: scale,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: fullWidth,
        height: fullHeight,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
      });
      
      // 7. Download
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const url = canvas.toDataURL(mimeType, format === 'jpg' ? 0.85 : undefined);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${sheetData.name}_xsheet.${format}`);
      document.body.appendChild(link);
      link.click();
      
      // 8. Cleanup
      document.body.removeChild(link);
      document.body.removeChild(container);

    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to generate image. The sheet might be too large.");
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
            <LayoutTemplate className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">CSP X-Sheet Assistant</h1>
            <div className="flex flex-col text-xs text-slate-400">
              <span>Timeline to Law Table Converter</span>
              <span className="text-[10px] opacity-75">时间轴转律表工具 / タイムライン律表変換ツール</span>
            </div>
          </div>
        </div>

        {sheetData && (
          <div className="flex items-center gap-2">
             <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            
            <button
              onClick={() => handleDownloadImage('jpg')}
              disabled={!!exportingFormat}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors ${exportingFormat ? 'opacity-50 cursor-wait' : ''}`}
              title="Download JPG Image"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">JPG</span>
            </button>

            <button
              onClick={() => handleDownloadImage('png')}
              disabled={!!exportingFormat}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors ${exportingFormat ? 'opacity-50 cursor-wait' : ''}`}
              title="Download PNG Image"
            >
              <FileImage className="w-4 h-4" />
              <span className="hidden sm:inline">PNG</span>
            </button>
            
            <div className="h-6 w-px bg-slate-700 mx-1"></div>
            
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className={`flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full transition-all ${
                showAiPanel 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <div className="flex flex-col items-start leading-none py-0.5">
                <span>AI Analysis</span>
                <span className="text-[9px] opacity-80 font-normal">AI 分析 / 分析</span>
              </div>
            </button>
            <button
              onClick={handleClear}
              className="ml-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-950 rounded-md transition-colors"
              title="Clear Data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Central Workspace */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-4 overflow-hidden relative">
          {!sheetData ? (
            <div className="animate-fade-in-up">
              <FileUploader onDataLoaded={handleDataLoaded} />
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full text-slate-400">
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="mb-2 text-indigo-400"><FileOutput className="w-5 h-5"/></div>
                  <h4 className="text-slate-200 font-medium mb-1">CSP Export</h4>
                  <p className="text-xs mb-1">Supports Timeline CSV exports from Clip Studio Paint EX.</p>
                  <p className="text-[10px] text-slate-500">支持 CSP EX 时间轴 CSV 导出。<br/>CSP EXのタイムラインCSV書き出しに対応。</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="mb-2 text-indigo-400"><LayoutTemplate className="w-5 h-5"/></div>
                  <h4 className="text-slate-200 font-medium mb-1">Digital X-Sheet</h4>
                  <p className="text-xs mb-1">Visualizes data in a vertical, traditional animation sheet format.</p>
                  <p className="text-[10px] text-slate-500">以传统竖式律表格式可视化数据。<br/>伝統的な縦型タイムシート形式でデータを可視化します。</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="mb-2 text-indigo-400"><Sparkles className="w-5 h-5"/></div>
                  <h4 className="text-slate-200 font-medium mb-1">Smart Insights</h4>
                  <p className="text-xs mb-1">Uses Gemini Flash to summarize timing and action.</p>
                  <p className="text-[10px] text-slate-500">使用 Gemini Flash 总结时序与动作。<br/>Gemini Flashを使用してタイミングとアクションを要約します。</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className="mb-2 flex items-center justify-between px-2">
                 <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-baseline gap-2">
                   <span>{sheetData.name}</span>
                   <span className="text-xs font-normal opacity-75">&bull; {sheetData.rows.length} Frames (帧/フレーム)</span>
                 </h2>
                 <div className="text-xs text-slate-500 font-mono">
                   24 FPS Grid
                 </div>
              </div>
              <div className="flex-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-900/50 shadow-inner">
                <XSheetTable data={sheetData} tableRef={tableRef} />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel (AI) */}
        {sheetData && showAiPanel && (
           <div className="absolute right-0 top-0 bottom-0 z-30 h-full animate-slide-in-right">
             <GeminiPanel data={sheetData} onClose={() => setShowAiPanel(false)} />
           </div>
        )}

      </main>
    </div>
  );
};

export default App;