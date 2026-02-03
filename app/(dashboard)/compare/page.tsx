import { Suspense } from "react";
import { Metadata } from "next";
import { ComparePageClient } from "./compare-page-client";
import { getMultipleQuotes, getHistoricalPrices, SYMBOL_SECTORS } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { calculateYTDChange } from "@/lib/compare";
import { ComparisonStock, StockWithScore } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Compare Stocks | StockPulse",
  description: "Compare up to 4 stocks side-by-side on valuation and performance metrics",
};

async function getComparisonData(symbols: string[]): Promise<{
  stocks: ComparisonStock[];
  similarStocks: StockWithScore[];
}> {
  if (symbols.length === 0) {
    return { stocks: [], similarStocks: [] };
  }

  // Fetch stock data
  const rawStocks = await getMultipleQuotes(symbols);

  // Calculate value scores and YTD changes
  const stocks: ComparisonStock[] = await Promise.all(
    rawStocks.map(async (stock) => {
      const scored = calculateValueScore(stock);
      const history = await getHistoricalPrices(stock.symbol, "1y");
      const ytdChange = calculateYTDChange(history, stock.price);
      return { ...scored, ytdChange };
    })
  );

  // Get similar stocks (same sector as first stock)
  let similarStocks: StockWithScore[] = [];
  if (stocks.length > 0) {
    const firstSector = stocks[0].sector;
    const sectorSymbols = Object.entries(SYMBOL_SECTORS)
      .filter(([sym, sector]) => sector === firstSector && !symbols.includes(sym))
      .map(([sym]) => sym)
      .slice(0, 4);

    if (sectorSymbols.length > 0) {
      const sectorStocks = await getMultipleQuotes(sectorSymbols);
      similarStocks = sectorStocks.map((s) => calculateValueScore(s));
    }
  }

  return { stocks, similarStocks };
}

function CompareSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-12 w-full max-w-md" />
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[500px] w-[280px]" />
        ))}
      </div>
    </div>
  );
}

async function CompareContent({
  symbols,
}: {
  symbols: string[];
}) {
  const { stocks, similarStocks } = await getComparisonData(symbols);

  return (
    <ComparePageClient
      initialStocks={stocks}
      initialSimilarStocks={similarStocks}
      initialSymbols={symbols}
    />
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ symbols?: string }>;
}) {
  const params = await searchParams;
  const symbolsParam = params.symbols || "";
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Compare Stocks</h1>
        <p className="text-white/60 mt-1">
          Compare up to 4 stocks side-by-side on valuation metrics
        </p>
      </div>

      <Suspense fallback={<CompareSkeleton />}>
        <CompareContent symbols={symbols} />
      </Suspense>
    </div>
  );
}
