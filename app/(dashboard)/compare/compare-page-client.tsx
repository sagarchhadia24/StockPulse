"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { CompareSearch } from "@/components/compare/compare-search";
import { ComparisonTable } from "@/components/compare/comparison-table";
import { SimilarStocks } from "@/components/compare/similar-stocks";
import { ComparisonStock, StockWithScore } from "@/types";
import { GitCompare } from "lucide-react";

interface ComparePageClientProps {
  initialStocks: ComparisonStock[];
  initialSimilarStocks: StockWithScore[];
  initialSymbols: string[];
}

export function ComparePageClient({
  initialStocks,
  initialSimilarStocks,
  initialSymbols,
}: ComparePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateURL = useCallback(
    (symbols: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (symbols.length > 0) {
        params.set("symbols", symbols.join(","));
      } else {
        params.delete("symbols");
      }
      router.push(`/compare?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleAddSymbol = useCallback(
    (symbol: string) => {
      if (initialSymbols.length >= 4) return;
      if (initialSymbols.includes(symbol)) return;
      updateURL([...initialSymbols, symbol]);
    },
    [initialSymbols, updateURL]
  );

  const handleRemoveSymbol = useCallback(
    (symbol: string) => {
      updateURL(initialSymbols.filter((s) => s !== symbol));
    },
    [initialSymbols, updateURL]
  );

  const isAtLimit = initialSymbols.length >= 4;

  return (
    <div className="space-y-8">
      {/* Search */}
      <CompareSearch
        selectedSymbols={initialSymbols}
        onAddSymbol={handleAddSymbol}
        onRemoveSymbol={handleRemoveSymbol}
        maxSymbols={4}
      />

      {/* Empty State */}
      {initialStocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <GitCompare className="h-8 w-8 text-white/40" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No stocks selected
          </h2>
          <p className="text-white/60 max-w-md">
            Search for stocks above to add them to your comparison. You can compare
            up to 4 stocks side-by-side.
          </p>
        </div>
      )}

      {/* Comparison Table */}
      {initialStocks.length > 0 && (
        <ComparisonTable stocks={initialStocks} onRemoveStock={handleRemoveSymbol} />
      )}

      {/* Similar Stocks Suggestions */}
      {initialStocks.length > 0 && initialSimilarStocks.length > 0 && (
        <SimilarStocks
          stocks={initialSimilarStocks}
          onAddStock={handleAddSymbol}
          disabled={isAtLimit}
        />
      )}
    </div>
  );
}
