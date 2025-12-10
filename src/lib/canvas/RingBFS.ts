// V3 RingBFS - Fast Progressive Ring-Based Flood Fill Algorithm
// Optimized with array index instead of shift() and batch processing

import type { WorldPoint, RGBA, Bounds } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

export interface RingProcessResult {
  completed: boolean;
  timeUsed: number;
  pixelsProcessed: number;
}

export class RingBFS {
  private imageData: ImageData;
  private seedPoint: WorldPoint;
  private tolerance: number;
  private width: number;
  private height: number;

  private mask: Uint8ClampedArray;
  private visited: Uint8Array; // 0=unseen, 1=accepted, 2=rejected
  private currentRing: Int32Array;
  private currentRingSize: number = 0;
  private nextRing: Int32Array;
  private nextRingSize: number = 0;
  private ringNumber: number = 0;
  private isComplete: boolean = false;
  private seedColor: RGBA;
  private totalPixelsProcessed: number = 0;
  private expansionRate: number = 1;

  // Bounds tracking (updated incrementally)
  private minX: number = Infinity;
  private minY: number = Infinity;
  private maxX: number = -Infinity;
  private maxY: number = -Infinity;

  constructor(imageData: ImageData, seedPoint: WorldPoint, tolerance: number, expansionRate: number = 1) {
    this.imageData = imageData;
    this.seedPoint = seedPoint;
    this.tolerance = tolerance;
    this.width = imageData.width;
    this.height = imageData.height;
    this.expansionRate = Math.max(1, expansionRate);

    // Pre-allocate arrays for performance (avoid resizing)
    const maxSize = this.width * this.height;
    this.mask = new Uint8ClampedArray(maxSize);
    this.visited = new Uint8Array(maxSize);
    this.currentRing = new Int32Array(maxSize);
    this.nextRing = new Int32Array(maxSize);

    // Get seed color
    const seedImageX = Math.floor(Math.max(0, Math.min(seedPoint.x, this.width - 1)));
    const seedImageY = Math.floor(Math.max(0, Math.min(seedPoint.y, this.height - 1)));
    this.seedColor = this.getPixelColor(seedImageX, seedImageY);

    // Initialize with seed point
    const seedIndex = seedImageY * this.width + seedImageX;
    this.currentRing[0] = seedIndex;
    this.currentRingSize = 1;
    this.visited[seedIndex] = 1;
    this.mask[seedIndex] = 255;
    
    // Update bounds
    this.minX = this.maxX = seedImageX;
    this.minY = this.maxY = seedImageY;
  }

  setExpansionRate(rate: number): void {
    this.expansionRate = Math.max(1, rate);
  }

  // Process multiple rings based on expansion rate - FAST version
  processRing(timeBudgetMs: number = 8): RingProcessResult {
    const startTime = performance.now();
    let pixelsProcessed = 0;
    let ringsProcessed = 0;

    // Process multiple rings based on expansion rate
    while (ringsProcessed < this.expansionRate) {
      if (this.currentRingSize === 0) {
        this.isComplete = true;
        return { completed: true, timeUsed: performance.now() - startTime, pixelsProcessed };
      }

      // Check time budget (but complete at least one ring)
      if (ringsProcessed > 0 && performance.now() - startTime >= timeBudgetMs) {
        break;
      }

      // Process entire current ring at once (FAST - no shift())
      for (let i = 0; i < this.currentRingSize; i++) {
        const index = this.currentRing[i];
        const x = index % this.width;
        const y = (index / this.width) | 0; // Fast floor

        // Check 4-connected neighbors using direct calculations
        // Up
        if (y > 0) {
          const nIndex = index - this.width;
          if (this.visited[nIndex] === 0) {
            pixelsProcessed++;
            if (this.checkAndAddPixel(nIndex, x, y - 1)) {
              this.nextRing[this.nextRingSize++] = nIndex;
            }
          }
        }
        // Down
        if (y < this.height - 1) {
          const nIndex = index + this.width;
          if (this.visited[nIndex] === 0) {
            pixelsProcessed++;
            if (this.checkAndAddPixel(nIndex, x, y + 1)) {
              this.nextRing[this.nextRingSize++] = nIndex;
            }
          }
        }
        // Left
        if (x > 0) {
          const nIndex = index - 1;
          if (this.visited[nIndex] === 0) {
            pixelsProcessed++;
            if (this.checkAndAddPixel(nIndex, x - 1, y)) {
              this.nextRing[this.nextRingSize++] = nIndex;
            }
          }
        }
        // Right
        if (x < this.width - 1) {
          const nIndex = index + 1;
          if (this.visited[nIndex] === 0) {
            pixelsProcessed++;
            if (this.checkAndAddPixel(nIndex, x + 1, y)) {
              this.nextRing[this.nextRingSize++] = nIndex;
            }
          }
        }
      }

      // Swap rings (fast - just swap references)
      const temp = this.currentRing;
      this.currentRing = this.nextRing;
      this.nextRing = temp;
      this.currentRingSize = this.nextRingSize;
      this.nextRingSize = 0;
      this.ringNumber++;
      ringsProcessed++;
    }

    this.totalPixelsProcessed += pixelsProcessed;

    if (this.currentRingSize === 0) {
      this.isComplete = true;
      return { completed: true, timeUsed: performance.now() - startTime, pixelsProcessed };
    }

    return { completed: false, timeUsed: performance.now() - startTime, pixelsProcessed };
  }

