// Real-time Performance Overlay for Segmentation Preview
// Shows separate stats for segmentation time and render/draw time

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SegmentationEngine } from '@/lib/canvas/segmentationTypes';

export interface PerformanceStats {
  // Segmentation metrics
  ringCount: number;
  pixelsProcessed: number;
  segmentationTime: number;
  pixelsPerSecond: number;
  
  // Render metrics
  drawTime: number;
  morphTime: number;
  totalFrameTime: number;
  
  // Status
  isActive: boolean;
  isComplete: boolean;
  isMorphing: boolean;
  engine: SegmentationEngine;
  
  // Advanced
  dirtyRegionSize: number;
  useWorker: boolean;
}

interface PerformanceOverlayProps {
  stats: PerformanceStats;
  visible: boolean;
}

export function PerformanceOverlay({ stats, visible }: PerformanceOverlayProps) {
  const [segHistory, setSegHistory] = useState<number[]>([]);
  const [drawHistory, setDrawHistory] = useState<number[]>([]);
  const maxHistory = 30;

  useEffect(() => {
    if (stats.segmentationTime > 0) {
      setSegHistory(prev => {
        const next = [...prev, stats.segmentationTime];
        if (next.length > maxHistory) next.shift();
        return next;
      });
    }
    if (stats.drawTime > 0) {
      setDrawHistory(prev => {
        const next = [...prev, stats.drawTime];
        if (next.length > maxHistory) next.shift();
        return next;
      });
    }
  }, [stats.segmentationTime, stats.drawTime]);

  const avgSegTime = segHistory.length > 0 
    ? segHistory.reduce((a, b) => a + b, 0) / segHistory.length 
    : 0;
  
  const avgDrawTime = drawHistory.length > 0
    ? drawHistory.reduce((a, b) => a + b, 0) / drawHistory.length
    : 0;

  const formatNumber = (n: number): string => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toFixed(0);
  };

  const getStatusColor = () => {
    if (!stats.isActive) return 'text-muted-foreground';
    if (stats.isComplete) return 'text-green-400';
    return 'text-primary';
  };

  const getTimeColor = (time: number) => {
    if (time < 4) return 'text-green-400';
    if (time < 8) return 'text-yellow-400';
    if (time < 16) return 'text-orange-400';
    return 'text-red-400';
  };

  const getBarColor = (time: number) => {
    if (time < 4) return 'bg-green-400';
    if (time < 8) return 'bg-yellow-400';
    if (time < 16) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="absolute top-4 left-4 glass-morphism rounded-lg p-3 min-w-[220px] font-mono text-xs select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
            <span className="text-muted-foreground text-[10px] tracking-wider">PERF MONITOR</span>
            <div className="flex items-center gap-2">
              {stats.useWorker && (
                <span className="text-[9px] text-cyan-400 bg-cyan-400/10 px-1 rounded">WORKER</span>
              )}
              {stats.isMorphing && (
                <span className="text-[9px] text-purple-400 bg-purple-400/10 px-1 rounded">MORPH</span>
              )}
              <span className={`${getStatusColor()} flex items-center gap-1`}>
                {stats.isActive && !stats.isComplete && (
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
                <span className="text-[10px]">
                  {stats.isComplete ? 'DONE' : stats.isActive ? 'ACTIVE' : 'IDLE'}
                </span>
              </span>
            </div>
          </div>

          {/* Engine */}
          <div className="flex justify-between mb-1.5">
            <span className="text-muted-foreground">Engine:</span>
            <span className="text-foreground font-medium">{stats.engine.toUpperCase()}</span>
          </div>

          {/* Ring/Iteration Count */}
          <div className="flex justify-between mb-1.5">
            <span className="text-muted-foreground">
              {stats.engine === 'scanline' ? 'Lines:' : 'Rings:'}
            </span>
            <span className="text-foreground">{stats.ringCount}</span>
          </div>

          {/* Pixels Processed */}
          <div className="flex justify-between mb-1.5">
            <span className="text-muted-foreground">Pixels:</span>
            <span className="text-foreground">{formatNumber(stats.pixelsProcessed)}</span>
          </div>

          {/* Pixels Per Second */}
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Px/sec:</span>
            <span className="text-primary font-medium">{formatNumber(stats.pixelsPerSecond)}</span>
          </div>

          {/* Timing Section */}
          <div className="pt-2 border-t border-border/50">
            <div className="text-[10px] text-muted-foreground mb-1.5 tracking-wider">TIMING</div>
            
            {/* Segmentation Time */}
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Segment:</span>
              <span className={getTimeColor(avgSegTime)}>{avgSegTime.toFixed(2)}ms</span>
            </div>

            {/* Draw Time */}
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Draw:</span>
              <span className={getTimeColor(avgDrawTime)}>{avgDrawTime.toFixed(2)}ms</span>
            </div>

            {/* Morph Time (if morphing) */}
            {stats.morphTime > 0 && (
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Morph:</span>
                <span className="text-purple-400">{stats.morphTime.toFixed(2)}ms</span>
              </div>
            )}

            {/* Total Frame Time */}
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Total:</span>
              <span className={getTimeColor(stats.totalFrameTime)}>{stats.totalFrameTime.toFixed(2)}ms</span>
            </div>

            {/* Dirty Region (if tracking) */}
            {stats.dirtyRegionSize > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Dirty:</span>
                <span className="text-foreground">{formatNumber(stats.dirtyRegionSize)}px</span>
              </div>
            )}
          </div>

          {/* Dual Graph - Segment vs Draw */}
          {(segHistory.length > 0 || drawHistory.length > 0) && (
            <div className="pt-2 border-t border-border/50">
              <div className="text-[10px] text-muted-foreground mb-1.5 tracking-wider">FRAME BUDGET</div>
              
              <div className="h-10 relative">
                {/* 16ms budget line */}
                <div className="absolute w-full h-px bg-yellow-400/30 top-[40%]" />
                <div className="absolute right-0 top-[38%] text-[8px] text-yellow-400/50">16ms</div>
                
                {/* Stacked bars */}
                <div className="h-full flex items-end gap-px">
                  {Array.from({ length: maxHistory }).map((_, i) => {
                    const segTime = segHistory[i] || 0;
                    const drawTime = drawHistory[i] || 0;
                    const totalTime = segTime + drawTime;
                    const maxTime = 20;
                    
                    const segHeight = Math.min(100, (segTime / maxTime) * 100);
                    const drawHeight = Math.min(100 - segHeight, (drawTime / maxTime) * 100);
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col-reverse">
                        {segTime > 0 && (
                          <div
                            className={`${getBarColor(segTime)} opacity-70 rounded-t-sm`}
                            style={{ height: `${segHeight}%` }}
                          />
                        )}
                        {drawTime > 0 && (
                          <div
                            className="bg-cyan-400 opacity-50 rounded-t-sm"
                            style={{ height: `${drawHeight}%` }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex gap-3 mt-1 text-[9px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-sm opacity-70" />
                  <span className="text-muted-foreground">Seg</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-sm opacity-50" />
                  <span className="text-muted-foreground">Draw</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Default stats for initialization
export const DEFAULT_PERFORMANCE_STATS: PerformanceStats = {
  ringCount: 0,
  pixelsProcessed: 0,
  segmentationTime: 0,
  pixelsPerSecond: 0,
  drawTime: 0,
  morphTime: 0,
  totalFrameTime: 0,
  isActive: false,
  isComplete: false,
  isMorphing: false,
  engine: 'ringBFS',
  dirtyRegionSize: 0,
  useWorker: false,
};
