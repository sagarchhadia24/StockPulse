import { Suspense } from "react";
import { HeroSection } from "@/components/dashboard/hero-section";
import { TopStocksSection } from "@/components/dashboard/top-stocks-section";
import { StockCardSkeleton } from "@/components/stock/stock-card-skeleton";
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

function HeroSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="h-12 w-64 rounded-lg skeleton-shimmer" />
          <div className="h-6 w-48 rounded-lg skeleton-shimmer mt-2" />
        </div>
      </div>

      {/* Market cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl glass p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-4 w-20 rounded skeleton-shimmer" />
                <div className="h-8 w-32 rounded-lg skeleton-shimmer mt-2" />
                <div className="h-5 w-28 rounded skeleton-shimmer mt-2" />
              </div>
              <div className="h-10 w-20 rounded skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopStocksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl skeleton-shimmer" />
        <div>
          <div className="h-7 w-48 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-64 rounded skeleton-shimmer mt-1" />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <StockCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

async function HeroWithData() {
  const { indices } = await getMarketData();
  return <HeroSection indices={indices} />;
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
    <div className="space-y-12">
      <TopStocksSection
        title="Top Undervalued Stocks"
        description="Highest value scores - potential buying opportunities"
        stocks={undervalued}
        href="/undervalued"
        variant="undervalued"
      />
      <TopStocksSection
        title="Most Overvalued Stocks"
        description="Lowest value scores - consider avoiding"
        stocks={overvalued}
        href="/overvalued"
        variant="overvalued"
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-12 pb-8">
      <Suspense fallback={<HeroSkeleton />}>
        <HeroWithData />
      </Suspense>

      <Suspense fallback={<TopStocksSkeleton />}>
        <StocksSection />
      </Suspense>
    </div>
  );
}
