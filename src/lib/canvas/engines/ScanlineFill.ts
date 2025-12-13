// Scanline Flood Fill Engine - Traditional horizontal scanline algorithm
// Very fast for large contiguous areas

import type { WorldPoint, RGBA, Bounds } from '../types';

export interface ScanlineResult {
  completed: boolean;
  timeUsed: number;
  pixelsProcessed: number;
}

interface Span {
  y: number;
  xl: number;
  xr: number;
  dy: number;
}

export class ScanlineFill {
  private imageData: ImageData;
  private seedPoint: WorldPoint;
  private tolerance: number;
  private width: number;
  private height: number;

  private mask: Uint8ClampedArray;
  private visited: Uint8Array;
  private stack: Span[] = [];
  private isComplete: boolean = false;
  private seedColor: RGBA;
  private totalPixelsProcessed: number = 0;
  private expansionRate: number = 1;
  private linesProcessed: number = 0;

  // Bounds tracking
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

    const maxSize = this.width * this.height;
    this.mask = new Uint8ClampedArray(maxSize);
    this.visited = new Uint8Array(maxSize);

    // Get seed color
    const seedX = Math.floor(Math.max(0, Math.min(seedPoint.x, this.width - 1)));
    const seedY = Math.floor(Math.max(0, Math.min(seedPoint.y, this.height - 1)));
    this.seedColor = this.getPixelColor(seedX, seedY);

    // Initialize with seed span
    this.stack.push({ y: seedY, xl: seedX, xr: seedX, dy: 1 });
    this.stack.push({ y: seedY - 1, xl: seedX, xr: seedX, dy: -1 });
  }

  setExpansionRate(rate: number): void {
    this.expansionRate = Math.max(1, rate);
  }

  processSpans(timeBudgetMs: number = 8): ScanlineResult {
    const startTime = performance.now();
    let pixelsProcessed = 0;
    let spansProcessed = 0;

    while (spansProcessed < this.expansionRate * 10) {
      if (this.stack.length === 0) {
        this.isComplete = true;
        return { completed: true, timeUsed: performance.now() - startTime, pixelsProcessed };
      }

      // Check time budget
      if (spansProcessed > 0 && performance.now() - startTime >= timeBudgetMs) {
        break;
      }

      const span = this.stack.pop()!;
      let { y, xl, xr, dy } = span;

      if (y < 0 || y >= this.height) continue;

      let x = xl;

      // Scan left from start position
      while (x >= 0 && this.matchesAndUnvisited(x, y)) {
        this.addPixel(x, y);
        pixelsProcessed++;
        x--;
      }
      const lFill = x + 1;

      // Skip already processed section
      if (lFill < xl) {
        this.stack.push({ y: y - dy, xl: lFill, xr: xl - 1, dy: -dy });
      }

      x = xl;

      while (x <= xr) {
        // Scan right
        while (x < this.width && this.matchesAndUnvisited(x, y)) {
          this.addPixel(x, y);
          pixelsProcessed++;
          x++;
        }
        const rFill = x - 1;

        if (rFill > 0) {
          this.stack.push({ y: y + dy, xl: lFill, xr: rFill, dy });
        }

        // Handle gaps
        if (rFill > xr) {
          this.stack.push({ y: y - dy, xl: xr + 1, xr: rFill, dy: -dy });
        }

        // Skip to next unprocessed segment
        x++;
        while (x <= xr && !this.matchesAndUnvisited(x, y)) {
          x++;
        }
      }

      spansProcessed++;
      this.linesProcessed++;
    }

    this.totalPixelsProcessed += pixelsProcessed;

    if (this.stack.length === 0) {
      this.isComplete = true;
      return { completed: true, timeUsed: performance.now() - startTime, pixelsProcessed };
    }

    return { completed: false, timeUsed: performance.now() - startTime, pixelsProcessed };
  }

  processInstant(): ScanlineResult {
    const startTime = performance.now();
    let pixelsProcessed = 0;

    while (this.stack.length > 0) {
      const span = this.stack.pop()!;
      let { y, xl, xr, dy } = span;

      if (y < 0 || y >= this.height) continue;

      let x = xl;

      while (x >= 0 && this.matchesAndUnvisited(x, y)) {
        this.addPixel(x, y);
        pixelsProcessed++;
        x--;
      }
      const lFill = x + 1;

      if (lFill < xl) {
        this.stack.push({ y: y - dy, xl: lFill, xr: xl - 1, dy: -dy });
      }

      x = xl;

      while (x <= xr) {
        while (x < this.width && this.matchesAndUnvisited(x, y)) {
          this.addPixel(x, y);
          pixelsProcessed++;
          x++;
        }
        const rFill = x - 1;

        if (rFill > 0) {
          this.stack.push({ y: y + dy, xl: lFill, xr: rFill, dy });
        }

        if (rFill > xr) {
          this.stack.push({ y: y - dy, xl: xr + 1, xr: rFill, dy: -dy });
        }

        x++;
        while (x <= xr && !this.matchesAndUnvisited(x, y)) {
          x++;
        }
      }

      this.linesProcessed++;
    }

    this.totalPixelsProcessed += pixelsProcessed;
    this.isComplete = true;
    return { completed: true, timeUsed: performance.now() - startTime, pixelsProcessed };
  }

  private matchesAndUnvisited(x: number, y: number): boolean {
    const index = y * this.width + x;
    if (this.visited[index] !== 0) return false;

    const dataIndex = index * 4;
    const data = this.imageData.data;
    
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

    return similarity <= this.tolerance;
  }

  private addPixel(x: number, y: number): void {
    const index = y * this.width + x;
    this.visited[index] = 1;
    this.mask[index] = 255;

    if (x < this.minX) this.minX = x;
    if (x > this.maxX) this.maxX = x;
    if (y < this.minY) this.minY = y;
    if (y > this.maxY) this.maxY = y;
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

  getLinesProcessed(): number {
    return this.linesProcessed;
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
