import React, { useState } from 'react';
import { SheetData, AnalysisState } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, X, RefreshCw, MessageSquareQuote } from 'lucide-react';

interface GeminiPanelProps {
  data: SheetData;
  onClose: () => void;
}

const GeminiPanel: React.FC<GeminiPanelProps> = ({ data, onClose }) => {
  const [analysis, setAnalysis] = useState<AnalysisState>({
    isLoading: false,
    result: null,
    error: null,
  });

  const analyzeSheet = async () => {
    if (!process.env.API_KEY) {
      setAnalysis({
        isLoading: false,
        result: null,
        error: "API Key is missing in environment variables.",
      });
      return;
    }

    setAnalysis({ isLoading: true, result: null, error: null });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prepare a prompt with a summary of the data to avoid token limits if the sheet is huge
      // We take the first 100 rows or the whole thing if smaller
      const previewRows = data.rows.slice(0, 100).map(r => 
        Object.values(r.data).join(',')
      ).join('\n');

      const prompt = `
        You are an expert Animation Director assistant. 
        Analyze the following CSV data representing an animation X-Sheet (Exposure Sheet / 律表).
        The columns are: ${data.headers.map(h => h.label).join(', ')}.
        
        Data Preview (First 100 frames):
        ${previewRows}

        Please provide a concise analysis:
        1. **Timing Overview**: What is the pace? (e.g., on ones, twos, holds).
        2. **Action Density**: Which layers (cells) are most active?
        3. **Scene Description**: Guess the nature of the motion based on the cell numbering patterns (e.g., is it a loop, a linear action, lip sync?).
        
        Format the output in Markdown. Keep it encouraging and professional.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAnalysis({
        isLoading: false,
        result: response.text || "No analysis generated.",
        error: null,
      });

    } catch (err: any) {
      setAnalysis({
        isLoading: false,
        result: null,
        error: err.message || "Failed to analyze sheet.",
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 w-[350px] shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center gap-2 text-indigo-400">
          <Sparkles className="w-5 h-5" />
          <div className="flex flex-col leading-none">
            <h2 className="font-semibold text-white">AI Director</h2>
            <span className="text-[10px] opacity-75">AI 导演 / AI 演出</span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!analysis.result && !analysis.isLoading && (
          <div className="text-center mt-10 opacity-75">
            <div className="bg-indigo-500/10 p-4 rounded-full inline-block mb-4">
              <MessageSquareQuote className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-slate-300 text-sm mb-1 px-4">
              Ask Gemini to analyze your timing, detect loops, or summarize the action density of this cut.
            </p>
            <p className="text-slate-500 text-xs mb-6 px-4">
              让 Gemini 分析您的时序、检测循环或总结动作密度。
              <br/>
              Geminiにタイミングの分析、ループの検出、アクション密度の要約を依頼します。
            </p>
            <button 
              onClick={analyzeSheet}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium transition-all shadow-lg shadow-indigo-900/40 flex flex-col items-center mx-auto"
            >
              <span>Analyze Sheet</span>
              <span className="text-[10px] opacity-80 font-normal">分析律表 / シートを分析</span>
            </button>
          </div>
        )}

        {analysis.isLoading && (
          <div className="flex flex-col items-center justify-center mt-20 gap-4">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <div className="text-center">
              <p className="text-slate-400 text-sm">Reviewing frames...</p>
              <p className="text-slate-500 text-xs">正在审阅帧... / フレームを確認中...</p>
            </div>
          </div>
        )}

        {analysis.error && (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-200 text-sm">
            {analysis.error}
          </div>
        )}

        {analysis.result && (
          <div className="prose prose-invert prose-sm max-w-none">
            {analysis.result.split('\n').map((line, i) => (
               <p key={i} className="mb-2">{line}</p>
            ))}
          </div>
        )}
      </div>
      
      {analysis.result && (
        <div className="p-4 border-t border-slate-700 bg-slate-900">
           <button 
              onClick={analyzeSheet}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors border border-slate-700 flex flex-col items-center justify-center gap-0.5"
            >
              <span>Regenerate Analysis</span>
              <span className="text-[10px] text-slate-500">重新分析 / 再分析</span>
            </button>
        </div>
      )}
    </div>
  );
};

export default GeminiPanel;