import { Suspense } from "react";
import { notFound } from "next/navigation";
import { StockTable } from "@/components/stock/stock-table";
import { StockTableSkeleton } from "@/components/stock/stock-table-skeleton";
import { SECTORS, Sector } from "@/types";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { UNIQUE_SYMBOLS } from "@/data/symbols";

function slugToSector(slug: string): Sector | null {
  const sectorMap: Record<string, Sector> = {
    "technology": "Technology",
    "healthcare": "Healthcare",
    "financials": "Financials",
    "consumer-discretionary": "Consumer Discretionary",
    "consumer-staples": "Consumer Staples",
    "energy": "Energy",
    "industrials": "Industrials",
    "materials": "Materials",
    "real-estate": "Real Estate",
    "utilities": "Utilities",
    "communication-services": "Communication Services",
  };
  return sectorMap[slug] || null;
}

async function getStocksData() {
  // Fetch all symbols to get accurate sector data
  const stocks = await getMultipleQuotes(UNIQUE_SYMBOLS);
  const scoredStocks = stocks.map(calculateValueScore);
  return { stocks: scoredStocks };
}

async function SectorStocksTable({ sector }: { sector: Sector }) {
  const { stocks } = await getStocksData();

  const sectorStocks = stocks
    .filter((s: any) => s.sector === sector)
    .sort((a: any, b: any) => b.valueScore - a.valueScore);

  return <StockTable stocks={sectorStocks} />;
}

export default async function SectorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = slugToSector(slug);

  if (!sector) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{sector}</h1>
        <p className="text-muted-foreground">
          All stocks in the {sector} sector, sorted by value score.
        </p>
      </div>

      <Suspense fallback={<StockTableSkeleton rows={20} />}>
        <SectorStocksTable sector={sector} />
      </Suspense>
    </div>
  );
}
