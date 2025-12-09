// V3 RingBFS - Progressive Ring-Based Flood Fill Algorithm
// Rule 11: Progressive Preview is Mandatory
// Rule 15: Perceptually Accurate Color Similarity

import type { WorldPoint, RGBA, Bounds } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PREVIEW_TIME_BUDGET_MS } from './constants';

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
  private queue: number[]; // Current ring
  private nextRing: number[]; // Next ring
  private frontier: number[]; // Rejected pixels on frontier (for breathing tolerance)
  private ringNumber: number = 0;
  private isComplete: boolean = false;
  private seedColor: RGBA;
  private totalPixelsProcessed: number = 0;

  constructor(imageData: ImageData, seedPoint: WorldPoint, tolerance: number) {
    this.imageData = imageData;
    this.seedPoint = seedPoint;
    this.tolerance = tolerance;
    this.width = imageData.width;
    this.height = imageData.height;

    // Initialize arrays
    this.mask = new Uint8ClampedArray(this.width * this.height);
    this.visited = new Uint8Array(this.width * this.height);
    this.queue = [];
    this.nextRing = [];
    this.frontier = [];

    // Get seed color
    const seedImageX = Math.floor(Math.max(0, Math.min(seedPoint.x, this.width - 1)));
    const seedImageY = Math.floor(Math.max(0, Math.min(seedPoint.y, this.height - 1)));
    this.seedColor = this.getPixelColor(seedImageX, seedImageY);

    // Initialize with seed point
    const seedIndex = seedImageY * this.width + seedImageX;
    this.queue.push(seedIndex);
    this.visited[seedIndex] = 1;
    this.mask[seedIndex] = 255;
  }

  processRing(timeBudgetMs: number = PREVIEW_TIME_BUDGET_MS): RingProcessResult {
    const startTime = performance.now();
    let pixelsProcessed = 0;

    // Process current ring
    while (this.queue.length > 0) {
      // Check time budget
      if (performance.now() - startTime >= timeBudgetMs) {
        return { completed: false, timeUsed: performance.now() - startTime, pixelsProcessed };
      }

      const index = this.queue.shift()!;
      const x = index % this.width;
      const y = Math.floor(index / this.width);

      // Check 4-connected neighbors
      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;

        const nIndex = ny * this.width + nx;
        if (this.visited[nIndex] !== 0) continue;

        pixelsProcessed++;
        const neighborColor = this.getPixelColor(nx, ny);
        const similarity = this.colorSimilarity(this.seedColor, neighborColor);

        if (similarity <= this.tolerance) {
          // Accept pixel
          this.visited[nIndex] = 1;
          this.mask[nIndex] = 255;
          this.nextRing.push(nIndex);
        } else {
          // Rejected - add to frontier for potential breathing tolerance
          this.visited[nIndex] = 2;
          this.frontier.push(nIndex);
        }
      }
    }

    this.totalPixelsProcessed += pixelsProcessed;

    // Move to next ring
    if (this.nextRing.length > 0) {
      this.queue = this.nextRing;
      this.nextRing = [];
      this.ringNumber++;
      return { completed: false, timeUsed: performance.now() - startTime, pixelsProcessed };
    }

    this.isComplete = true;
    return { completed: true, timeUsed: performance.now() - startTime, pixelsProcessed };
  }

  getCurrentMask(): Uint8ClampedArray {
    return this.mask;
  }

  getCurrentBounds(): Bounds {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        if (this.mask[index] > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (minX === Infinity) {
      // No pixels selected, return seed point bounds
      const seedX = Math.floor(this.seedPoint.x);
      const seedY = Math.floor(this.seedPoint.y);
      return { x: seedX, y: seedY, width: 1, height: 1 };
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
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

  // Rule 16: Breathing Tolerance (Optional but Recommended)
  updateTolerance(newTolerance: number): void {
    if (newTolerance <= this.tolerance) {
      // Tolerance decreased - need to re-evaluate
      this.tolerance = newTolerance;
      return;
    }

    this.tolerance = newTolerance;

    // Re-test frontier pixels
    const newlyAccepted: number[] = [];
    for (const index of this.frontier) {
      const x = index % this.width;
      const y = Math.floor(index / this.width);
      const color = this.getPixelColor(x, y);
      const similarity = this.colorSimilarity(this.seedColor, color);

      if (similarity <= newTolerance) {
        this.visited[index] = 1;
        this.mask[index] = 255;
        newlyAccepted.push(index);
      }
    }

    // Add newly accepted to queue for further expansion
    if (newlyAccepted.length > 0) {
      this.queue.push(...newlyAccepted);
      this.frontier = this.frontier.filter((idx) => !newlyAccepted.includes(idx));
      this.isComplete = false;
    }
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

  // Rule 15: Perceptually Accurate Color Similarity
  private colorSimilarity(c1: RGBA, c2: RGBA): number {
    const rDiff = c1.r - c2.r;
    const gDiff = c1.g - c2.g;
    const bDiff = c1.b - c2.b;
    const aDiff = c1.a - c2.a;

    // Weighted by human eye sensitivity
    return Math.sqrt(
      0.3 * rDiff * rDiff + 0.59 * gDiff * gDiff + 0.11 * bDiff * bDiff + aDiff * aDiff
    );
  }
}
