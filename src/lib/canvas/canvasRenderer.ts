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

// Draw checkerboard transparency pattern
export function drawCheckerboard(ctx: CanvasRenderingContext2D): void {
  const size = CHECKERBOARD_SIZE;

  for (let y = 0; y < CANVAS_HEIGHT; y += size) {
    for (let x = 0; x < CANVAS_WIDTH; x += size) {
      const isEven = ((x / size) + (y / size)) % 2 === 0;
      ctx.fillStyle = isEven ? CHECKERBOARD_COLOR_1 : CHECKERBOARD_COLOR_2;
      ctx.fillRect(x, y, size, size);
    }
  }
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

// Draw selection overlay
export function drawSelection(
  ctx: CanvasRenderingContext2D,
  mask: Uint8ClampedArray,
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT
): void {
  ctx.save();

  // Create selection overlay
  const imageData = ctx.createImageData(width, height);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] > 0) {
      imageData.data[i * 4] = 59; // R (blue)
      imageData.data[i * 4 + 1] = 130; // G
      imageData.data[i * 4 + 2] = 246; // B
      imageData.data[i * 4 + 3] = 102; // A (40% opacity)
    }
  }

  // Draw to temp canvas then composite
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (tempCtx) {
    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0);
  }

  ctx.restore();
}

// Draw preview mask overlay
export function drawPreviewMask(
  ctx: CanvasRenderingContext2D,
  mask: Uint8ClampedArray,
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT
): void {
  ctx.save();

  // Create preview overlay (purple tint)
  const imageData = ctx.createImageData(width, height);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] > 0) {
      imageData.data[i * 4] = 147; // R (purple)
      imageData.data[i * 4 + 1] = 51; // G
      imageData.data[i * 4 + 2] = 234; // B
      imageData.data[i * 4 + 3] = 77; // A (30% opacity)
    }
  }

  // Draw to temp canvas then composite
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (tempCtx) {
    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0);
  }

  ctx.restore();
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
