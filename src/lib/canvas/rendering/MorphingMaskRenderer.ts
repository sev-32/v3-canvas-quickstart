// Morphing Mask Renderer - Beautiful Fluid Transitions Between Segment Previews
// Creates smooth organic morphing effect when cursor moves between regions

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

export interface MorphState {
  fromMask: Uint8ClampedArray | null;
  toMask: Uint8ClampedArray | null;
  progress: number;
  isAnimating: boolean;
  startTime: number;
}

export interface MorphConfig {
  duration: number;        // Morph duration in ms
  easing: 'linear' | 'easeOut' | 'easeInOut' | 'spring';
  blendMode: 'crossfade' | 'dissolve' | 'wave' | 'radial';
}

const DEFAULT_CONFIG: MorphConfig = {
  duration: 150,
  easing: 'easeOut',
  blendMode: 'crossfade',
};

// Easing functions
const easings = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  spring: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

export class MorphingMaskRenderer {
  private state: MorphState;
  private config: MorphConfig;
  private outputMask: Uint8ClampedArray;
  private width: number;
  private height: number;
  private animationFrameId: number | null = null;
  private onUpdate: ((mask: Uint8ClampedArray) => void) | null = null;

  // Cached canvas for rendering
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;

  constructor(width: number = CANVAS_WIDTH, height: number = CANVAS_HEIGHT, config?: Partial<MorphConfig>) {
    this.width = width;
    this.height = height;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.outputMask = new Uint8ClampedArray(width * height);
    this.state = {
      fromMask: null,
      toMask: null,
      progress: 0,
      isAnimating: false,
      startTime: 0,
    };
  }

  // Set callback for mask updates during animation
  setUpdateCallback(callback: (mask: Uint8ClampedArray) => void): void {
    this.onUpdate = callback;
  }

  // Configure morph settings
  setConfig(config: Partial<MorphConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Start morphing to a new mask
  morphTo(newMask: Uint8ClampedArray): void {
    // If no current mask, just set directly
    if (!this.state.toMask && !this.state.fromMask) {
      this.state.toMask = new Uint8ClampedArray(newMask);
      this.outputMask.set(newMask);
      if (this.onUpdate) {
        this.onUpdate(this.outputMask);
      }
      return;
    }

    // If already animating, use current interpolated state as 'from'
    if (this.state.isAnimating) {
      this.state.fromMask = new Uint8ClampedArray(this.outputMask);
    } else {
      this.state.fromMask = this.state.toMask ? new Uint8ClampedArray(this.state.toMask) : null;
    }

    this.state.toMask = new Uint8ClampedArray(newMask);
    this.state.progress = 0;
    this.state.startTime = performance.now();
    this.state.isAnimating = true;

    // Start animation loop
    this.animate();
  }

  // Set mask immediately without animation
  setImmediate(mask: Uint8ClampedArray): void {
    this.cancel();
    this.state.fromMask = null;
    this.state.toMask = new Uint8ClampedArray(mask);
    this.state.progress = 1;
    this.state.isAnimating = false;
    this.outputMask.set(mask);
    if (this.onUpdate) {
      this.onUpdate(this.outputMask);
    }
  }

  // Clear all masks
  clear(): void {
    this.cancel();
    this.state.fromMask = null;
    this.state.toMask = null;
    this.state.progress = 0;
    this.state.isAnimating = false;
    this.outputMask.fill(0);
    if (this.onUpdate) {
      this.onUpdate(this.outputMask);
    }
  }

  // Cancel ongoing animation
  cancel(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.state.isAnimating = false;
  }

  // Animation loop
  private animate = (): void => {
    const elapsed = performance.now() - this.state.startTime;
    const rawProgress = Math.min(1, elapsed / this.config.duration);
    
    // Apply easing
    this.state.progress = easings[this.config.easing](rawProgress);

    // Blend masks
    this.blendMasks();

    // Notify update
    if (this.onUpdate) {
      this.onUpdate(this.outputMask);
    }

    // Continue or complete
    if (rawProgress < 1) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      this.state.isAnimating = false;
      this.state.fromMask = null;
      this.animationFrameId = null;
    }
  };

