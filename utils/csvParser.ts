import { SheetData, SheetHeader, SheetRow } from '../types';

export const parseCSV = (content: string, fileName: string): SheetData => {
  const lines = content.trim().split(/\r\n|\n/);
  
  if (lines.length < 1) {
    throw new Error("CSV file is empty");
  }

  // Basic CSV line splitter that respects quotes
  // This is a simplified regex for CSV parsing.
  const splitCSVLine = (line: string): string[] => {
    const pattern = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    // Fallback: simple split if complex regex fails or for simple structures
    if (!line.includes('"')) {
      return line.split(',');
    }
    
    // A more robust manual parse for quoted CSVs
    const result: string[] = [];
    let startValue = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === ',' && !inQuotes) {
        let val = line.substring(startValue, i);
        // Remove surrounding quotes
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        result.push(val.replace(/""/g, '"')); // Unescape double quotes
        startValue = i + 1;
      }
    }
    // Push last value
    let lastVal = line.substring(startValue);
    if (lastVal.startsWith('"') && lastVal.endsWith('"')) {
      lastVal = lastVal.slice(1, -1);
    }
    result.push(lastVal.replace(/""/g, '"'));
    
    return result;
  };

  const headersRaw = splitCSVLine(lines[0]);
  
  // CSP Timeline export usually has headers like: Frame, Layer 1, Layer 2...
  // We assume the first column is always the Frame number/Time code
  
  const headers: SheetHeader[] = headersRaw.map((h, i) => ({
    id: `col_${i}`,
    label: h.trim(),
    index: i,
  }));

  const rows: SheetRow[] = lines.slice(1).map((line) => {
    const cells = splitCSVLine(line);
    const rowData: Record<string, string> = {};
    
    // Attempt to parse first cell as frame number
    let frameNum = 0;
    if (cells.length > 0) {
      const parsed = parseInt(cells[0], 10);
      frameNum = isNaN(parsed) ? 0 : parsed;
    }

    headers.forEach((h, index) => {
      let val = cells[index] || '';
      
      // Normalize In-between markers
      // Use '○' for "中割" (In-between) or "·" (Dot) as requested
      const trimmedVal = val.trim();
      if (trimmedVal === '中割' || trimmedVal === '·' || trimmedVal === 'IB') {
        val = '○';
      }

      rowData[h.id] = val;
    });

    return {
      frame: frameNum,
      data: rowData,
    };
  });

  return {
    headers,
    rows,
    name: fileName.replace('.csv', ''),
  };
};

export const generateCSV = (data: SheetData): string => {
  const headerLine = data.headers.map(h => `"${h.label}"`).join(',');
  const rowLines = data.rows.map(row => {
    return data.headers.map(h => {
      const val = row.data[h.id] || '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  return [headerLine, ...rowLines].join('\n');
};