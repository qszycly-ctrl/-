import React from 'react';
import { SheetData } from '../types';

interface XSheetTableProps {
  data: SheetData;
  tableRef?: React.RefObject<HTMLTableElement | null>;
}

const XSheetTable: React.FC<XSheetTableProps> = ({ data, tableRef }) => {
  
  // Calculate frames per second guess (standard 24)
  // Used for highlighting generic 1sec and 0.5sec markers
  const FPS = 24;

  return (
    <div className="w-full h-full overflow-auto bg-white text-slate-900 rounded-lg shadow-xl relative">
      <table ref={tableRef} className="border-collapse text-sm font-mono mx-auto bg-white">
        <thead className="sticky top-0 z-20 shadow-sm">
          <tr className="bg-slate-800 text-slate-200">
            {data.headers.map((header) => (
              <th 
                key={header.id}
                title={header.label}
                className="h-10 w-10 min-w-[2.5rem] max-w-[2.5rem] p-1 text-center border-b border-slate-600 font-bold text-xs overflow-hidden text-ellipsis whitespace-nowrap"
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, index) => {
            const frameNum = row.frame;
            // Visual markers for traditional X-Sheet
            // Typically bold line every second (24 frames) and half-second (12) or every 6 frames
            const isSecondMark = frameNum % FPS === 1; // 1, 25, 49...
            const isHalfSecond = frameNum % 12 === 1; // 1, 13, 25...
            const isSixFrame = frameNum % 6 === 1;
            
            let rowClass = "hover:bg-blue-50 transition-colors h-10"; // Explicit row height
            if (isSecondMark && index !== 0) rowClass += " border-t-2 border-slate-800";
            else if (isHalfSecond && index !== 0) rowClass += " border-t border-slate-400";
            else if (isSixFrame && index !== 0) rowClass += " border-t border-slate-300 border-dashed";
            else rowClass += " border-t border-slate-200";

            // Zebra striping for readability
            if (index % 2 === 1) rowClass += " bg-slate-50";

            return (
              <tr key={index} className={rowClass}>
                {data.headers.map((header, colIndex) => {
                  const val = row.data[header.id];
                  // If first column (usually Frame), make it bold/distinct
                  const isFirstCol = colIndex === 0;
                  
                  return (
                    <td 
                      key={header.id}
                      className={`
                        h-10 w-10 min-w-[2.5rem] max-w-[2.5rem]
                        p-0 border-r border-slate-200 
                        text-center align-middle
                        ${isFirstCol ? 'bg-slate-100 font-bold text-slate-500 text-xs' : ''}
                        ${val ? 'text-slate-900' : 'text-slate-300'}
                      `}
                    >
                      {val === '○' ? (
                        <span className="text-lg font-bold text-slate-800 leading-none">○</span>
                      ) : val === 'X' ? (
                         <span className="text-lg font-bold text-slate-800 leading-none">X</span>
                      ) : (
                         <span className="block truncate px-0.5 w-full">{val || (isFirstCol ? '' : '-')}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default XSheetTable;