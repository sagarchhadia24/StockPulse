"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
  positive?: boolean;
}

export function Sparkline({
  data,
  width = 80,
  height = 32,
  strokeWidth = 2,
  className,
  positive,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return null;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Normalize data to fit within the SVG viewBox
  const padding = strokeWidth;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Round to 2 decimal places to avoid hydration mismatches from floating-point precision
  const round = (n: number) => Math.round(n * 100) / 100;

  const points = data.map((value, index) => {
    const x = round(padding + (index / (data.length - 1)) * chartWidth);
    const y = round(padding + chartHeight - ((value - min) / range) * chartHeight);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  // Determine color based on trend (first vs last value) or prop
  const isUp = positive ?? data[data.length - 1] >= data[0];
  const color = isUp ? "#00dc82" : "#f87171";
  const glowColor = isUp ? "rgba(0, 220, 130, 0.4)" : "rgba(248, 113, 113, 0.4)";

  // Create gradient fill
  const gradientId = React.useId();

  const endY = round(padding + chartHeight - ((data[data.length - 1] - min) / range) * chartHeight);

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <path
        d={`${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
        fill={`url(#${gradientId})`}
      />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
      />

      {/* End dot */}
      <circle
        cx={width - padding}
        cy={endY}
        r={3}
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
      />
    </svg>
  );
}
