// Rendering module exports
export { DirtyRegionTracker, detectDirtyRegionFast, type DirtyRegion } from './DirtyRegionTracker';
export { MorphingMaskRenderer, createMorphingRenderer, type MorphState, type MorphConfig } from './MorphingMaskRenderer';
export { OffscreenMaskRenderer, createOffscreenRenderer, type RenderResult } from './OffscreenMaskRenderer';
export { createMaskRenderWorker } from './MaskRenderWorker';
