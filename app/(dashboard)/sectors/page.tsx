import { Suspense } from "react";
import { SectorCard } from "@/components/sector/sector-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SECTORS, Sector, SectorSummary, StockWithScore } from "@/types";

async function getStocksData() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stocks`,
    { next: { revalidate: 900 } }
  );
  if (!res.ok) throw new Error("Failed to fetch stocks");
  return res.json();
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
        <div key={i} className="rounded-lg border p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
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
