"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { MoverStock } from "@/lib/movers";
import { cn } from "@/lib/utils";

interface MoversTableProps {
  stocks: MoverStock[];
  type: "gainers" | "losers";
}

export function MoversTable({ stocks, type }: MoversTableProps) {
  const isGainers = type === "gainers";
  const Icon = isGainers ? TrendingUp : TrendingDown;
  const title = isGainers ? "Top Gainers" : "Top Losers";
  const accentColor = isGainers ? "text-green-500" : "text-red-500";
  const bgColor = isGainers ? "bg-green-500/10" : "bg-red-500/10";

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className={cn("flex items-center gap-2 px-4 py-3 border-b border-border", bgColor)}>
        <Icon className={cn("h-5 w-5", accentColor)} />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      {/* Table */}
      <div className="divide-y divide-border">
        {stocks.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            No {type} today
          </div>
        ) : (
          stocks.map((stock, index) => (
            <Link
              key={stock.symbol}
              href={`/stock/${stock.symbol}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-6">
                  {index + 1}
                </span>
                <div>
                  <div className="font-medium">{stock.symbol}</div>
                  <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {stock.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">${stock.price.toFixed(2)}</div>
                <div className={cn("text-sm font-medium", accentColor)}>
                  {stock.changePercent >= 0 ? "+" : ""}
                  {stock.changePercent.toFixed(2)}%
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
