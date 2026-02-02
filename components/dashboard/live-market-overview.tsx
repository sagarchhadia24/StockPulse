"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveMarketIndices } from "@/hooks/use-live-prices";
import { MarketIndex } from "@/types";
import { cn } from "@/lib/utils";

interface LiveMarketOverviewProps {
  initialData?: MarketIndex[];
}

export function LiveMarketOverview({ initialData }: LiveMarketOverviewProps) {
  const { data, isLive, lastUpdated } = useLiveMarketIndices();
  const indices = data ?? initialData ?? [];

  if (indices.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isLive && <LiveIndicator />}
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {indices.map((index) => (
          <Card key={index.symbol}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {index.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {index.value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p
                className={cn(
                  "text-sm",
                  index.change >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {index.change >= 0 ? "+" : ""}
                {index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
