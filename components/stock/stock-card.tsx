import Link from "next/link";
import { StockWithScore } from "@/types";
import { classifyStock } from "@/lib/valuation";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreRing } from "@/components/ui/score-ring";
import { PriceChange } from "@/components/ui/price-change";
import { RangeBar } from "@/components/ui/range-bar";

interface StockCardProps {
  stock: StockWithScore;
}

export function StockCard({ stock }: StockCardProps) {
  const classification = classifyStock(stock.valueScore);

  return (
    <Link href={`/stock/${stock.symbol}`}>
      <GlassCard
        variant={classification === "undervalued" ? "positive" : classification === "overvalued" ? "negative" : "default"}
        className="h-full"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold" style={{ color: 'inherit' }}>{stock.symbol}</h3>
            <p className="text-sm truncate" style={{ opacity: 0.7 }}>{stock.name}</p>
          </div>
          <ScoreRing score={stock.valueScore} size={48} strokeWidth={3} />
        </div>

        {/* Price */}
        <div className="space-y-3">
          <div>
            <p className="text-3xl font-bold tabular-nums">
              ${stock.price.toFixed(2)}
            </p>
            <div className="mt-2">
              <PriceChange
                value={stock.change}
                percentage={stock.changePercent}
                size="sm"
              />
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>P/E: <span className="text-slate-700 dark:text-slate-300">{stock.peRatio?.toFixed(1) || "N/A"}</span></span>
            <span>Vol: <span className="text-slate-700 dark:text-slate-300">{formatVolume(stock.volume)}</span></span>
          </div>

          {/* 52-Week Range */}
          <RangeBar
            low={stock.week52Low}
            high={stock.week52High}
            current={stock.price}
          />
        </div>
      </GlassCard>
    </Link>
  );
}

function formatVolume(volume: number | undefined): string {
  if (!volume) return "N/A";
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
  return volume.toString();
}
