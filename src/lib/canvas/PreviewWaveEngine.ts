// V3 Preview Wave Engine - Progressive Segmentation Preview
// Rule 11: Progressive Preview is Mandatory
// Rule 12: Zero-Latency Seed Highlight
// Rule 13: Request Cancellation is Required

import { RingBFS } from './RingBFS';
import type { WorldPoint, PreviewCallback, PreviewResult } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PREVIEW_TIME_BUDGET_MS } from './constants';

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

export class PreviewWaveEngine {
  private ringBFS: RingBFS | null = null;
  private requestCancellation: RequestCancellation;
  private animationFrameId: number | null = null;
  private lastSeedPoint: WorldPoint | null = null;

  constructor() {
    this.requestCancellation = new RequestCancellation();
  }

  startWave(
    imageData: ImageData,
    seedPoint: WorldPoint,
    tolerance: number,
    onProgress?: PreviewCallback,
    onComplete?: PreviewCallback
  ): number {
    // 1. Cancel any existing preview
    this.cancel();

    // 2. Generate request ID
    const requestId = this.requestCancellation.startPreview();

    // 3. Store seed point
    this.lastSeedPoint = seedPoint;

    // 4. Initialize RingBFS
    this.ringBFS = new RingBFS(imageData, seedPoint, tolerance);

    // 5. Provide immediate feedback with seed point
    const initialMask = this.ringBFS.getCurrentMask();
    const initialBounds = this.ringBFS.getCurrentBounds();
    if (onProgress) {
      onProgress({ mask: initialMask, bounds: initialBounds, complete: false });
    }

    // 6. Start progressive expansion
    this.scheduleFrame(requestId, onProgress, onComplete);

    return requestId;
  }

  private scheduleFrame(
    requestId: number,
    onProgress?: PreviewCallback,
    onComplete?: PreviewCallback
  ): void {
    this.animationFrameId = requestAnimationFrame(() => {
      // Check if request is still valid
      if (!this.requestCancellation.isValid(requestId)) {
        return; // Cancelled
      }

      if (!this.ringBFS) return;

      // Process one ring (time-budgeted)
      const result = this.ringBFS.processRing(PREVIEW_TIME_BUDGET_MS);

      // Get current state
      const mask = this.ringBFS.getCurrentMask();
      const bounds = this.ringBFS.getCurrentBounds();

      if (mask && bounds) {
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
      }

      // Schedule next frame
      this.scheduleFrame(requestId, onProgress, onComplete);
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
