// V3 Preview Wave Engine - Fast Progressive Segmentation Preview
// Optimized for speed with expansion rate support

import { RingBFS } from './RingBFS';
import type { WorldPoint, PreviewCallback } from './types';
import { PREVIEW_TIME_BUDGET_MS } from './constants';

class RequestCancellation {
  private currentRequestId: number = 0;
  private activeRequestId: number | null = null;

  startPreview(): number {
    this.currentRequestId++;
    this.activeRequestId = this.currentRequestId;
    return this.currentRequestId;
  }

  isValid(requestId: number): boolean {
    return this.activeRequestId === requestId;
  }

  cancelAll(): void {
    this.activeRequestId = null;
  }
}

export interface WaveEngineOptions {
  timeBudgetMs?: number;
  expansionRate?: number;
  instantMode?: boolean;
}

export class PreviewWaveEngine {
  private ringBFS: RingBFS | null = null;
  private requestCancellation: RequestCancellation;
  private animationFrameId: number | null = null;
  private lastSeedPoint: WorldPoint | null = null;
  private options: WaveEngineOptions = {};

  constructor() {
    this.requestCancellation = new RequestCancellation();
  }

  startWave(
    imageData: ImageData,
    seedPoint: WorldPoint,
    tolerance: number,
    onProgress?: PreviewCallback,
    onComplete?: PreviewCallback,
    options?: WaveEngineOptions
  ): number {
    // 1. Cancel any existing preview
    this.cancel();

    // 2. Generate request ID
    const requestId = this.requestCancellation.startPreview();

    // 3. Store options
    this.lastSeedPoint = seedPoint;
    this.options = options || {};

    const timeBudgetMs = this.options.timeBudgetMs ?? PREVIEW_TIME_BUDGET_MS;
    const expansionRate = this.options.expansionRate ?? 1;
    const instantMode = this.options.instantMode ?? false;

    // 4. Initialize RingBFS with expansion rate
    this.ringBFS = new RingBFS(imageData, seedPoint, tolerance, expansionRate);

    // 5. Handle instant mode - complete immediately
    if (instantMode || timeBudgetMs >= 1000) {
      const result = this.ringBFS.processInstant();
      const mask = this.ringBFS.getCurrentMask();
      const bounds = this.ringBFS.getCurrentBounds();
      
      if (onProgress) {
        onProgress({ mask, bounds, complete: true });
      }
      if (onComplete) {
        onComplete({ mask, bounds, complete: true });
      }
      
      this.ringBFS = null;
      return requestId;
    }

    // 6. Provide immediate feedback with seed point
    const initialMask = this.ringBFS.getCurrentMask();
    const initialBounds = this.ringBFS.getCurrentBounds();
    if (onProgress) {
      onProgress({ mask: initialMask, bounds: initialBounds, complete: false });
    }

    // 7. Start progressive expansion
    this.scheduleFrame(requestId, timeBudgetMs, onProgress, onComplete);

    return requestId;
  }

  private scheduleFrame(
    requestId: number,
    timeBudgetMs: number,
    onProgress?: PreviewCallback,
    onComplete?: PreviewCallback
  ): void {
    this.animationFrameId = requestAnimationFrame(() => {
      // Check if request is still valid
      if (!this.requestCancellation.isValid(requestId)) {
        return; // Cancelled
      }

      if (!this.ringBFS) return;

      // Process ring(s) with time budget
      const result = this.ringBFS.processRing(timeBudgetMs);

      // Get current state
      const mask = this.ringBFS.getCurrentMask();
      const bounds = this.ringBFS.getCurrentBounds();

      // Notify progress
      if (onProgress) {
        onProgress({ mask, bounds, complete: result.completed });
      }

      if (result.completed) {
        // Notify complete
        if (onComplete) {
          onComplete({ mask, bounds, complete: true });
        }
        this.ringBFS = null;
        return;
      }

      // Schedule next frame
      this.scheduleFrame(requestId, timeBudgetMs, onProgress, onComplete);
    });
  }

  cancel(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.requestCancellation.cancelAll();
    this.ringBFS = null;
    this.lastSeedPoint = null;
  }

  updateTolerance(newTolerance: number): void {
    if (this.ringBFS) {
      this.ringBFS.updateTolerance(newTolerance);
    }
  }

  isActive(): boolean {
    return this.ringBFS !== null;
  }

  getLastSeedPoint(): WorldPoint | null {
    return this.lastSeedPoint;
  }

  getCurrentProgress(): { ringNumber: number; pixelsProcessed: number } | null {
    if (!this.ringBFS) return null;
    return {
      ringNumber: this.ringBFS.getRingNumber(),
      pixelsProcessed: this.ringBFS.getTotalPixelsProcessed(),
    };
  }
}

// Factory function
export function createPreviewWaveEngine(): PreviewWaveEngine {
  return new PreviewWaveEngine();
}
