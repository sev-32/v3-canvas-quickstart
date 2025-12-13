// Real-time Performance Overlay for Segmentation Preview

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SegmentationEngine } from '@/lib/canvas/segmentationTypes';

export interface PerformanceStats {
  ringCount: number;
  pixelsProcessed: number;
  frameTime: number;
  pixelsPerSecond: number;
  isActive: boolean;
  isComplete: boolean;
  engine: SegmentationEngine;
}

interface PerformanceOverlayProps {
  stats: PerformanceStats;
  visible: boolean;
}

export function PerformanceOverlay({ stats, visible }: PerformanceOverlayProps) {
  const [history, setHistory] = useState<number[]>([]);
  const maxHistory = 30;

  useEffect(() => {
    if (stats.frameTime > 0) {
      setHistory(prev => {
        const next = [...prev, stats.frameTime];
        if (next.length > maxHistory) next.shift();
        return next;
      });
    }
  }, [stats.frameTime]);

  const avgFrameTime = history.length > 0 
    ? history.reduce((a, b) => a + b, 0) / history.length 
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

  const getFrameTimeColor = () => {
    if (avgFrameTime < 8) return 'text-green-400';
    if (avgFrameTime < 16) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="absolute top-4 left-4 glass-morphism rounded-lg p-3 min-w-[200px] font-mono text-xs"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
            <span className="text-muted-foreground">PERF MONITOR</span>
            <span className={`${getStatusColor()} flex items-center gap-1`}>
              {stats.isActive && !stats.isComplete && (
                <motion.span
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
              {stats.isComplete ? 'DONE' : stats.isActive ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>

          {/* Engine */}
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Engine:</span>
            <span className="text-foreground">{stats.engine.toUpperCase()}</span>
          </div>

          {/* Ring/Iteration Count */}
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">
              {stats.engine === 'scanline' ? 'Lines:' : 'Rings:'}
            </span>
            <span className="text-foreground">{stats.ringCount}</span>
          </div>

          {/* Pixels Processed */}
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Pixels:</span>
            <span className="text-foreground">{formatNumber(stats.pixelsProcessed)}</span>
          </div>

          {/* Pixels Per Second */}
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Px/sec:</span>
            <span className="text-primary">{formatNumber(stats.pixelsPerSecond)}</span>
          </div>

          {/* Frame Time */}
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Frame:</span>
            <span className={getFrameTimeColor()}>{avgFrameTime.toFixed(2)}ms</span>
          </div>

          {/* Mini Graph */}
          {history.length > 0 && (
            <div className="h-8 flex items-end gap-px mt-2 border-t border-border/50 pt-2">
              {history.map((time, i) => {
                const height = Math.min(100, (time / 16) * 100);
                const color = time < 8 ? 'bg-green-400' : time < 16 ? 'bg-yellow-400' : 'bg-red-400';
                return (
                  <div
                    key={i}
                    className={`flex-1 ${color} opacity-70 rounded-t-sm`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing performance stats
export function usePerformanceStats(engine: SegmentationEngine) {
  const [stats, setStats] = useState<PerformanceStats>({
    ringCount: 0,
    pixelsProcessed: 0,
    frameTime: 0,
    pixelsPerSecond: 0,
    isActive: false,
    isComplete: false,
    engine,
  });

  const startTimeRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const pixelsAtLastUpdateRef = useRef<number>(0);

  const startTracking = () => {
    startTimeRef.current = performance.now();
    lastUpdateRef.current = performance.now();
    pixelsAtLastUpdateRef.current = 0;
    setStats(prev => ({
      ...prev,
      ringCount: 0,
      pixelsProcessed: 0,
      frameTime: 0,
      pixelsPerSecond: 0,
      isActive: true,
      isComplete: false,
    }));
  };

  const updateStats = (ringCount: number, pixelsProcessed: number, frameTime: number) => {
    const now = performance.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // Calculate pixels per second
    let pixelsPerSecond = 0;
    if (timeSinceLastUpdate > 0) {
      const pixelsDelta = pixelsProcessed - pixelsAtLastUpdateRef.current;
      pixelsPerSecond = (pixelsDelta / timeSinceLastUpdate) * 1000;
    }

    lastUpdateRef.current = now;
    pixelsAtLastUpdateRef.current = pixelsProcessed;

    setStats(prev => ({
      ...prev,
      ringCount,
      pixelsProcessed,
      frameTime,
      pixelsPerSecond: pixelsPerSecond > 0 ? pixelsPerSecond : prev.pixelsPerSecond,
      engine,
    }));
  };

  const completeTracking = () => {
    setStats(prev => ({
      ...prev,
      isActive: false,
      isComplete: true,
    }));
  };

  const resetStats = () => {
    setStats({
      ringCount: 0,
      pixelsProcessed: 0,
      frameTime: 0,
      pixelsPerSecond: 0,
      isActive: false,
      isComplete: false,
      engine,
    });
  };

  return {
    stats,
    startTracking,
    updateStats,
    completeTracking,
    resetStats,
    setEngine: (newEngine: SegmentationEngine) => {
      setStats(prev => ({ ...prev, engine: newEngine }));
    },
  };
}
