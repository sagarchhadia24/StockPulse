import { Suspense } from "react";
import { StockTable } from "@/components/stock/stock-table";
import { StockTableSkeleton } from "@/components/stock/stock-table-skeleton";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { DIVERSE_SYMBOLS } from "@/data/symbols";

async function getStocksData() {
  // Use diverse sample for balanced sector representation
  const stocks = await getMultipleQuotes(DIVERSE_SYMBOLS);
  const scoredStocks = stocks.map(calculateValueScore);
  return { stocks: scoredStocks };
}

async function OvervaluedTable() {
  const { stocks } = await getStocksData();

  const overvalued = stocks
    .filter((s: any) => s.valueScore < 40)
    .sort((a: any, b: any) => a.valueScore - b.valueScore);

  return <StockTable stocks={overvalued} />;
}

export default function OvervaluedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Overvalued Stocks</h1>
        <p className="text-muted-foreground">
          Stocks with value scores below 40 - consider avoiding or selling.
          High valuations relative to sector averages and near 52-week highs.
        </p>
      </div>

      <Suspense fallback={<StockTableSkeleton rows={20} />}>
        <OvervaluedTable />
      </Suspense>
    </div>
  );
}
