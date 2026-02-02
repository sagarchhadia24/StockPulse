"use client";

import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export function LiveIndicator({ className, showLabel = true }: LiveIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      {showLabel && (
        <span className="text-xs text-muted-foreground">Live</span>
      )}
    </div>
  );
}
