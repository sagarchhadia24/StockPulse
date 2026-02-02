"use client";

import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, BarChart3 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Sparkline } from "@/components/ui/sparkline";
import { MarketIndex } from "@/types";

interface HeroSectionProps {
  indices: MarketIndex[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function generateMockSparkline(seed: number, positive: boolean): number[] {
  // Deterministic pseudo-random number generator with integer seed
  const intSeed = Math.floor(seed);
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const base = 100;
  const points = [];
  let current = base;

  for (let i = 0; i < 20; i++) {
    const random = seededRandom(intSeed + i * 100);
    const change = (random - (positive ? 0.4 : 0.6)) * 3;
    current += change;
    // Round to 2 decimal places to avoid floating-point hydration mismatches
    points.push(Math.round(current * 100) / 100);
  }

  return points;
}

export function HeroSection({ indices }: HeroSectionProps) {
  const greeting = getGreeting();

  // Calculate market summary
  const marketUp = indices.filter((i) => i.change >= 0).length;
  const marketSentiment = marketUp >= 2 ? "bullish" : marketUp === 0 ? "bearish" : "mixed";

  // Get the S&P 500 as the main indicator
  const sp500 = indices.find((i) => i.symbol === "^GSPC") || indices[0];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {greeting}
          </h1>
          <p className="text-lg text-white/50 mt-2">
            Markets are{" "}
            <span
              className={
                marketSentiment === "bullish"
                  ? "text-[#00FF88]"
                  : marketSentiment === "bearish"
                  ? "text-[#FF6B6B]"
                  : "text-[#FFB800]"
              }
            >
              {marketSentiment}
            </span>{" "}
            today
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-6">
          <QuickStat
            icon={Activity}
            label="S&P 500"
            value={sp500?.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "—"}
            change={sp500?.changePercent || 0}
          />
          <QuickStat
            icon={TrendingUp}
            label="Market Cap"
            value="$48.2T"
            change={1.2}
          />
          <QuickStat
            icon={BarChart3}
            label="Volume"
            value="12.4B"
            change={-2.1}
          />
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {indices.map((index) => (
          <GlassCard
            key={index.symbol}
            variant={index.change >= 0 ? "positive" : "negative"}
            className="p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-white/50 font-medium">{index.name}</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">
                  {index.value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <div
                  className={`flex items-center gap-1.5 mt-2 text-sm font-medium ${
                    index.change >= 0 ? "text-[#00FF88]" : "text-[#FF6B6B]"
                  }`}
                >
                  {index.change >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span className="tabular-nums">
                    {index.change >= 0 ? "+" : ""}
                    {index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <Sparkline
                  data={generateMockSparkline(index.value, index.change >= 0)}
                  width={80}
                  height={40}
                  positive={index.change >= 0}
                />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

interface QuickStatProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change: number;
}

function QuickStat({ icon: Icon, label, value, change }: QuickStatProps) {
  const isPositive = change >= 0;

  return (
    <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
      <Icon className="h-5 w-5 text-white/40" />
      <div>
        <p className="text-xs text-white/40">{label}</p>
        <div className="flex items-center gap-2">
          <span className="font-semibold tabular-nums">{value}</span>
          <span
            className={`text-xs font-medium ${
              isPositive ? "text-[#00FF88]" : "text-[#FF6B6B]"
            }`}
          >
            {isPositive ? "+" : ""}
            {change.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
