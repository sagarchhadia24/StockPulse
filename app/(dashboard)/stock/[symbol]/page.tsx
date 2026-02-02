import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StockChart } from "@/components/stock/stock-chart";
import { StockMetrics } from "@/components/stock/stock-metrics";
import { StockNewsList } from "@/components/stock/stock-news";
import { LiveStockHeader } from "@/components/stock/live-stock-header";

async function getStockData(symbol: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stocks/${symbol}`,
    { next: { revalidate: 900 } }
  );
  if (!res.ok) return null;
  return res.json();
}

function StockDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}

async function StockDetailContent({ symbol }: { symbol: string }) {
  const data = await getStockData(symbol);

  if (!data || !data.stock) {
    notFound();
  }

  const { stock, news, history } = data;

  return (
    <div className="space-y-6">
      {/* Live Header */}
      <LiveStockHeader symbol={symbol} initialData={stock} />

      {/* Chart */}
      <StockChart
        history={history}
        week52High={stock.week52High}
        week52Low={stock.week52Low}
      />

      {/* Metrics */}
      <StockMetrics stock={stock} />

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">P/E Score (30%)</p>
              <p className="text-lg font-semibold">
                {stock.scoreBreakdown.peScore?.toFixed(0) || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">P/B Score (20%)</p>
              <p className="text-lg font-semibold">
                {stock.scoreBreakdown.pbScore?.toFixed(0) || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PEG Score (25%)</p>
              <p className="text-lg font-semibold">
                {stock.scoreBreakdown.pegScore?.toFixed(0) || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">52W Position (25%)</p>
              <p className="text-lg font-semibold">
                {stock.scoreBreakdown.weekPositionScore.toFixed(0)}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Data Quality: <Badge variant="outline">{stock.dataQuality}</Badge>
          </p>
        </CardContent>
      </Card>

      {/* News */}
      <StockNewsList news={news} />
    </div>
  );
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return (
    <Suspense fallback={<StockDetailSkeleton />}>
      <StockDetailContent symbol={symbol.toUpperCase()} />
    </Suspense>
  );
}
