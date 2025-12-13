// V3 Canvas Renderer - Dual Canvas Rendering Utilities

import { CoordinateSystem } from './CoordinateSystem';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CHECKERBOARD_SIZE,
  CHECKERBOARD_COLOR_1,
  CHECKERBOARD_COLOR_2,
  SELECTION_COLOR,
  SELECTION_BORDER_COLOR,
  PREVIEW_COLOR,
  SEED_HIGHLIGHT_COLOR,
} from './constants';
import type { Layer, WorldPoint } from './types';

// Cached checkerboard pattern
let cachedCheckerboard: HTMLCanvasElement | null = null;

// Draw checkerboard transparency pattern - CACHED VERSION
export function drawCheckerboard(ctx: CanvasRenderingContext2D): void {
  // Create pattern once and cache
  if (!cachedCheckerboard) {
    cachedCheckerboard = document.createElement('canvas');
    cachedCheckerboard.width = CANVAS_WIDTH;
    cachedCheckerboard.height = CANVAS_HEIGHT;
    const patternCtx = cachedCheckerboard.getContext('2d')!;
    
    const size = CHECKERBOARD_SIZE;
    for (let y = 0; y < CANVAS_HEIGHT; y += size) {
      for (let x = 0; x < CANVAS_WIDTH; x += size) {
        const isEven = ((x / size) + (y / size)) % 2 === 0;
        patternCtx.fillStyle = isEven ? CHECKERBOARD_COLOR_1 : CHECKERBOARD_COLOR_2;
        patternCtx.fillRect(x, y, size, size);
      }
    }
  }
  
  ctx.drawImage(cachedCheckerboard, 0, 0);
}

// Draw a layer to the canvas
export function drawLayer(ctx: CanvasRenderingContext2D, layer: Layer): void {
  if (!layer.imageData || !layer.visible) return;

  ctx.save();
  ctx.globalAlpha = layer.opacity;
  ctx.globalCompositeOperation = layer.blendingMode as GlobalCompositeOperation;

  // Create temporary canvas for layer
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = layer.imageData.width;
  tempCanvas.height = layer.imageData.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (tempCtx) {
    tempCtx.putImageData(layer.imageData, 0, 0);

    // Apply mask if present
    if (layer.mask) {
      const maskData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      for (let i = 0; i < layer.mask.length; i++) {
        maskData.data[i * 4 + 3] = Math.min(maskData.data[i * 4 + 3], layer.mask[i]);
      }
      tempCtx.putImageData(maskData, 0, 0);
    }

    ctx.drawImage(tempCanvas, 0, 0);
  }

  ctx.restore();
}

// Cached canvas for selection rendering
let cachedSelectionCanvas: HTMLCanvasElement | null = null;
let cachedSelectionCtx: CanvasRenderingContext2D | null = null;
let cachedSelectionImageData: ImageData | null = null;

// Draw selection overlay - OPTIMIZED VERSION
export function drawSelection(
  ctx: CanvasRenderingContext2D,
  mask: Uint8ClampedArray,
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT
): void {
  // Initialize cache
  if (!cachedSelectionCanvas || cachedSelectionCanvas.width !== width || cachedSelectionCanvas.height !== height) {
    cachedSelectionCanvas = document.createElement('canvas');
    cachedSelectionCanvas.width = width;
    cachedSelectionCanvas.height = height;
    cachedSelectionCtx = cachedSelectionCanvas.getContext('2d', { willReadFrequently: true })!;
    cachedSelectionImageData = cachedSelectionCtx.createImageData(width, height);
  }

  if (!cachedSelectionCtx || !cachedSelectionImageData) return;

  // Use Uint32Array for fast pixel writes
  const data32 = new Uint32Array(cachedSelectionImageData.data.buffer);
  
  // Pre-computed RGBA for blue selection (A=102, B=246, G=130, R=59)
  const SELECTION_RGBA = 0x66F6823B; // ABGR format
  
  const len = mask.length;
  for (let i = 0; i < len; i++) {
    data32[i] = mask[i] > 0 ? SELECTION_RGBA : 0;
  }

  cachedSelectionCtx.putImageData(cachedSelectionImageData, 0, 0);
  ctx.drawImage(cachedSelectionCanvas, 0, 0);
}

// Cached canvas for preview mask rendering
let cachedPreviewCanvas: HTMLCanvasElement | null = null;
let cachedPreviewCtx: CanvasRenderingContext2D | null = null;
let cachedPreviewImageData: ImageData | null = null;

