import { ScrollArea } from '@/components/ui/scroll-area';
import type { HistoryEntry } from '@/lib/canvas/types';

interface HistoryPanelProps {
  history: HistoryEntry[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function HistoryPanel({ history, currentIndex, onNavigate }: HistoryPanelProps) {
  // Display in reverse order (most recent at top)
  const displayHistory = [...history].reverse();

  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground h-full flex items-center justify-center">
        No history yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {displayHistory.map((entry, displayIndex) => {
          const originalIndex = history.length - 1 - displayIndex;
          const isActive = currentIndex === originalIndex;
          const isFuture = originalIndex > currentIndex;

          return (
            <div
              key={entry.timestamp}
              onClick={() => onNavigate(originalIndex)}
              className={`px-3 py-2 rounded-md text-sm cursor-pointer transition-all animate-fade-in ${
                isActive
                  ? 'bg-primary/20 border border-primary/30 font-medium text-foreground'
                  : isFuture
                  ? 'text-muted-foreground/50 hover:bg-accent/50'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
              style={{ animationDelay: `${displayIndex * 20}ms` }}
            >
              <div className="flex items-center justify-between">
                <span>{entry.action}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
