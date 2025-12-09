// V3 Coordinate System - THE Single Source of Truth for ALL Coordinate Conversions
// Rule 2: All Conversions Through CoordinateSystem
// Rule 6: World-to-Image is Identity

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import type { CoordinateSystemState, ScreenPoint, WorldPoint, ImagePoint } from './types';

export class CoordinateSystem {
  private state: CoordinateSystemState;

  constructor(initialState?: Partial<CoordinateSystemState>) {
    this.state = {
      panX: 0,
      panY: 0,
      zoom: 1,
      viewportWidth: 800,
      viewportHeight: 600,
      devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      ...initialState,
    };
  }

  updateState(updates: Partial<CoordinateSystemState>): void {
    this.state = { ...this.state, ...updates };
  }

  getState(): Readonly<CoordinateSystemState> {
    return { ...this.state };
  }

  // Screen → World (for event handling)
  // Rule 7: Screen-to-World Formula
  screenToWorld(screenX: number, screenY: number): WorldPoint {
    const { panX, panY, zoom, viewportWidth, viewportHeight } = this.state;
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    // Reverse transform: remove pan, remove zoom, adjust for center
    const worldX = (screenX - centerX - panX) / zoom + CANVAS_WIDTH / 2;
    const worldY = (screenY - centerY - panY) / zoom + CANVAS_HEIGHT / 2;

    return { x: worldX, y: worldY, __space: 'world' };
  }

  // World → Screen (for rendering UI elements)
  worldToScreen(worldX: number, worldY: number): ScreenPoint {
    const { panX, panY, zoom, viewportWidth, viewportHeight } = this.state;
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    // Apply transform: adjust for center, apply zoom, add pan
    const screenX = (worldX - CANVAS_WIDTH / 2) * zoom + centerX + panX;
    const screenY = (worldY - CANVAS_HEIGHT / 2) * zoom + centerY + panY;

    return { x: screenX, y: screenY, __space: 'screen' };
  }

  // World → Image (identity in V3)
  // Rule 6: World-to-Image is Identity
  worldToImage(worldX: number, worldY: number): ImagePoint {
    // World space origin = Image space origin (both top-left)
    return {
      x: Math.floor(worldX),
      y: Math.floor(worldY),
      __space: 'image',
    };
  }

  // Image → World (identity in V3)
  imageToWorld(imageX: number, imageY: number): WorldPoint {
    return {
      x: imageX,
      y: imageY,
      __space: 'world',
    };
  }

  // Apply transform to canvas context
  // Rule 4: Transform Order is Critical
  applyToContext(ctx: CanvasRenderingContext2D): void {
    const { panX, panY, zoom, viewportWidth, viewportHeight } = this.state;

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Move to viewport center, apply pan, apply zoom
    ctx.translate(viewportWidth / 2 + panX, viewportHeight / 2 + panY);
    ctx.scale(zoom, zoom);

    // Move origin to canvas top-left (world space origin)
    ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
  }

  // Check if world point is within canvas bounds
  isInBounds(worldPoint: WorldPoint): boolean {
    return (
      worldPoint.x >= 0 &&
      worldPoint.x < CANVAS_WIDTH &&
      worldPoint.y >= 0 &&
      worldPoint.y < CANVAS_HEIGHT
    );
  }

  // Get visible area in world coordinates
  getVisibleBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.state.viewportWidth, this.state.viewportHeight);

    return {
      minX: Math.max(0, topLeft.x),
      minY: Math.max(0, topLeft.y),
      maxX: Math.min(CANVAS_WIDTH, bottomRight.x),
      maxY: Math.min(CANVAS_HEIGHT, bottomRight.y),
    };
  }

  // Clamp zoom to valid range
  clampZoom(zoom: number): number {
    return Math.max(0.1, Math.min(10, zoom));
  }

  // Zoom to a specific point (keeps point stationary on screen)
  zoomToPoint(screenX: number, screenY: number, newZoom: number): void {
    const clampedZoom = this.clampZoom(newZoom);
    const worldPoint = this.screenToWorld(screenX, screenY);

    // Update zoom
    this.state.zoom = clampedZoom;

    // Calculate new screen position of the same world point
    const newScreenPos = this.worldToScreen(worldPoint.x, worldPoint.y);

    // Adjust pan to keep the point stationary
    this.state.panX += screenX - newScreenPos.x;
    this.state.panY += screenY - newScreenPos.y;
  }
}

// Singleton instance for global access
let coordinateSystemInstance: CoordinateSystem | null = null;

export function getCoordinateSystem(): CoordinateSystem {
  if (!coordinateSystemInstance) {
    coordinateSystemInstance = new CoordinateSystem();
  }
  return coordinateSystemInstance;
}

export function resetCoordinateSystem(): void {
  coordinateSystemInstance = null;
}
