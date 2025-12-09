// V3 Canvas Types - Tagged Coordinate Types for Type Safety

export interface ScreenPoint {
  x: number;
  y: number;
  __space: 'screen';
}

export interface WorldPoint {
  x: number;
  y: number;
  __space: 'world';
}

export interface ImagePoint {
  x: number;
  y: number;
  __space: 'image';
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CoordinateSystemState {
  panX: number;
  panY: number;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
}

export type ToolType = 
  | 'select'
  | 'move'
  | 'crop'
  | 'marquee'
  | 'magic-wand'
  | 'brush'
  | 'eraser'
  | 'pen'
  | 'text'
  | 'rectangle'
  | 'gradient'
  | 'healing'
  | 'clone'
  | 'color-adjust';

export type BlendingMode = 
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendingMode: BlendingMode;
  imageData: ImageData | null;
  thumbnail: string | null;
  mask: Uint8ClampedArray | null;
  locked: boolean;
}

export interface Selection {
  mask: Uint8ClampedArray;
  bounds: Bounds;
}

export interface HistoryEntry {
  layers: Layer[];
  selectedLayerId: string | null;
  selection: Selection | null;
  action: string;
  timestamp: number;
}

export interface EditorState {
  layers: Layer[];
  selectedLayerId: string | null;
  selection: Selection | null;
  activeTool: ToolType;
  tolerance: number;
  history: HistoryEntry[];
  historyIndex: number;
}

export interface PreviewResult {
  mask: Uint8ClampedArray;
  bounds: Bounds;
  complete: boolean;
}

export type PreviewCallback = (result: PreviewResult) => void;
