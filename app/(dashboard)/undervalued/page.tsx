import { Suspense } from "react";
import { StockTable } from "@/components/stock/stock-table";
import { StockTableSkeleton } from "@/components/stock/stock-table-skeleton";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { ALL_SYMBOLS } from "@/data/symbols";

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

async function UndervaluedTable() {
  const { stocks } = await getStocksData();

  const undervalued = stocks
    .filter((s: any) => s.valueScore >= 70)
    .sort((a: any, b: any) => b.valueScore - a.valueScore);

  return <StockTable stocks={undervalued} />;
}

export default function UndervaluedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Undervalued Stocks</h1>
        <p className="text-muted-foreground">
          Stocks with value scores of 70 or higher - potential buying opportunities
          based on P/E, P/B, PEG ratios and 52-week position.
          Scanning {ALL_SYMBOLS.length} stocks from S&P 500, NASDAQ-100, and Dow Jones.
        </p>
      </div>

      <Suspense fallback={<StockTableSkeleton rows={20} />}>
        <UndervaluedTable />
      </Suspense>
    </div>
  );
}
