// Stack BFS Flood Fill Engine - Fast stack-based implementation
// Uses array as stack with pop() for O(1) operations

import type { WorldPoint, RGBA, Bounds } from '../types';

export interface StackBFSResult {
  completed: boolean;
  timeUsed: number;
  pixelsProcessed: number;
}

export class StackBFS {
  private imageData: ImageData;
  private seedPoint: WorldPoint;
  private tolerance: number;
  private width: number;
  private height: number;

  private mask: Uint8ClampedArray;
  private visited: Uint8Array;
  private stack: Int32Array;
  private stackPointer: number = 0;
  private isComplete: boolean = false;
  private seedColor: RGBA;
  private totalPixelsProcessed: number = 0;
  private expansionRate: number = 1;
  private iterationCount: number = 0;

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
    this.stack = new Int32Array(maxSize);

    // Get seed color
    const seedX = Math.floor(Math.max(0, Math.min(seedPoint.x, this.width - 1)));
    const seedY = Math.floor(Math.max(0, Math.min(seedPoint.y, this.height - 1)));
    this.seedColor = this.getPixelColor(seedX, seedY);

    // Initialize with seed pixel
    const seedIndex = seedY * this.width + seedX;
    this.stack[0] = seedIndex;
    this.stackPointer = 1;
    this.visited[seedIndex] = 1;
    this.mask[seedIndex] = 255;
    this.minX = this.maxX = seedX;
    this.minY = this.maxY = seedY;
  }

  setExpansionRate(rate: number): void {
    this.expansionRate = Math.max(1, rate);
  }

  processChunk(timeBudgetMs: number = 8): StackBFSResult {
    const startTime = performance.now();
    let pixelsProcessed = 0;
    const targetPixels = this.expansionRate * 1000; // Process more per chunk

    while (pixelsProcessed < targetPixels) {
      if (this.stackPointer === 0) {
        this.isComplete = true;
        return { completed: true, timeUsed: performance.now() - startTime, pixelsProcessed };
      }

      // Check time budget periodically
      if (pixelsProcessed > 0 && pixelsProcessed % 500 === 0) {
        if (performance.now() - startTime >= timeBudgetMs) {
          break;
        }
      }

      // Pop from stack
      this.stackPointer--;
      const index = this.stack[this.stackPointer];
      const x = index % this.width;
      const y = (index / this.width) | 0;

      // Check 4-connected neighbors
      // Up
      if (y > 0) {
        const nIndex = index - this.width;
        if (this.visited[nIndex] === 0) {
          pixelsProcessed++;
          if (this.checkAndAddPixel(nIndex, x, y - 1)) {
            this.stack[this.stackPointer++] = nIndex;
          }
        }
      }
      // Down
      if (y < this.height - 1) {
        const nIndex = index + this.width;
        if (this.visited[nIndex] === 0) {
          pixelsProcessed++;
          if (this.checkAndAddPixel(nIndex, x, y + 1)) {
            this.stack[this.stackPointer++] = nIndex;
          }
        }
      }
      // Left
      if (x > 0) {
        const nIndex = index - 1;
        if (this.visited[nIndex] === 0) {
          pixelsProcessed++;
          if (this.checkAndAddPixel(nIndex, x - 1, y)) {
            this.stack[this.stackPointer++] = nIndex;
          }
        }
      }
      // Right
      if (x < this.width - 1) {
        const nIndex = index + 1;
        if (this.visited[nIndex] === 0) {
          pixelsProcessed++;
          if (this.checkAndAddPixel(nIndex, x + 1, y)) {
            this.stack[this.stackPointer++] = nIndex;
          }
        }
      }

      this.iterationCount++;
    }

    this.totalPixelsProcessed += pixelsProcessed;

    if (this.stackPointer === 0) {
      this.isComplete = true;
      return { completed: true, timeUsed: performance.now() - startTime, pixelsProcessed };
    }

    return { completed: false, timeUsed: performance.now() - startTime, pixelsProcessed };
  }

  processInstant(): StackBFSResult {
    const startTime = performance.now();
    let pixelsProcessed = 0;

    while (this.stackPointer > 0) {
      this.stackPointer--;
      const index = this.stack[this.stackPointer];
      const x = index % this.width;
      const y = (index / this.width) | 0;

      // Up
      if (y > 0) {
        const nIndex = index - this.width;
        if (this.visited[nIndex] === 0) {
          pixelsProcessed++;
          if (this.checkAndAddPixel(nIndex, x, y - 1)) {
            this.stack[this.stackPointer++] = nIndex;
          }
        }
      }
      // Down
      if (y < this.height - 1) {
        const nIndex = index + this.width;
        if (this.visited[nIndex] === 0) {
          pixelsProcessed++;
          if (this.checkAndAddPixel(nIndex, x, y + 1)) {
            this.stack[this.stackPointer++] = nIndex;
          }
        }
      }
      // Left
      if (x > 0) {
        const nIndex = index - 1;
        if (this.visited[nIndex] === 0) {
          pixelsProcessed++;
          if (this.checkAndAddPixel(nIndex, x - 1, y)) {
            this.stack[this.stackPointer++] = nIndex;
          }
        }
      }
      // Right
      if (x < this.width - 1) {
        const nIndex = index + 1;
        if (this.visited[nIndex] === 0) {
          pixelsProcessed++;
          if (this.checkAndAddPixel(nIndex, x + 1, y)) {
            this.stack[this.stackPointer++] = nIndex;
          }
        }
      }

      this.iterationCount++;
    }

    this.totalPixelsProcessed += pixelsProcessed;
    this.isComplete = true;
    return { completed: true, timeUsed: performance.now() - startTime, pixelsProcessed };
  }

  private checkAndAddPixel(index: number, x: number, y: number): boolean {
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

    if (similarity <= this.tolerance) {
      this.visited[index] = 1;
      this.mask[index] = 255;
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

  getIterationCount(): number {
    return this.iterationCount;
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
