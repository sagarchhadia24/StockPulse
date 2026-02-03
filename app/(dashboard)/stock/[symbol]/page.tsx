import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GitCompare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StockChart } from "@/components/stock/stock-chart";
import { StockMetrics } from "@/components/stock/stock-metrics";
import { StockNewsList } from "@/components/stock/stock-news";
import { ValuationHistoryChart } from "@/components/stock/valuation-history-chart";
import { WatchlistButton } from "@/components/stock/watchlist-button";
import { SetAlertButton } from "@/components/stock/set-alert-button";
import { calculateValueScore, classifyStock, getScoreColor } from "@/lib/valuation";
import { getStockQuote, getStockNews, getHistoricalPrices } from "@/lib/yahoo-finance";
import { cn } from "@/lib/utils";

async function getStockData(symbol: string) {
  const [stock, news, history] = await Promise.all([
    getStockQuote(symbol),
    getStockNews(symbol),
    getHistoricalPrices(symbol, "1y"),
  ]);

  if (!stock) return null;

  return {
    stock: calculateValueScore(stock),
    news,
    history,
  };
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
  const classification = classifyStock(stock.valueScore);
  const scoreColor = getScoreColor(stock.valueScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{stock.symbol}</h1>
            <Badge variant="outline">{stock.sector}</Badge>
          </div>
          <p className="text-lg text-muted-foreground">{stock.name}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-4xl font-bold">${stock.price.toFixed(2)}</span>
            <span
              className={cn(
                "text-lg",
                stock.change >= 0 ? "text-green-500" : "text-red-500"
              )}
            >
              {stock.change >= 0 ? "+" : ""}
              {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Card className="w-32">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Value Score</p>
              <p className={cn("text-3xl font-bold", scoreColor)}>
                {stock.valueScore}
              </p>
              <Badge
                variant={
                  classification === "undervalued"
                    ? "default"
                    : classification === "overvalued"
                    ? "destructive"
                    : "secondary"
                }
              >
                {classification}
              </Badge>
            </CardContent>
          </Card>
          <div className="flex flex-col gap-2">
            <WatchlistButton symbol={stock.symbol} variant="full" />
            <Link href={`/compare?symbols=${stock.symbol}`}>
              <Button variant="outline" size="sm" className="gap-2 w-full">
                <GitCompare className="h-4 w-4" />
                Compare
              </Button>
            </Link>
            <SetAlertButton
              symbol={stock.symbol}
              currentPrice={stock.price}
              currentScore={stock.valueScore}
            />
          </div>
        </div>
      </div>

      {/* Chart */}
      <StockChart
        history={history}
        week52High={stock.week52High}
        week52Low={stock.week52Low}
      />

      {/* Metrics */}
      <StockMetrics stock={stock} />

      {/* Valuation History */}
      <ValuationHistoryChart symbol={stock.symbol} />

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
          <div className="text-sm text-muted-foreground mt-4">
            Data Quality: <Badge variant="outline">{stock.dataQuality}</Badge>
          </div>
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
