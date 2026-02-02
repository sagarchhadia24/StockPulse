"use client";

import { useState, useEffect, useMemo } from "react";
import { StockTable } from "@/components/stock/stock-table";
import { StockTableSkeleton } from "@/components/stock/stock-table-skeleton";
import { ScreenerFilters } from "@/components/screener/screener-filters";
import { StockWithScore } from "@/types";

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<StockWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minScore: 0,
    maxScore: 100,
    sector: "all",
    marketCap: "all",
  });

  useEffect(() => {
    const fetchStocks = async () => {
      const res = await fetch("/api/stocks");
      const data = await res.json();
      setStocks(data.stocks || []);
      setLoading(false);
    };
    fetchStocks();
  }, []);

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      // Score filter
      if (stock.valueScore < filters.minScore || stock.valueScore > filters.maxScore) {
        return false;
      }

      // Sector filter
      if (filters.sector !== "all" && stock.sector !== filters.sector) {
        return false;
      }

      // Market cap filter
      if (filters.marketCap !== "all") {
        const cap = stock.marketCap;
        if (filters.marketCap === "large" && cap < 10e9) return false;
        if (filters.marketCap === "mid" && (cap < 2e9 || cap >= 10e9)) return false;
        if (filters.marketCap === "small" && cap >= 2e9) return false;
      }

      return true;
    });
  }, [stocks, filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Stock Screener</h1>
        <p className="text-muted-foreground">
          Filter stocks by value score, sector, and market cap to find investment opportunities.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <ScreenerFilters filters={filters} onFiltersChange={setFilters} />

        <div>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredStocks.length} of {stocks.length} stocks
          </div>
          {loading ? (
            <StockTableSkeleton rows={20} />
          ) : (
            <StockTable stocks={filteredStocks} />
          )}
        </div>
      </div>
    </div>
  );
}
