"use client";

import { PortfolioSummary } from "@/types";
import { GlassCard } from "@/components/ui/glass-card";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioSummaryCardProps {
  summary: PortfolioSummary;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function PortfolioSummaryCard({ summary }: PortfolioSummaryCardProps) {
  const isPositive = summary.totalGain >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <GlassCard>
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Total Value</span>
        </div>
        <p className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</p>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Total Cost</span>
        </div>
        <p className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</p>
      </GlassCard>

      <GlassCard variant={isPositive ? "positive" : "negative"}>
        <div className="flex items-center gap-2 mb-1">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm text-muted-foreground">Total P&L</span>
        </div>
        <p className={cn("text-2xl font-bold", isPositive ? "text-green-500" : "text-red-500")}>
          {isPositive ? "+" : ""}{formatCurrency(summary.totalGain)}
        </p>
        <p className={cn("text-sm", isPositive ? "text-green-500" : "text-red-500")}>
          {isPositive ? "+" : ""}{summary.totalGainPercent.toFixed(2)}%
        </p>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Positions</span>
        </div>
        <p className="text-2xl font-bold">{summary.positionCount}</p>
      </GlassCard>
    </div>
  );
}
