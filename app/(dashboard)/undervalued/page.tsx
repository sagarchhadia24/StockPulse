import { Suspense } from "react";
import { StockTable } from "@/components/stock/stock-table";
import { StockTableSkeleton } from "@/components/stock/stock-table-skeleton";

async function getStocksData() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stocks`,
    { next: { revalidate: 900 } }
  );
  if (!res.ok) throw new Error("Failed to fetch stocks");
  return res.json();
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
