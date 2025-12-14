// OffscreenCanvas Mask Renderer
// Renders masks on OffscreenCanvas for improved performance

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { createMaskRenderWorker } from './MaskRenderWorker';

export interface RenderResult {
  bitmap?: ImageBitmap;
  imageData?: ImageData;
  renderTime: number;
}

export class OffscreenMaskRenderer {
  private width: number;
  private height: number;
  private worker: Worker | null = null;
  private offscreen: OffscreenCanvas | null = null;
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
  private fallbackCanvas: HTMLCanvasElement | null = null;
  private fallbackCtx: CanvasRenderingContext2D | null = null;
  private fallbackImageData: ImageData | null = null;
  private pendingRequests: Map<number, {
    resolve: (result: RenderResult) => void;
    startTime: number;
  }> = new Map();
  private requestCounter: number = 0;
  private useOffscreen: boolean = false;

  constructor(width: number = CANVAS_WIDTH, height: number = CANVAS_HEIGHT) {
    this.width = width;
    this.height = height;
    this.initialize();
  }

  private initialize(): void {
    // Try to create OffscreenCanvas
    if (typeof OffscreenCanvas !== 'undefined') {
      try {
        this.offscreen = new OffscreenCanvas(this.width, this.height);
        this.offscreenCtx = this.offscreen.getContext('2d', { willReadFrequently: true });
        this.useOffscreen = true;
      } catch (e) {
        console.warn('OffscreenCanvas not supported, using fallback');
      }
    }

    // Create worker for off-thread rendering
    this.worker = createMaskRenderWorker();
    if (this.worker) {
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
    }

    // Fallback canvas for main thread rendering
    this.fallbackCanvas = document.createElement('canvas');
    this.fallbackCanvas.width = this.width;
    this.fallbackCanvas.height = this.height;
    this.fallbackCtx = this.fallbackCanvas.getContext('2d', { willReadFrequently: true });
    if (this.fallbackCtx) {
      this.fallbackImageData = this.fallbackCtx.createImageData(this.width, this.height);
    }
  }

  private handleWorkerMessage(e: MessageEvent): void {
    const { type, buffer, width, height, requestId } = e.data;
    
    const pending = this.pendingRequests.get(requestId);
    if (!pending) return;

    if (type === 'rendered' || type === 'morphed') {
      const renderTime = performance.now() - pending.startTime;
      
      // Create ImageData from transferred buffer
      const data = new Uint8ClampedArray(buffer);
      const imageData = new ImageData(data, width, height);
      
      pending.resolve({
        imageData,
        renderTime
      });
      
      this.pendingRequests.delete(requestId);
    }
  }

  // Render mask asynchronously using Web Worker
  async renderAsync(
    mask: Uint8ClampedArray,
    color: number = 0x4DEA3393
  ): Promise<RenderResult> {
    const startTime = performance.now();

    // If worker available, use off-thread rendering
    if (this.worker) {
      return new Promise((resolve) => {
        const requestId = ++this.requestCounter;
        this.pendingRequests.set(requestId, { resolve, startTime });
        
        // Transfer mask data to worker
        this.worker!.postMessage({
          type: 'render',
          mask: mask,
          width: this.width,
          height: this.height,
          color: color,
          requestId: requestId
        });
      });
    }

    // Fallback to main thread rendering
    return this.renderSync(mask, color);
  }

  // Render mask synchronously on main thread
  renderSync(
    mask: Uint8ClampedArray,
    color: number = 0x4DEA3393
  ): RenderResult {
    const startTime = performance.now();

    if (!this.fallbackCtx || !this.fallbackImageData) {
      return { renderTime: 0 };
    }

    // Use Uint32Array for fast pixel writes
    const data32 = new Uint32Array(this.fallbackImageData.data.buffer);
    const len = mask.length;

    for (let i = 0; i < len; i++) {
      data32[i] = mask[i] > 0 ? color : 0;
    }

    this.fallbackCtx.putImageData(this.fallbackImageData, 0, 0);

    return {
      imageData: this.fallbackImageData,
      renderTime: performance.now() - startTime
    };
  }

  // Draw rendered mask to target context
  drawToContext(
    ctx: CanvasRenderingContext2D,
    result: RenderResult
  ): void {
    if (result.imageData && this.fallbackCtx && this.fallbackCanvas) {
      this.fallbackCtx.putImageData(result.imageData, 0, 0);
      ctx.drawImage(this.fallbackCanvas, 0, 0);
    } else if (result.bitmap) {
      ctx.drawImage(result.bitmap, 0, 0);
    }
  }

  // Direct render and draw in one call
  renderAndDraw(
    ctx: CanvasRenderingContext2D,
    mask: Uint8ClampedArray,
    color: number = 0x4DEA3393
  ): number {
    const result = this.renderSync(mask, color);
    if (this.fallbackCanvas) {
      ctx.drawImage(this.fallbackCanvas, 0, 0);
    }
    return result.renderTime;
  }

  // Morph between two masks asynchronously
  async morphAsync(
    maskFrom: Uint8ClampedArray,
    maskTo: Uint8ClampedArray,
    progress: number,
    color: number = 0x4DEA3393
  ): Promise<RenderResult> {
    const startTime = performance.now();

    if (this.worker) {
      return new Promise((resolve) => {
        const requestId = ++this.requestCounter;
        this.pendingRequests.set(requestId, { resolve, startTime });
        
        this.worker!.postMessage({
          type: 'morph',
          maskFrom: maskFrom,
          maskTo: maskTo,
          progress: progress,
          width: this.width,
          height: this.height,
          color: color,
          requestId: requestId
        });
      });
    }

    // Fallback synchronous morph
    return this.morphSync(maskFrom, maskTo, progress, color);
  }

  // Morph synchronously
  morphSync(
    maskFrom: Uint8ClampedArray,
    maskTo: Uint8ClampedArray,
    progress: number,
    color: number = 0x4DEA3393
  ): RenderResult {
    const startTime = performance.now();

    if (!this.fallbackCtx || !this.fallbackImageData) {
      return { renderTime: 0 };
    }

    const data32 = new Uint32Array(this.fallbackImageData.data.buffer);
    const len = maskFrom.length;

    for (let i = 0; i < len; i++) {
      const blended = Math.round(maskFrom[i] * (1 - progress) + maskTo[i] * progress);
      data32[i] = blended > 0 ? color : 0;
    }

    this.fallbackCtx.putImageData(this.fallbackImageData, 0, 0);

    return {
      imageData: this.fallbackImageData,
      renderTime: performance.now() - startTime
    };
  }

  // Clean up resources
  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.offscreen = null;
    this.offscreenCtx = null;
    this.fallbackCanvas = null;
    this.fallbackCtx = null;
    this.fallbackImageData = null;
    this.pendingRequests.clear();
  }

  // Check if using offscreen canvas
  isUsingOffscreen(): boolean {
    return this.useOffscreen;
  }

  // Check if worker is available
  hasWorker(): boolean {
    return this.worker !== null;
  }
}

// Factory function
export function createOffscreenRenderer(
  width?: number,
  height?: number
): OffscreenMaskRenderer {
  return new OffscreenMaskRenderer(width, height);
}