  // Inline check and add for performance
  private checkAndAddPixel(index: number, x: number, y: number): boolean {
    const dataIndex = index * 4;
    const data = this.imageData.data;
    
    // Fast inline color similarity
    const rDiff = this.seedColor.r - data[dataIndex];
    const gDiff = this.seedColor.g - data[dataIndex + 1];
    const bDiff = this.seedColor.b - data[dataIndex + 2];
    const aDiff = this.seedColor.a - data[dataIndex + 3];
    
    const similarity = Math.sqrt(
      0.3 * rDiff * rDiff + 
      0.59 * gDiff * gDiff + 
      0.11 * bDiff * bDiff + 
      aDiff * aDiff
    );

    if (similarity <= this.tolerance) {
      this.visited[index] = 1;
      this.mask[index] = 255;
      // Update bounds incrementally
      if (x < this.minX) this.minX = x;
      if (x > this.maxX) this.maxX = x;
      if (y < this.minY) this.minY = y;
      if (y > this.maxY) this.maxY = y;
      return true;
    } else {
      this.visited[index] = 2;
      return false;
    }
  }

  // INSTANT fill - complete everything in one call
  processInstant(): RingProcessResult {
    const startTime = performance.now();
    let pixelsProcessed = 0;

    while (this.currentRingSize > 0) {
      for (let i = 0; i < this.currentRingSize; i++) {
        const index = this.currentRing[i];
        const x = index % this.width;
        const y = (index / this.width) | 0;

        // Up
        if (y > 0) {
          const nIndex = index - this.width;
          if (this.visited[nIndex] === 0) {
            pixelsProcessed++;
            if (this.checkAndAddPixel(nIndex, x, y - 1)) {
              this.nextRing[this.nextRingSize++] = nIndex;
            }
          }
        }
        // Down
        if (y < this.height - 1) {
          const nIndex = index + this.width;
          if (this.visited[nIndex] === 0) {
            pixelsProcessed++;
            if (this.checkAndAddPixel(nIndex, x, y + 1)) {
              this.nextRing[this.nextRingSize++] = nIndex;
            }
          }
        }
        // Left
        if (x > 0) {
          const nIndex = index - 1;
          if (this.visited[nIndex] === 0) {
            pixelsProcessed++;
            if (this.checkAndAddPixel(nIndex, x - 1, y)) {
              this.nextRing[this.nextRingSize++] = nIndex;
            }
          }
        }
        // Right
        if (x < this.width - 1) {
          const nIndex = index + 1;
          if (this.visited[nIndex] === 0) {
            pixelsProcessed++;
            if (this.checkAndAddPixel(nIndex, x + 1, y)) {
              this.nextRing[this.nextRingSize++] = nIndex;
            }
          }
        }
      }

      // Swap rings
      const temp = this.currentRing;
      this.currentRing = this.nextRing;
      this.nextRing = temp;
      this.currentRingSize = this.nextRingSize;
      this.nextRingSize = 0;
      this.ringNumber++;
    }

    this.totalPixelsProcessed += pixelsProcessed;
    this.isComplete = true;
    return { completed: true, timeUsed: performance.now() - startTime, pixelsProcessed };
  }

  getCurrentMask(): Uint8ClampedArray {
    return this.mask;
  }

  getCurrentBounds(): Bounds {
    if (this.minX === Infinity) {
      const seedX = Math.floor(this.seedPoint.x);
      const seedY = Math.floor(this.seedPoint.y);
      return { x: seedX, y: seedY, width: 1, height: 1 };
    }

    return {
      x: this.minX,
      y: this.minY,
      width: this.maxX - this.minX + 1,
      height: this.maxY - this.minY + 1,
    };
  }

  getRingNumber(): number {
    return this.ringNumber;
  }

  getTotalPixelsProcessed(): number {
    return this.totalPixelsProcessed;
  }

  isCompleted(): boolean {
    return this.isComplete;
  }

  updateTolerance(newTolerance: number): void {
    this.tolerance = newTolerance;
  }

  private getPixelColor(x: number, y: number): RGBA {
    const index = (y * this.width + x) * 4;
    return {
      r: this.imageData.data[index],
      g: this.imageData.data[index + 1],
      b: this.imageData.data[index + 2],
      a: this.imageData.data[index + 3],
    };
  }
}
