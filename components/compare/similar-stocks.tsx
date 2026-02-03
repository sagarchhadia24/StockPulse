import { StockWithScore } from "@/types";
import { Badge } from "@/components/ui/badge";
import { classifyStock, getScoreColor } from "@/lib/valuation";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface SimilarStocksProps {
  stocks: StockWithScore[];
  onAddStock: (symbol: string) => void;
  disabled?: boolean;
}

export function SimilarStocks({ stocks, onAddStock, disabled }: SimilarStocksProps) {
  if (stocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white/60">Similar Stocks</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stocks.map((stock) => {
          const classification = classifyStock(stock.valueScore);
          const scoreColor = getScoreColor(stock.valueScore);

          return (
            <button
              key={stock.symbol}
              onClick={() => onAddStock(stock.symbol)}
              disabled={disabled}
              className={cn(
                "p-3 rounded-lg border border-white/10 bg-white/5 text-left transition-all",
                "hover:border-[#00dc82]/30 hover:bg-white/8",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-semibold text-white">{stock.symbol}</span>
                  <p className="text-xs text-white/50 truncate max-w-[100px]">
                    {stock.name}
                  </p>
                </div>
                <Plus className="h-4 w-4 text-white/40" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={cn("text-lg font-bold", scoreColor)}>
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
                  className="text-xs"
                >
                  {classification}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
