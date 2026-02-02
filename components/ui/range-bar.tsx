"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RangeBarProps {
  low: number;
  high: number;
  current: number;
  className?: string;
  showLabels?: boolean;
}

export function RangeBar({
  low,
  high,
  current,
  className,
  showLabels = true,
}: RangeBarProps) {
  const range = high - low;
  const position = range > 0 ? ((current - low) / range) * 100 : 50;

  // Clamp position between 0 and 100
  const clampedPosition = Math.max(0, Math.min(100, position));

  // Color based on position (near low = red, middle = yellow, near high = green)
  const getColor = () => {
    if (clampedPosition >= 70) return "#00dc82";
    if (clampedPosition >= 30) return "#f59e0b";
    return "#f87171";
  };

  const color = getColor();

  return (
    <div className={cn("w-full", className)}>
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span className="tabular-nums">${low.toFixed(0)}</span>
          <span className="text-white/40">52W Range</span>
          <span className="tabular-nums">${high.toFixed(0)}</span>
        </div>
      )}
      <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(90deg, #f87171 0%, #f59e0b 50%, #00dc82 100%)",
            opacity: 0.3,
          }}
        />

        {/* Current position indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-500"
          style={{
            left: `calc(${clampedPosition}% - 6px)`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />

        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${clampedPosition}%`,
            background: `linear-gradient(90deg, #f87171 0%, ${color} 100%)`,
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
}
