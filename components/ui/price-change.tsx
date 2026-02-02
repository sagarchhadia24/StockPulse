"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceChangeProps {
  value: number;
  percentage: number;
  showValue?: boolean;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceChange({
  value,
  percentage,
  showValue = true,
  showPercentage = true,
  size = "md",
  className,
}: PriceChangeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-3 py-1 gap-1.5",
    lg: "text-base px-4 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium tabular-nums transition-colors",
        sizeClasses[size],
        isPositive && "bg-[#00FF88]/15 text-[#00FF88]",
        isNegative && "bg-[#FF6B6B]/15 text-[#FF6B6B]",
        isNeutral && "bg-white/10 text-white/60",
        className
      )}
    >
      {isPositive && <TrendingUp size={iconSizes[size]} />}
      {isNegative && <TrendingDown size={iconSizes[size]} />}
      {isNeutral && <Minus size={iconSizes[size]} />}

      <span className="flex items-center gap-1">
        {showValue && (
          <span>
            {isPositive ? "+" : ""}
            {value.toFixed(2)}
          </span>
        )}
        {showValue && showPercentage && <span className="opacity-60">·</span>}
        {showPercentage && (
          <span>
            {isPositive ? "+" : ""}
            {percentage.toFixed(2)}%
          </span>
        )}
      </span>
    </div>
  );
}
