import { Suspense } from "react";
import { SectorCard } from "@/components/sector/sector-card";
import { SECTORS, SectorSummary, StockWithScore } from "@/types";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { UNIQUE_SYMBOLS } from "@/data/symbols";

async function getStocksData() {
  // Fetch all symbols to get accurate sector counts
  const stocks = await getMultipleQuotes(UNIQUE_SYMBOLS);
  const scoredStocks = stocks.map(calculateValueScore);
  return { stocks: scoredStocks };
}

function calculateSectorSummaries(stocks: StockWithScore[]): SectorSummary[] {
  return SECTORS.map((sector) => {
    const sectorStocks = stocks.filter((s) => s.sector === sector);
    const avgScore =
      sectorStocks.length > 0
        ? sectorStocks.reduce((sum, s) => sum + s.valueScore, 0) / sectorStocks.length
        : 0;
    const topStock = sectorStocks.sort((a, b) => b.valueScore - a.valueScore)[0];

    return {
      sector,
      stockCount: sectorStocks.length,
      avgScore,
      topStock: topStock?.symbol || "N/A",
      topStockScore: topStock?.valueScore || 0,
    };
  }).sort((a, b) => b.avgScore - a.avgScore);
}

function SectorsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 11 }).map((_, i) => (
        <div key={i} className="rounded-2xl glass p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-6 w-32 rounded-lg skeleton-shimmer" />
            <div className="h-11 w-11 rounded-full skeleton-shimmer" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-16 rounded skeleton-shimmer" />
              <div className="h-4 w-8 rounded skeleton-shimmer" />
            </div>
            <div className="pt-3 border-t border-white/10">
              <div className="h-3 w-20 rounded skeleton-shimmer mb-2" />
              <div className="flex justify-between">
                <div className="h-5 w-16 rounded skeleton-shimmer" />
                <div className="h-5 w-8 rounded skeleton-shimmer" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function SectorsGrid() {
  const { stocks } = await getStocksData();
  const sectorSummaries = calculateSectorSummaries(stocks);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sectorSummaries.map((sector) => (
        <SectorCard key={sector.sector} sector={sector} />
      ))}
    </div>
  );
}

export default function SectorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sectors</h1>
        <p className="text-muted-foreground">
          Browse stocks by GICS sector classification. Click a sector to view all stocks.
        </p>
      </div>

      <Suspense fallback={<SectorsSkeleton />}>
        <SectorsGrid />
      </Suspense>
    </div>
  );
}
