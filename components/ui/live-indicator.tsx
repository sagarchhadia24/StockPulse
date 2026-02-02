"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  className?: string;
  showLabel?: boolean;
  lastUpdate?: Date | null;
  size?: "sm" | "md";
}

export function LiveIndicator({
  className,
  showLabel = true,
  lastUpdate,
  size = "sm",
}: LiveIndicatorProps) {
  const [timeAgo, setTimeAgo] = React.useState<string>("");

  React.useEffect(() => {
    if (!lastUpdate) return;

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      if (seconds < 5) {
        setTimeAgo("just now");
      } else if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const dotSizes = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1.5">
        <span className={cn("relative flex", dotSizes[size])}>
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75",
              "bg-[#00FF88] animate-ping"
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-full w-full",
              "bg-[#00FF88] animate-pulse-glow"
            )}
          />
        </span>
        {showLabel && (
          <span className="text-xs font-medium text-[#00FF88] uppercase tracking-wider">
            Live
          </span>
        )}
      </div>
      {lastUpdate && timeAgo && (
        <span className="text-xs text-muted-foreground">
          {timeAgo}
        </span>
      )}
    </div>
  );
}
