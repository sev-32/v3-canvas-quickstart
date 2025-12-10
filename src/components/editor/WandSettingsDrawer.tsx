import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Zap,
  Timer,
  Gauge,
  MousePointer2,
  RefreshCw,
  Eye,
  Cpu,
  Palette,
  Waves,
  Grid3X3,
  Bug,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Layers2,
  Move,
  Maximize2,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type {
  WandSettingsState,
  FillSpeed,
  SegmentationEngine,
  FillMethod,
  ColorSpace,
  ToleranceMode,
  EdgeDetection,
} from '@/lib/canvas/segmentationTypes';
import {
  FILL_SPEED_PRESETS,
  ENGINE_INFO,
  FILL_METHOD_INFO,
  COLOR_SPACE_INFO,
  TOLERANCE_MODE_INFO,
  EDGE_DETECTION_INFO,
  DEFAULT_WAND_SETTINGS,
} from '@/lib/canvas/segmentationTypes';

interface WandSettingsDrawerProps {
  settings: WandSettingsState;
  tolerance: number;
  onSettingsChange: (settings: WandSettingsState) => void;
  onToleranceChange: (tolerance: number) => void;
  onClose: () => void;
}

export function WandSettingsDrawer({
  settings,
  tolerance,
  onSettingsChange,
  onToleranceChange,
  onClose,
}: WandSettingsDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'tolerance',
    'speed',
    'engine',
  ]);

  const updateSetting = <K extends keyof WandSettingsState>(
    key: K,
    value: WandSettingsState[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleSpeedChange = (speed: FillSpeed) => {
    updateSetting('fillSpeed', speed);
    if (speed !== 'custom') {
      updateSetting('timeBudgetMs', FILL_SPEED_PRESETS[speed].timeBudget);
    }
  };

  const resetToDefaults = () => {
    onSettingsChange(DEFAULT_WAND_SETTINGS);
    onToleranceChange(32);
  };

  const SpeedIcon = {
    instant: Zap,
    fast: Gauge,
    normal: Timer,
    slow: RefreshCw,
    cinematic: Eye,
    custom: Gauge,
  }[settings.fillSpeed];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-80 h-full glass-morphism border-l border-border flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Magic Wand Settings</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={resetToDefaults}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Accordion
            type="multiple"
            value={expandedSections}
            onValueChange={setExpandedSections}
            className="space-y-2"
          >
            {/* Tolerance Section */}
            <AccordionItem value="tolerance" className="border rounded-lg border-border">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-accent/50 rounded-t-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Palette className="w-4 h-4 text-primary" />
                  <span>Tolerance</span>
                  <Badge variant="secondary" className="ml-auto font-mono text-xs">
                    {tolerance}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-3">
                <Slider
                  value={[tolerance]}
                  onValueChange={([val]) => onToleranceChange(val)}
                  min={0}
                  max={255}
                  step={1}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Exact (0)</span>
                  <span>Loose (255)</span>
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label className="text-xs">Tolerance Mode</Label>
                  <Select
                    value={settings.toleranceMode}
                    onValueChange={(v: ToleranceMode) => updateSetting('toleranceMode', v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TOLERANCE_MODE_INFO).map(([key, info]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          <div>
                            <div>{info.label}</div>
                            <div className="text-[10px] text-muted-foreground">{info.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-[10px] text-muted-foreground bg-accent/30 p-2 rounded">
                  <strong>Tip:</strong> Scroll on canvas to adjust live
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Fill Speed Section */}
            <AccordionItem value="speed" className="border rounded-lg border-border">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-2 text-sm">
                  <SpeedIcon className="w-4 h-4 text-primary" />
                  <span>Fill Animation</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {FILL_SPEED_PRESETS[settings.fillSpeed].label}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-3">
                <div className="grid grid-cols-3 gap-1">
                  {(Object.keys(FILL_SPEED_PRESETS) as FillSpeed[]).map((speed) => {
                    const preset = FILL_SPEED_PRESETS[speed];
                    const isActive = settings.fillSpeed === speed;
                    return (
                      <Button
                        key={speed}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSpeedChange(speed)}
                        className={`h-8 text-[10px] ${
                          isActive ? '' : 'border-border'
                        }`}
                      >
                        {preset.label}
                      </Button>
                    );
                  })}
                </div>
                
                <p className="text-[10px] text-muted-foreground">
                  {FILL_SPEED_PRESETS[settings.fillSpeed].description}
                </p>

                {(settings.fillSpeed === 'custom' || settings.fillSpeed !== 'instant') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Time Budget (ms/frame)</Label>
                      <Badge variant="outline" className="text-xs font-mono">
                        {settings.timeBudgetMs}ms
                      </Badge>
                    </div>
                    <Slider
                      value={[settings.timeBudgetMs]}
                      onValueChange={([val]) => updateSetting('timeBudgetMs', val)}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Expansion Rate</Label>
                    <Badge variant="outline" className="text-xs font-mono">
                      {settings.expansionRate}x
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.expansionRate]}
                    onValueChange={([val]) => updateSetting('expansionRate', val)}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Precise (1x)</span>
                    <span>Fast (10x)</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Segmentation Engine */}
            <AccordionItem value="engine" className="border rounded-lg border-border">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="w-4 h-4 text-primary" />
                  <span>Engine</span>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {ENGINE_INFO[settings.engine].label}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Segmentation Algorithm</Label>
                  <Select
                    value={settings.engine}
                    onValueChange={(v: SegmentationEngine) => updateSetting('engine', v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ENGINE_INFO).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center justify-between w-full">
                            <span>{info.label}</span>
                            <Badge variant="outline" className="ml-2 text-[9px]">
                              {info.performance}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    {ENGINE_INFO[settings.engine].description}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs">Fill Method</Label>
                  <div className="grid grid-cols-2 gap-1">
                    {(Object.keys(FILL_METHOD_INFO) as FillMethod[]).map((method) => {
                      const info = FILL_METHOD_INFO[method];
                      const isActive = settings.fillMethod === method;
                      return (
                        <Button
                          key={method}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateSetting('fillMethod', method)}
                          className={`h-8 text-[10px] ${isActive ? '' : 'border-border'}`}
                          title={info.description}
                        >
                          {info.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Color Space</Label>
                  <Select
                    value={settings.colorSpace}
                    onValueChange={(v: ColorSpace) => updateSetting('colorSpace', v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COLOR_SPACE_INFO).map(([key, info]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {info.label} - {info.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Hover Preview */}
            <AccordionItem value="hover" className="border rounded-lg border-border">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-2 text-sm">
                  <MousePointer2 className="w-4 h-4 text-primary" />
                  <span>Hover Preview</span>
                  <Badge
                    variant={settings.hoverEnabled ? 'default' : 'secondary'}
                    className="ml-auto text-[10px]"
                  >
                    {settings.hoverEnabled ? 'On' : 'Off'}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Enable Preview</Label>
                  <Switch
                    checked={settings.hoverEnabled}
                    onCheckedChange={(v) => updateSetting('hoverEnabled', v)}
                  />
                </div>

                {settings.hoverEnabled && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Refresh Rate</Label>
                        <Badge variant="outline" className="text-xs font-mono">
                          {settings.hoverRefreshRate}ms
                        </Badge>
                      </div>
                      <Slider
                        value={[settings.hoverRefreshRate]}
                        onValueChange={([val]) => updateSetting('hoverRefreshRate', val)}
                        min={16}
                        max={500}
                        step={16}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Smooth (16ms)</span>
                        <span>Battery Saver (500ms)</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Preview Opacity</Label>
                        <Badge variant="outline" className="text-xs font-mono">
                          {Math.round(settings.previewOpacity * 100)}%
                        </Badge>
                      </div>
                      <Slider
                        value={[settings.previewOpacity * 100]}
                        onValueChange={([val]) => updateSetting('previewOpacity', val / 100)}
                        min={10}
                        max={100}
                        step={5}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Ring Visualization</Label>
                      <Switch
                        checked={settings.ringVisualization}
                        onCheckedChange={(v) => updateSetting('ringVisualization', v)}
                      />
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Edge Handling */}
            <AccordionItem value="edges" className="border rounded-lg border-border">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-2 text-sm">
                  <Waves className="w-4 h-4 text-primary" />
                  <span>Edge Handling</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Edge Detection</Label>
                  <Select
                    value={settings.edgeDetection}
                    onValueChange={(v: EdgeDetection) => updateSetting('edgeDetection', v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EDGE_DETECTION_INFO).map(([key, info]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {info.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Edge Softness</Label>
                    <Badge variant="outline" className="text-xs font-mono">
                      {settings.edgeSoftness}%
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.edgeSoftness]}
                    onValueChange={([val]) => updateSetting('edgeSoftness', val)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Feather Radius</Label>
                    <Badge variant="outline" className="text-xs font-mono">
                      {settings.featherRadius}px
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.featherRadius]}
                    onValueChange={([val]) => updateSetting('featherRadius', val)}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Anti-Alias Strength</Label>
                    <Badge variant="outline" className="text-xs font-mono">
                      {settings.antiAliasStrength}%
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.antiAliasStrength]}
                    onValueChange={([val]) => updateSetting('antiAliasStrength', val)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Advanced Options */}
            <AccordionItem value="advanced" className="border rounded-lg border-border">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-2 text-sm">
                  <Grid3X3 className="w-4 h-4 text-primary" />
                  <span>Advanced</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Contiguous Only</Label>
                  <Switch
                    checked={settings.contiguousOnly}
                    onCheckedChange={(v) => updateSetting('contiguousOnly', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Sample All Layers</Label>
                  <Switch
                    checked={settings.sampleAllLayers}
                    onCheckedChange={(v) => updateSetting('sampleAllLayers', v)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Grow/Shrink Selection</Label>
                    <Badge variant="outline" className="text-xs font-mono">
                      {settings.growSelection > 0 ? '+' : ''}{settings.growSelection}px
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.growSelection]}
                    onValueChange={([val]) => updateSetting('growSelection', val)}
                    min={-50}
                    max={50}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Smooth Selection</Label>
                    <Badge variant="outline" className="text-xs font-mono">
                      {settings.smoothSelection}%
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.smoothSelection]}
                    onValueChange={([val]) => updateSetting('smoothSelection', val)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Performance */}
            <AccordionItem value="performance" className="border rounded-lg border-border">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-2 text-sm">
                  <Gauge className="w-4 h-4 text-primary" />
                  <span>Performance</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Max Pixels</Label>
                    <Badge variant="outline" className="text-xs font-mono">
                      {(settings.maxPixels / 1000000).toFixed(1)}M
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.maxPixels / 100000]}
                    onValueChange={([val]) => updateSetting('maxPixels', val * 100000)}
                    min={1}
                    max={50}
                    step={1}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Use Web Worker</Label>
                  <Switch
                    checked={settings.useWorker}
                    onCheckedChange={(v) => updateSetting('useWorker', v)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Chunk Size</Label>
                    <Badge variant="outline" className="text-xs font-mono">
                      {settings.chunkSize.toLocaleString()}
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.chunkSize / 1000]}
                    onValueChange={([val]) => updateSetting('chunkSize', val * 1000)}
                    min={1}
                    max={50}
                    step={1}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Debug/Development */}
            <AccordionItem value="debug" className="border rounded-lg border-border border-dashed">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-2 text-sm">
                  <Bug className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-500">Debug Mode</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Debug Mode</Label>
                  <Switch
                    checked={settings.debugMode}
                    onCheckedChange={(v) => updateSetting('debugMode', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Boundary</Label>
                  <Switch
                    checked={settings.showBoundary}
                    onCheckedChange={(v) => updateSetting('showBoundary', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Seed Point</Label>
                  <Switch
                    checked={settings.showSeedPoint}
                    onCheckedChange={(v) => updateSetting('showSeedPoint', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Log Performance</Label>
                  <Switch
                    checked={settings.logPerformance}
                    onCheckedChange={(v) => updateSetting('logPerformance', v)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Controls Reference */}
          <div className="mt-4 p-3 bg-accent/30 rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Quick Controls</Label>
            <div className="grid gap-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scroll</span>
                <span>Adjust tolerance</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Right-click + Scroll</span>
                <span>Zoom</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Right-click + Drag</span>
                <span>Pan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Left-click</span>
                <span>Confirm selection</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}
