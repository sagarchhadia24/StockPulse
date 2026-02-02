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
        </p>
      </div>

      <Suspense fallback={<StockTableSkeleton rows={20} />}>
        <UndervaluedTable />
      </Suspense>
    </div>
  );
}
