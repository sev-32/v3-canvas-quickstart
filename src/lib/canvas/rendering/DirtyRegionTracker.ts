// Dirty Region Tracking for Optimized Canvas Rendering
// Only re-renders changed portions of the mask

import type { Bounds } from '../types';

export interface DirtyRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  isDirty: boolean;
}

export class DirtyRegionTracker {
  private width: number;
  private height: number;
  private previousMask: Uint8ClampedArray | null = null;
  private dirtyBounds: Bounds | null = null;
  private fullRedrawNeeded: boolean = true;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  // Compare new mask with previous and find dirty regions
  updateMask(newMask: Uint8ClampedArray): DirtyRegion {
    if (this.fullRedrawNeeded || !this.previousMask) {
      this.previousMask = new Uint8ClampedArray(newMask);
      this.fullRedrawNeeded = false;
      return {
        x: 0,
        y: 0,
        width: this.width,
        height: this.height,
        isDirty: true
      };
    }

    // Find bounding box of changed pixels
    let minX = this.width;
    let minY = this.height;
    let maxX = 0;
    let maxY = 0;
    let hasChanges = false;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        if (newMask[idx] !== this.previousMask[idx]) {
          hasChanges = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // Update previous mask
    this.previousMask.set(newMask);

    if (!hasChanges) {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        isDirty: false
      };
    }

    // Add padding for anti-aliasing
    const padding = 2;
    const region = {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: Math.min(this.width, maxX + padding + 1) - Math.max(0, minX - padding),
      height: Math.min(this.height, maxY + padding + 1) - Math.max(0, minY - padding),
      isDirty: true
    };

    this.dirtyBounds = {
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height
    };

    return region;
  }

  // Force full redraw on next update
  invalidate(): void {
    this.fullRedrawNeeded = true;
    this.previousMask = null;
  }

  // Get last dirty bounds
  getDirtyBounds(): Bounds | null {
    return this.dirtyBounds;
  }

  // Reset tracker
  reset(): void {
    this.previousMask = null;
    this.dirtyBounds = null;
    this.fullRedrawNeeded = true;
  }
}

// Fast dirty region detection using sampling (for large masks)
export function detectDirtyRegionFast(
  oldMask: Uint8ClampedArray,
  newMask: Uint8ClampedArray,
  width: number,
  height: number,
  sampleRate: number = 4
): DirtyRegion {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasChanges = false;

  // Sample at reduced rate for initial bounds
  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const idx = y * width + x;
      if (oldMask[idx] !== newMask[idx]) {
        hasChanges = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!hasChanges) {
    return { x: 0, y: 0, width: 0, height: 0, isDirty: false };
  }

  // Expand bounds by sample rate to ensure we catch all changes
  return {
    x: Math.max(0, minX - sampleRate),
    y: Math.max(0, minY - sampleRate),
    width: Math.min(width, maxX + sampleRate * 2) - Math.max(0, minX - sampleRate),
    height: Math.min(height, maxY + sampleRate * 2) - Math.max(0, minY - sampleRate),
    isDirty: true
  };
}