  // Blend between from and to masks
  private blendMasks(): void {
    const { fromMask, toMask, progress } = this.state;
    
    if (!toMask) return;
    
    if (!fromMask) {
      // Fade in from nothing
      this.fadeIn(toMask, progress);
      return;
    }

    switch (this.config.blendMode) {
      case 'crossfade':
        this.crossfade(fromMask, toMask, progress);
        break;
      case 'dissolve':
        this.dissolve(fromMask, toMask, progress);
        break;
      case 'wave':
        this.waveBlend(fromMask, toMask, progress);
        break;
      case 'radial':
        this.radialBlend(fromMask, toMask, progress);
        break;
      default:
        this.crossfade(fromMask, toMask, progress);
    }
  }

  // Simple crossfade blend
  private crossfade(from: Uint8ClampedArray, to: Uint8ClampedArray, t: number): void {
    const len = this.outputMask.length;
    for (let i = 0; i < len; i++) {
      this.outputMask[i] = Math.round(from[i] * (1 - t) + to[i] * t);
    }
  }

  // Fade in effect
  private fadeIn(to: Uint8ClampedArray, t: number): void {
    const len = this.outputMask.length;
    for (let i = 0; i < len; i++) {
      this.outputMask[i] = Math.round(to[i] * t);
    }
  }

  // Random dissolve effect
  private dissolve(from: Uint8ClampedArray, to: Uint8ClampedArray, t: number): void {
    const len = this.outputMask.length;
    const threshold = t * 255;
    
    for (let i = 0; i < len; i++) {
      // Use position-based pseudo-random for consistency
      const noise = ((i * 2654435761) % 256);
      this.outputMask[i] = noise < threshold ? to[i] : from[i];
    }
  }

  // Wave-based blend (organic feel)
  private waveBlend(from: Uint8ClampedArray, to: Uint8ClampedArray, t: number): void {
    const len = this.outputMask.length;
    const waveFreq = 0.02;
    const wavePhase = t * Math.PI * 2;
    
    for (let i = 0; i < len; i++) {
      const x = i % this.width;
      const y = Math.floor(i / this.width);
      
      // Create wave pattern
      const wave = Math.sin(x * waveFreq + wavePhase) * 0.5 + 0.5;
      const localT = Math.min(1, Math.max(0, t * 2 - wave + 0.5));
      
      this.outputMask[i] = Math.round(from[i] * (1 - localT) + to[i] * localT);
    }
  }

  // Radial blend from center
  private radialBlend(from: Uint8ClampedArray, to: Uint8ClampedArray, t: number): void {
    const len = this.outputMask.length;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    
    for (let i = 0; i < len; i++) {
      const x = i % this.width;
      const y = Math.floor(i / this.width);
      
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      
      // Radial progress
      const localT = Math.min(1, Math.max(0, (t * 1.5) - dist));
      
      this.outputMask[i] = Math.round(from[i] * (1 - localT) + to[i] * localT);
    }
  }

  // Get current output mask
  getCurrentMask(): Uint8ClampedArray {
    return this.outputMask;
  }

  // Check if currently animating
  isAnimating(): boolean {
    return this.state.isAnimating;
  }

  // Get current progress
  getProgress(): number {
    return this.state.progress;
  }

  // Render mask to canvas context with color
  renderToContext(
    ctx: CanvasRenderingContext2D,
    color: number = 0x4DEA3393 // ABGR purple
  ): void {
    // Initialize cached canvas
    if (!this.canvas || this.canvas.width !== this.width) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
      this.imageData = this.ctx.createImageData(this.width, this.height);
    }

    if (!this.ctx || !this.imageData) return;

    // Use Uint32Array for fast pixel writes
    const data32 = new Uint32Array(this.imageData.data.buffer);
    const mask = this.outputMask;
    const len = mask.length;

    for (let i = 0; i < len; i++) {
      data32[i] = mask[i] > 0 ? color : 0;
    }

    this.ctx.putImageData(this.imageData, 0, 0);
    ctx.drawImage(this.canvas, 0, 0);
  }
}

// Create a morphing renderer instance
export function createMorphingRenderer(
  width?: number,
  height?: number,
  config?: Partial<MorphConfig>
): MorphingMaskRenderer {
  return new MorphingMaskRenderer(width, height, config);
}
