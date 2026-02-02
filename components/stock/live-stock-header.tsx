"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { WatchlistButton } from "@/components/stock/watchlist-button";
import { useLiveSingleStock } from "@/hooks/use-live-prices";
import { classifyStock, getScoreColor } from "@/lib/valuation";
import { cn } from "@/lib/utils";
import { StockWithScore } from "@/types";

interface LiveStockHeaderProps {
  symbol: string;
  initialData: StockWithScore;
}

export function LiveStockHeader({ symbol, initialData }: LiveStockHeaderProps) {
  const { data, isLive, lastUpdated } = useLiveSingleStock(symbol);
  const stock = data ?? initialData;
  const [priceChanged, setPriceChanged] = useState(false);
  const [prevPrice, setPrevPrice] = useState(stock.price);

  // Detect price changes for visual feedback
  useEffect(() => {
    if (data && data.price !== prevPrice) {
      setPriceChanged(true);
      setPrevPrice(data.price);
      const timer = setTimeout(() => setPriceChanged(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [data, prevPrice]);

  const classification = classifyStock(stock.valueScore);
  const scoreColor = getScoreColor(stock.valueScore);

  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{stock.symbol}</h1>
          <Badge variant="outline">{stock.sector}</Badge>
          {isLive && <LiveIndicator />}
        </div>
        <p className="text-lg text-muted-foreground">{stock.name}</p>
        <div className="flex items-center gap-4 mt-2">
          <span
            className={cn(
              "text-4xl font-bold transition-colors duration-300",
              priceChanged && "text-yellow-500"
            )}
          >
            ${stock.price.toFixed(2)}
          </span>
          <span
            className={cn(
              "text-lg",
              stock.change >= 0 ? "text-green-500" : "text-red-500"
            )}
          >
            {stock.change >= 0 ? "+" : ""}
            {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
          </span>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-1">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Card className="w-32">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Value Score</p>
            <p className={cn("text-3xl font-bold", scoreColor)}>
              {stock.valueScore}
            </p>
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
          </CardContent>
        </Card>
        <WatchlistButton symbol={stock.symbol} variant="full" />
      </div>
    </div>
  );
}
