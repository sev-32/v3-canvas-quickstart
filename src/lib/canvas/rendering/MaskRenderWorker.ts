// Web Worker for Off-Thread Mask Rendering
// Processes mask data into ImageData on a separate thread

// This file contains the worker code as a string for inline creation
export const MASK_RENDER_WORKER_CODE = `
// Worker script for mask rendering
self.onmessage = function(e) {
  const { type, mask, width, height, color, requestId } = e.data;
  
  if (type === 'render') {
    // Create ImageData buffer
    const buffer = new ArrayBuffer(width * height * 4);
    const data32 = new Uint32Array(buffer);
    
    // Parse color (ABGR format for little-endian)
    const rgba = color || 0x4DEA3393; // Default purple preview
    
    // Fast fill using Uint32
    const len = mask.length;
    for (let i = 0; i < len; i++) {
      data32[i] = mask[i] > 0 ? rgba : 0;
    }
    
    // Transfer the buffer back
    self.postMessage({
      type: 'rendered',
      buffer: buffer,
      width: width,
      height: height,
      requestId: requestId
    }, [buffer]);
  }
  
  if (type === 'morph') {
    const { maskFrom, maskTo, progress, width, height, requestId } = e.data;
    
    const buffer = new ArrayBuffer(width * height * 4);
    const data32 = new Uint32Array(buffer);
    const rgba = e.data.color || 0x4DEA3393;
    
    const len = maskFrom.length;
    for (let i = 0; i < len; i++) {
      // Blend between masks based on progress
      const fromVal = maskFrom[i];
      const toVal = maskTo[i];
      const blended = Math.round(fromVal * (1 - progress) + toVal * progress);
      data32[i] = blended > 0 ? rgba : 0;
    }
    
    self.postMessage({
      type: 'morphed',
      buffer: buffer,
      width: width,
      height: height,
      requestId: requestId
    }, [buffer]);
  }
};
`;

// Create worker from inline code
export function createMaskRenderWorker(): Worker | null {
  try {
    const blob = new Blob([MASK_RENDER_WORKER_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    return worker;
  } catch (e) {
    console.warn('Web Worker creation failed, falling back to main thread:', e);
    return null;
  }
}
