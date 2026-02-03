import { ComparisonStock } from "@/types";
import { Badge } from "@/components/ui/badge";
import { RangeBar } from "@/components/ui/range-bar";
import { cn } from "@/lib/utils";
import { findBestValue, getBestMetric } from "@/lib/compare";
import { classifyStock, getScoreColor } from "@/lib/valuation";
import { X, Crown } from "lucide-react";

// Sector averages for comparison display
const SECTOR_AVERAGES: Record<string, { pe: number; pb: number }> = {
  Technology: { pe: 28, pb: 7 },
  Healthcare: { pe: 22, pb: 4 },
  Financials: { pe: 14, pb: 1.3 },
  "Consumer Discretionary": { pe: 24, pb: 5 },
  "Consumer Staples": { pe: 22, pb: 5 },
  Energy: { pe: 12, pb: 1.8 },
  Industrials: { pe: 20, pb: 4 },
  Materials: { pe: 15, pb: 2.5 },
  "Real Estate": { pe: 35, pb: 2 },
  Utilities: { pe: 18, pb: 1.8 },
  "Communication Services": { pe: 18, pb: 3 },
};

interface ComparisonTableProps {
  stocks: ComparisonStock[];
  onRemoveStock: (symbol: string) => void;
}

export function ComparisonTable({ stocks, onRemoveStock }: ComparisonTableProps) {
  if (stocks.length === 0) {
    return null;
  }

  // Calculate best values for highlighting
  const valueScores = stocks.map((s) => s.valueScore);
  const peRatios = stocks.map((s) => s.peRatio);
  const pbRatios = stocks.map((s) => s.pbRatio);
  const pegRatios = stocks.map((s) => s.pegRatio);
  const dividends = stocks.map((s) => s.dividendYield);
  const ytdChanges = stocks.map((s) => s.ytdChange);

  const bestValueIndex = findBestValue(valueScores);
  const bestPEIndex = getBestMetric(peRatios, "lowest");
  const bestPBIndex = getBestMetric(pbRatios, "lowest");
  const bestPEGIndex = getBestMetric(pegRatios, "lowest");
  const bestDividendIndex = getBestMetric(dividends, "highest");
  const bestYTDIndex = getBestMetric(ytdChanges, "highest");

  const formatRatio = (value: number | null, sectorAvg?: number): string => {
    if (value === null) return "—";
    if (sectorAvg) {
      const ratio = (value / sectorAvg).toFixed(2);
      return `${value.toFixed(1)} · ${ratio}x`;
    }
    return value.toFixed(1);
  };

  const formatPercent = (value: number | null): string => {
    if (value === null) return "—";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-4 min-w-full pb-4">
        {stocks.map((stock, index) => {
          const isBestValue = index === bestValueIndex;
          const classification = classifyStock(stock.valueScore);
          const scoreColor = getScoreColor(stock.valueScore);
          const sectorAvg = SECTOR_AVERAGES[stock.sector];

          return (
            <div
              key={stock.symbol}
              className={cn(
                "flex-1 min-w-[240px] max-w-[300px] rounded-xl border bg-white/5 overflow-hidden",
                isBestValue
                  ? "border-[#00dc82]/50 ring-1 ring-[#00dc82]/20"
                  : "border-white/10"
              )}
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">
                        {stock.symbol}
                      </span>
                      {isBestValue && (
                        <Crown className="h-4 w-4 text-[#00dc82]" />
                      )}
                    </div>
                    <p className="text-sm text-white/60 truncate max-w-[180px]">
                      {stock.name}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveStock(stock.symbol)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="h-4 w-4 text-white/40" />
                  </button>
                </div>
              </div>

              {/* Metrics */}
              <div className="p-4 space-y-4">
                {/* Price */}
                <div>
                  <p className="text-xs text-white/40 mb-1">Price</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-white">
                      ${stock.price.toFixed(2)}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        stock.changePercent >= 0 ? "text-green-400" : "text-red-400"
                      )}
                    >
                      {formatPercent(stock.changePercent)}
                    </span>
                  </div>
                </div>

                {/* Value Score */}
                <div>
                  <p className="text-xs text-white/40 mb-1">Value Score</p>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-2xl font-bold", scoreColor)}>
                      {stock.valueScore}
                    </span>
                    <Badge
                      variant={
                        classification === "undervalued"
                          ? "default"
                          : classification === "overvalued"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {classification}
                    </Badge>
                  </div>
                </div>

                {/* P/E Ratio */}
                <div>
                  <p className="text-xs text-white/40 mb-1">P/E Ratio</p>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      index === bestPEIndex ? "text-[#00dc82]" : "text-white"
                    )}
                  >
                    {formatRatio(stock.peRatio, sectorAvg?.pe)}
                  </span>
                </div>

                {/* P/B Ratio */}
                <div>
                  <p className="text-xs text-white/40 mb-1">P/B Ratio</p>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      index === bestPBIndex ? "text-[#00dc82]" : "text-white"
                    )}
                  >
                    {formatRatio(stock.pbRatio, sectorAvg?.pb)}
                  </span>
                </div>

                {/* PEG Ratio */}
                <div>
                  <p className="text-xs text-white/40 mb-1">PEG Ratio</p>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      index === bestPEGIndex ? "text-[#00dc82]" : "text-white"
                    )}
                  >
                    {formatRatio(stock.pegRatio)}
                  </span>
                </div>

                {/* 52-Week Range */}
                <div>
                  <p className="text-xs text-white/40 mb-2">52-Week Range</p>
                  <RangeBar
                    low={stock.week52Low}
                    high={stock.week52High}
                    current={stock.price}
                  />
                </div>

                {/* YTD Change */}
                <div>
                  <p className="text-xs text-white/40 mb-1">YTD Change</p>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      index === bestYTDIndex
                        ? "text-[#00dc82]"
                        : stock.ytdChange !== null && stock.ytdChange >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    )}
                  >
                    {formatPercent(stock.ytdChange)}
                  </span>
                </div>

                {/* Dividend Yield */}
                <div>
                  <p className="text-xs text-white/40 mb-1">Dividend Yield</p>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      index === bestDividendIndex ? "text-[#00dc82]" : "text-white"
                    )}
                  >
                    {stock.dividendYield !== null
                      ? `${stock.dividendYield.toFixed(2)}%`
                      : "—"}
                  </span>
                </div>

                {/* Sector */}
                <div>
                  <p className="text-xs text-white/40 mb-1">Sector</p>
                  <Badge variant="outline" className="text-xs">
                    {stock.sector}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
