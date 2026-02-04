import { Suspense } from "react";
import { StockTableSkeleton } from "@/components/stock/stock-table-skeleton";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { ALL_SYMBOLS } from "@/data/symbols";
import { OvervaluedContent } from "./overvalued-content";

async function getStocksData() {
  // Process in batches for reliability
  const BATCH_SIZE = 30;
  const allStocks: any[] = [];

  for (let i = 0; i < ALL_SYMBOLS.length; i += BATCH_SIZE) {
    const batch = ALL_SYMBOLS.slice(i, i + BATCH_SIZE);
    try {
      const stocks = await getMultipleQuotes(batch);
      const scoredStocks = stocks.map(calculateValueScore);
      allStocks.push(...scoredStocks);
    } catch (error) {
      console.warn(`Batch starting at ${i} failed, continuing...`);
    }
  }

  return { stocks: allStocks };
}

async function OvervaluedData() {
  const { stocks } = await getStocksData();

  const overvalued = stocks
    .filter((s: any) => s.valueScore < 40)
    .sort((a: any, b: any) => a.valueScore - b.valueScore);

  return <OvervaluedContent stocks={overvalued} />;
}

export default function OvervaluedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Overvalued Stocks</h1>
        <p className="text-muted-foreground">
          Stocks with value scores below 40 - consider avoiding or selling.
          High valuations relative to sector averages and near 52-week highs.
          Scanning {ALL_SYMBOLS.length} stocks from S&P 500, NASDAQ-100, and Dow Jones.
        </p>
      </div>

      <Suspense fallback={<StockTableSkeleton rows={20} />}>
        <OvervaluedData />
      </Suspense>
    </div>
  );
}
