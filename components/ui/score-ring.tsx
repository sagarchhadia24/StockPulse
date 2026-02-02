"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

export function ScoreRing({
  score,
  size = 56,
  strokeWidth = 4,
  className,
  showLabel = true,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 70) return "#00FF88";
    if (score >= 40) return "#FFB800";
    return "#FF6B6B";
  };

  const getGlowColor = (score: number) => {
    if (score >= 70) return "rgba(0, 255, 136, 0.3)";
    if (score >= 40) return "rgba(255, 184, 0, 0.3)";
    return "rgba(255, 107, 107, 0.3)";
  };

  const color = getColor(score);
  const glowColor = getGlowColor(score);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-draw-ring"
          style={{
            "--ring-offset": offset,
            transition: "stroke-dashoffset 1s ease-out",
          } as React.CSSProperties}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute text-sm font-bold tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
      )}
    </div>
  );
}
