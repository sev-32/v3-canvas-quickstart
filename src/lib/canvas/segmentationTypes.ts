// Segmentation Engine Types for V3 Canvas

export type FillSpeed = 'instant' | 'fast' | 'normal' | 'slow' | 'cinematic' | 'custom';

export type SegmentationEngine = 
  | 'ringBFS'           // Ring-based BFS (V6 Organic Flow)
  | 'scanline'          // Traditional scanline flood fill
  | 'stackBFS'          // Stack-based BFS
  | 'recursiveDFS'      // Recursive DFS (small areas only)
  | 'queueBFS'          // Queue-based BFS
  | 'hybrid'            // Adaptive hybrid approach
  | 'contour'           // Contour tracing method
  | 'watershed';        // Watershed segmentation

export type FillMethod =
  | '4-connected'       // N/S/E/W neighbors only
  | '8-connected'       // Include diagonal neighbors
  | 'adaptive'          // Switch based on context
  | 'anti-aliased';     // Smooth edge fill

export type EdgeDetection =
  | 'none'              // No edge detection
  | 'sobel'             // Sobel edge detection
  | 'canny'             // Canny edge detection
  | 'laplacian'         // Laplacian edge detection
  | 'gradient';         // Simple gradient

export type ColorSpace =
  | 'rgb'               // Standard RGB
  | 'hsl'               // Hue, Saturation, Lightness
  | 'lab'               // CIELAB color space
  | 'hsv'               // Hue, Saturation, Value
  | 'yuv';              // YUV color space

export type ToleranceMode =
  | 'global'            // Compare to seed color only
  | 'local'             // Compare to neighbor pixels
  | 'adaptive'          // Adjust based on local variance
  | 'perceptual';       // Human perception weighted

export interface WandSettingsState {
  // Fill Animation
  fillSpeed: FillSpeed;
  timeBudgetMs: number;
  expansionRate: number;        // Pixels per ring/iteration
  
  // Hover Preview
  hoverEnabled: boolean;
  hoverRefreshRate: number;
  showPreview: boolean;
  previewOpacity: number;
  ringVisualization: boolean;
  
  // Segmentation Engine
  engine: SegmentationEngine;
  fillMethod: FillMethod;
  
  // Color Matching
  colorSpace: ColorSpace;
  toleranceMode: ToleranceMode;
  antiAliasStrength: number;    // 0-100
  
  // Edge Handling
  edgeDetection: EdgeDetection;
  edgeSoftness: number;         // 0-100
  featherRadius: number;        // 0-50 pixels
  
  // Advanced
  contiguousOnly: boolean;
  sampleAllLayers: boolean;
  growSelection: number;        // -50 to 50 pixels
  smoothSelection: number;      // 0-100
  
  // Performance
  maxPixels: number;            // Max pixels to process
  useWorker: boolean;           // Use Web Worker
  chunkSize: number;            // Pixels per chunk
  
  // Debug/Development
  debugMode: boolean;
  showBoundary: boolean;
  showSeedPoint: boolean;
  logPerformance: boolean;
}

export const FILL_SPEED_PRESETS: Record<FillSpeed, { label: string; timeBudget: number; description: string }> = {
  instant: { label: 'Instant', timeBudget: 10000, description: 'Complete fill in one frame' },
  fast: { label: 'Fast', timeBudget: 16, description: '~60fps, quick expansion' },
  normal: { label: 'Normal', timeBudget: 8, description: 'Balanced speed/smoothness' },
  slow: { label: 'Slow', timeBudget: 4, description: 'Smooth wave effect' },
  cinematic: { label: 'Cinematic', timeBudget: 2, description: 'Beautiful slow reveal' },
  custom: { label: 'Custom', timeBudget: 8, description: 'Custom time budget' },
};

