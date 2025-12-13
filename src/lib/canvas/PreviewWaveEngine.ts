// V3 Preview Wave Engine - Unified Multi-Engine Progressive Segmentation
// Supports multiple algorithms: RingBFS, Scanline, StackBFS, QueueBFS

import { createSegmentationEngine, type SegmentationEngineInterface } from './engines/SegmentationEngineFactory';
import type { WorldPoint, PreviewCallback } from './types';
import type { SegmentationEngine } from './segmentationTypes';
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
  engine?: SegmentationEngine;
}

export interface WaveEngineStats {
  ringCount: number;
  pixelsProcessed: number;
  frameTime: number;
}

export type StatsCallback = (stats: WaveEngineStats) => void;

export class PreviewWaveEngine {
  private engine: SegmentationEngineInterface | null = null;
  private requestCancellation: RequestCancellation;
  private animationFrameId: number | null = null;
  private lastSeedPoint: WorldPoint | null = null;
  private options: WaveEngineOptions = {};
  private currentEngineType: SegmentationEngine = 'ringBFS';
  private statsCallback: StatsCallback | null = null;

  constructor() {
    this.requestCancellation = new RequestCancellation();
  }

  setStatsCallback(callback: StatsCallback | null): void {
    this.statsCallback = callback;
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
    const engineType = this.options.engine ?? 'ringBFS';

    this.currentEngineType = engineType;

    // 4. Create the appropriate engine
    this.engine = createSegmentationEngine(
      engineType,
      imageData,
      seedPoint,
      tolerance,
      expansionRate
    );

    // 5. Handle instant mode - complete immediately
    if (instantMode || timeBudgetMs >= 1000) {
      const result = this.engine.processInstant();
      const mask = this.engine.getCurrentMask();
      const bounds = this.engine.getCurrentBounds();
      
      // Report stats
      if (this.statsCallback) {
        this.statsCallback({
          ringCount: this.engine.getIterationCount(),
          pixelsProcessed: this.engine.getTotalPixelsProcessed(),
          frameTime: result.timeUsed,
        });
      }
      
      if (onProgress) {
        onProgress({ mask, bounds, complete: true });
      }
      if (onComplete) {
        onComplete({ mask, bounds, complete: true });
      }
      
      this.engine = null;
      return requestId;
    }

    // 6. Provide immediate feedback with seed point
    const initialMask = this.engine.getCurrentMask();
    const initialBounds = this.engine.getCurrentBounds();
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

      if (!this.engine) return;

      // Process frame with time budget
      const result = this.engine.processFrame(timeBudgetMs);

      // Get current state
      const mask = this.engine.getCurrentMask();
      const bounds = this.engine.getCurrentBounds();

      // Report stats
      if (this.statsCallback) {
        this.statsCallback({
          ringCount: this.engine.getIterationCount(),
          pixelsProcessed: this.engine.getTotalPixelsProcessed(),
          frameTime: result.timeUsed,
        });
      }

      // Notify progress
      if (onProgress) {
        onProgress({ mask, bounds, complete: result.completed });
      }

      if (result.completed) {
        // Notify complete
        if (onComplete) {
          onComplete({ mask, bounds, complete: true });
        }
        this.engine = null;
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
    this.engine = null;
    this.lastSeedPoint = null;
  }

  updateTolerance(newTolerance: number): void {
    if (this.engine) {
      this.engine.updateTolerance(newTolerance);
    }
  }

  isActive(): boolean {
    return this.engine !== null;
  }

  getLastSeedPoint(): WorldPoint | null {
    return this.lastSeedPoint;
  }

  getCurrentEngineType(): SegmentationEngine {
    return this.currentEngineType;
  }

  getCurrentProgress(): { ringNumber: number; pixelsProcessed: number } | null {
    if (!this.engine) return null;
    return {
      ringNumber: this.engine.getIterationCount(),
      pixelsProcessed: this.engine.getTotalPixelsProcessed(),
    };
  }
}

// Factory function
export function createPreviewWaveEngine(): PreviewWaveEngine {
  return new PreviewWaveEngine();
}