// Draw preview mask overlay - OPTIMIZED VERSION
// Uses cached canvas, Uint32Array for fast pixel writes, and only redraws changed regions
export function drawPreviewMask(
  ctx: CanvasRenderingContext2D,
  mask: Uint8ClampedArray,
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT
): void {
  // Initialize cache on first call or size change
  if (!cachedPreviewCanvas || cachedPreviewCanvas.width !== width || cachedPreviewCanvas.height !== height) {
    cachedPreviewCanvas = document.createElement('canvas');
    cachedPreviewCanvas.width = width;
    cachedPreviewCanvas.height = height;
    cachedPreviewCtx = cachedPreviewCanvas.getContext('2d', { willReadFrequently: true })!;
    cachedPreviewImageData = cachedPreviewCtx.createImageData(width, height);
  }

  if (!cachedPreviewCtx || !cachedPreviewImageData) return;

  // Use Uint32Array view for 4x faster pixel writes
  const data32 = new Uint32Array(cachedPreviewImageData.data.buffer);
  
  // Pre-computed RGBA value for purple preview (0x4D9333 in ABGR format for little-endian)
  // A=77, B=234, G=51, R=147
  const PREVIEW_RGBA = 0x4DEA3393; // ABGR format
  const TRANSPARENT = 0x00000000;
  
  // Fast loop using Uint32
  const len = mask.length;
  for (let i = 0; i < len; i++) {
    data32[i] = mask[i] > 0 ? PREVIEW_RGBA : TRANSPARENT;
  }

  cachedPreviewCtx.putImageData(cachedPreviewImageData, 0, 0);
  ctx.drawImage(cachedPreviewCanvas, 0, 0);
}

// Alternative ultra-fast preview using ImageBitmap (async)
let pendingBitmap: Promise<ImageBitmap> | null = null;
let lastBitmapMask: Uint8ClampedArray | null = null;

export async function drawPreviewMaskAsync(
  ctx: CanvasRenderingContext2D,
  mask: Uint8ClampedArray,
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT
): Promise<void> {
  // Skip if same mask
  if (lastBitmapMask === mask && pendingBitmap) {
    const bitmap = await pendingBitmap;
    ctx.drawImage(bitmap, 0, 0);
    return;
  }

  lastBitmapMask = mask;

  // Create ImageData directly
  const imageData = new ImageData(width, height);
  const data32 = new Uint32Array(imageData.data.buffer);
  const PREVIEW_RGBA = 0x4DEA3393;
  
  for (let i = 0; i < mask.length; i++) {
    data32[i] = mask[i] > 0 ? PREVIEW_RGBA : 0;
  }

  pendingBitmap = createImageBitmap(imageData);
  const bitmap = await pendingBitmap;
  ctx.drawImage(bitmap, 0, 0);
}

// Draw instant seed highlight (Rule 12: Zero-Latency)
export function drawSeedHighlight(
  ctx: CanvasRenderingContext2D,
  seedPoint: WorldPoint
): void {
  ctx.save();
  ctx.fillStyle = SEED_HIGHLIGHT_COLOR;

  // Draw 3x3 seed highlight
  const x = Math.floor(seedPoint.x) - 1;
  const y = Math.floor(seedPoint.y) - 1;
  ctx.fillRect(x, y, 3, 3);

  ctx.restore();
}

// Draw marching ants selection border
export function drawMarchingAnts(
  ctx: CanvasRenderingContext2D,
  mask: Uint8ClampedArray,
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT,
  offset: number = 0
): void {
  ctx.save();

  // Find edge pixels
  const edges: [number, number][] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] > 0) {
        // Check if edge (has a non-selected neighbor)
        const isEdge =
          x === 0 ||
          x === width - 1 ||
          y === 0 ||
          y === height - 1 ||
          mask[idx - 1] === 0 ||
          mask[idx + 1] === 0 ||
          mask[idx - width] === 0 ||
          mask[idx + width] === 0;

        if (isEdge) {
          edges.push([x, y]);
        }
      }
    }
  }

  // Draw marching ants pattern
  ctx.strokeStyle = SELECTION_BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = offset;

  for (const [x, y] of edges) {
    ctx.strokeRect(x, y, 1, 1);
  }

  ctx.restore();
}

// Create composite of all visible layers
export function createComposite(layers: Layer[]): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Clear to transparent
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw layers from bottom to top
  for (const layer of layers) {
    if (layer.visible && layer.imageData) {
      drawLayer(ctx, layer);
    }
  }

  return ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// Setup canvas for high DPI displays
export function setupHighDPICanvas(
  canvas: HTMLCanvasElement,
  viewportWidth: number,
  viewportHeight: number
): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;

  // Set canvas buffer size
  canvas.width = viewportWidth * dpr;
  canvas.height = viewportHeight * dpr;

  // Set canvas display size
  canvas.style.width = `${viewportWidth}px`;
  canvas.style.height = `${viewportHeight}px`;

  const ctx = canvas.getContext('2d')!;

  // Scale context for DPR
  ctx.scale(dpr, dpr);

  return ctx;
}
