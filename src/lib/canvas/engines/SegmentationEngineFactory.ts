// Unified Segmentation Engine Factory
// Provides a consistent interface across all flood fill algorithms

import { RingBFS } from '../RingBFS';
import { ScanlineFill } from './ScanlineFill';
import { StackBFS } from './StackBFS';
import { QueueBFS } from './QueueBFS';
import type { WorldPoint, Bounds } from '../types';
import type { SegmentationEngine } from '../segmentationTypes';

export interface EngineResult {
  completed: boolean;
  timeUsed: number;
  pixelsProcessed: number;
}

export interface SegmentationEngineInterface {
  processFrame(timeBudgetMs: number): EngineResult;
  processInstant(): EngineResult;
  getCurrentMask(): Uint8ClampedArray;
  getCurrentBounds(): Bounds;
  getIterationCount(): number;
  getTotalPixelsProcessed(): number;
  isCompleted(): boolean;
  updateTolerance(newTolerance: number): void;
  setExpansionRate(rate: number): void;
}

// Wrapper to normalize all engines to the same interface
class RingBFSWrapper implements SegmentationEngineInterface {
  private engine: RingBFS;
  
  constructor(imageData: ImageData, seedPoint: WorldPoint, tolerance: number, expansionRate: number) {
    this.engine = new RingBFS(imageData, seedPoint, tolerance, expansionRate);
  }
  
  processFrame(timeBudgetMs: number): EngineResult {
    return this.engine.processRing(timeBudgetMs);
  }
  
  processInstant(): EngineResult {
    return this.engine.processInstant();
  }
  
  getCurrentMask(): Uint8ClampedArray {
    return this.engine.getCurrentMask();
  }
  
  getCurrentBounds(): Bounds {
    return this.engine.getCurrentBounds();
  }
  
  getIterationCount(): number {
    return this.engine.getRingNumber();
  }
  
  getTotalPixelsProcessed(): number {
    return this.engine.getTotalPixelsProcessed();
  }
  
  isCompleted(): boolean {
    return this.engine.isCompleted();
  }
  
  updateTolerance(newTolerance: number): void {
    this.engine.updateTolerance(newTolerance);
  }
  
  setExpansionRate(rate: number): void {
    this.engine.setExpansionRate(rate);
  }
}

class ScanlineWrapper implements SegmentationEngineInterface {
  private engine: ScanlineFill;
  
  constructor(imageData: ImageData, seedPoint: WorldPoint, tolerance: number, expansionRate: number) {
    this.engine = new ScanlineFill(imageData, seedPoint, tolerance, expansionRate);
  }
  
  processFrame(timeBudgetMs: number): EngineResult {
    return this.engine.processSpans(timeBudgetMs);
  }
  
  processInstant(): EngineResult {
    return this.engine.processInstant();
  }
  
  getCurrentMask(): Uint8ClampedArray {
    return this.engine.getCurrentMask();
  }
  
  getCurrentBounds(): Bounds {
    return this.engine.getCurrentBounds();
  }
  
  getIterationCount(): number {
    return this.engine.getLinesProcessed();
  }
  
  getTotalPixelsProcessed(): number {
    return this.engine.getTotalPixelsProcessed();
  }
  
  isCompleted(): boolean {
    return this.engine.isCompleted();
  }
  
  updateTolerance(newTolerance: number): void {
    this.engine.updateTolerance(newTolerance);
  }
  
  setExpansionRate(rate: number): void {
    this.engine.setExpansionRate(rate);
  }
}

class StackBFSWrapper implements SegmentationEngineInterface {
  private engine: StackBFS;
  
  constructor(imageData: ImageData, seedPoint: WorldPoint, tolerance: number, expansionRate: number) {
    this.engine = new StackBFS(imageData, seedPoint, tolerance, expansionRate);
  }
  
  processFrame(timeBudgetMs: number): EngineResult {
    return this.engine.processChunk(timeBudgetMs);
  }
  
  processInstant(): EngineResult {
    return this.engine.processInstant();
  }
  
  getCurrentMask(): Uint8ClampedArray {
    return this.engine.getCurrentMask();
  }
  
  getCurrentBounds(): Bounds {
    return this.engine.getCurrentBounds();
  }
  
  getIterationCount(): number {
    return this.engine.getIterationCount();
  }
  
  getTotalPixelsProcessed(): number {
    return this.engine.getTotalPixelsProcessed();
  }
  
  isCompleted(): boolean {
    return this.engine.isCompleted();
  }
  
  updateTolerance(newTolerance: number): void {
    this.engine.updateTolerance(newTolerance);
  }
  
  setExpansionRate(rate: number): void {
    this.engine.setExpansionRate(rate);
  }
}

class QueueBFSWrapper implements SegmentationEngineInterface {
  private engine: QueueBFS;
  
  constructor(imageData: ImageData, seedPoint: WorldPoint, tolerance: number, expansionRate: number) {
    this.engine = new QueueBFS(imageData, seedPoint, tolerance, expansionRate);
  }
  
  processFrame(timeBudgetMs: number): EngineResult {
    return this.engine.processChunk(timeBudgetMs);
  }
  
  processInstant(): EngineResult {
    return this.engine.processInstant();
  }
  
  getCurrentMask(): Uint8ClampedArray {
    return this.engine.getCurrentMask();
  }
  
  getCurrentBounds(): Bounds {
    return this.engine.getCurrentBounds();
  }
  
  getIterationCount(): number {
    return this.engine.getIterationCount();
  }
  
  getTotalPixelsProcessed(): number {
    return this.engine.getTotalPixelsProcessed();
  }
  
  isCompleted(): boolean {
    return this.engine.isCompleted();
  }
  
  updateTolerance(newTolerance: number): void {
    this.engine.updateTolerance(newTolerance);
  }
  
  setExpansionRate(rate: number): void {
    this.engine.setExpansionRate(rate);
  }
}

// Factory function
export function createSegmentationEngine(
  engineType: SegmentationEngine,
  imageData: ImageData,
  seedPoint: WorldPoint,
  tolerance: number,
  expansionRate: number = 1
): SegmentationEngineInterface {
  switch (engineType) {
    case 'scanline':
      return new ScanlineWrapper(imageData, seedPoint, tolerance, expansionRate);
    case 'stackBFS':
      return new StackBFSWrapper(imageData, seedPoint, tolerance, expansionRate);
    case 'queueBFS':
      return new QueueBFSWrapper(imageData, seedPoint, tolerance, expansionRate);
    case 'ringBFS':
    default:
      return new RingBFSWrapper(imageData, seedPoint, tolerance, expansionRate);
  }
}
