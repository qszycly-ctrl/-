export interface SheetHeader {
  id: string;
  label: string;
  index: number;
}

export interface SheetRow {
  frame: number;
  data: Record<string, string>; // key is header id (column index), value is cell content
}

export interface SheetData {
  headers: SheetHeader[];
  rows: SheetRow[];
  name: string;
}

export interface AnalysisState {
  isLoading: boolean;
  result: string | null;
  error: string | null;
}