export const ENGINE_INFO: Record<SegmentationEngine, { label: string; description: string; performance: string }> = {
  ringBFS: { 
    label: 'Ring BFS (V6)', 
    description: 'Progressive ring-based flood fill with time budgeting',
    performance: 'Balanced' 
  },
  scanline: { 
    label: 'Scanline', 
    description: 'Traditional horizontal scanline algorithm',
    performance: 'Fast' 
  },
  stackBFS: { 
    label: 'Stack BFS', 
    description: 'Stack-based breadth-first search',
    performance: 'Fast' 
  },
  recursiveDFS: { 
    label: 'Recursive DFS', 
    description: 'Recursive depth-first (small areas only)',
    performance: 'Very Fast (limited)' 
  },
  queueBFS: { 
    label: 'Queue BFS', 
    description: 'Queue-based breadth-first search',
    performance: 'Fast' 
  },
  hybrid: { 
    label: 'Hybrid Adaptive', 
    description: 'Automatically selects best algorithm',
    performance: 'Adaptive' 
  },
  contour: { 
    label: 'Contour Trace', 
    description: 'Edge-following contour detection',
    performance: 'Medium' 
  },
  watershed: { 
    label: 'Watershed', 
    description: 'Watershed segmentation algorithm',
    performance: 'Slow (accurate)' 
  },
};

export const FILL_METHOD_INFO: Record<FillMethod, { label: string; description: string }> = {
  '4-connected': { label: '4-Connected', description: 'Cardinal directions only (N/S/E/W)' },
  '8-connected': { label: '8-Connected', description: 'Include diagonals for smoother edges' },
  'adaptive': { label: 'Adaptive', description: 'Switch based on local complexity' },
  'anti-aliased': { label: 'Anti-Aliased', description: 'Smooth edge transitions' },
};

export const COLOR_SPACE_INFO: Record<ColorSpace, { label: string; description: string }> = {
  rgb: { label: 'RGB', description: 'Standard RGB color matching' },
  hsl: { label: 'HSL', description: 'Hue/Saturation/Lightness based' },
  lab: { label: 'CIELAB', description: 'Perceptually uniform (most accurate)' },
  hsv: { label: 'HSV', description: 'Hue/Saturation/Value based' },
  yuv: { label: 'YUV', description: 'Luminance/Chrominance based' },
};

export const TOLERANCE_MODE_INFO: Record<ToleranceMode, { label: string; description: string }> = {
  global: { label: 'Global', description: 'Compare all pixels to seed color' },
  local: { label: 'Local', description: 'Compare to neighboring pixels' },
  adaptive: { label: 'Adaptive', description: 'Adjust based on local variance' },
  perceptual: { label: 'Perceptual', description: 'Human perception weighted' },
};

export const EDGE_DETECTION_INFO: Record<EdgeDetection, { label: string; description: string }> = {
  none: { label: 'None', description: 'No edge detection' },
  sobel: { label: 'Sobel', description: 'Sobel edge detection' },
  canny: { label: 'Canny', description: 'Canny edge detection (accurate)' },
  laplacian: { label: 'Laplacian', description: 'Laplacian edge detection' },
  gradient: { label: 'Gradient', description: 'Simple gradient detection' },
};

export const DEFAULT_WAND_SETTINGS: WandSettingsState = {
  // Fill Animation
  fillSpeed: 'normal',
  timeBudgetMs: 8,
  expansionRate: 1,
  
  // Hover Preview
  hoverEnabled: true,
  hoverRefreshRate: 50,
  showPreview: true,
  previewOpacity: 0.6,
  ringVisualization: false,
  
  // Segmentation Engine
  engine: 'ringBFS',
  fillMethod: '4-connected',
  
  // Color Matching
  colorSpace: 'rgb',
  toleranceMode: 'global',
  antiAliasStrength: 0,
  
  // Edge Handling
  edgeDetection: 'none',
  edgeSoftness: 0,
  featherRadius: 0,
  
  // Advanced
  contiguousOnly: true,
  sampleAllLayers: false,
  growSelection: 0,
  smoothSelection: 0,
  
  // Performance
  maxPixels: 1000000,
  useWorker: false,
  chunkSize: 10000,
  
  // Debug/Development
  debugMode: false,
  showBoundary: false,
  showSeedPoint: true,
  logPerformance: false,
};
