import { Suspense } from "react";
import { MarketOverview } from "@/components/dashboard/market-overview";
import { TopStocksSection } from "@/components/dashboard/top-stocks-section";
import { StockCardSkeleton } from "@/components/stock/stock-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { getMarketIndices, getMultipleQuotes } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { UNIQUE_SYMBOLS } from "@/data/symbols";

async function getMarketData() {
  const indices = await getMarketIndices();
  return { indices };
}

async function getStocksData() {
  // Fetch more stocks to include multiple sectors (financials, energy tend to be undervalued)
  const topSymbols = UNIQUE_SYMBOLS.slice(0, 50);
  const stocks = await getMultipleQuotes(topSymbols);
  const scoredStocks = stocks.map(calculateValueScore);
  return { stocks: scoredStocks };
}

function MarketOverviewSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function TopStocksSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <StockCardSkeleton key={i} />
      ))}
    </div>
  );
}

async function MarketSection() {
  const { indices } = await getMarketData();
  return <MarketOverview indices={indices} />;
}

async function StocksSection() {
  const { stocks } = await getStocksData();

  const undervalued = stocks
    .filter((s: any) => s.valueScore >= 70)
    .sort((a: any, b: any) => b.valueScore - a.valueScore)
    .slice(0, 5);

  const overvalued = stocks
    .filter((s: any) => s.valueScore < 40)
    .sort((a: any, b: any) => a.valueScore - b.valueScore)
    .slice(0, 5);

  return (
    <>
      <TopStocksSection
        title="Top Undervalued Stocks"
        description="Highest value scores - potential buying opportunities"
        stocks={undervalued}
        href="/undervalued"
      />
      <TopStocksSection
        title="Most Overvalued Stocks"
        description="Lowest value scores - consider avoiding"
        stocks={overvalued}
        href="/overvalued"
      />
    </>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Market Overview</h1>
        <p className="text-muted-foreground">
          Track major indices and discover investment opportunities
        </p>
      </div>

      <Suspense fallback={<MarketOverviewSkeleton />}>
        <MarketSection />
      </Suspense>

      <Suspense fallback={<TopStocksSkeleton />}>
        <StocksSection />
      </Suspense>
    </div>
  );
}
