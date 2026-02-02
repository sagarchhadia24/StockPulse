import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketIndex } from "@/types";
import { cn } from "@/lib/utils";

interface MarketOverviewProps {
  indices: MarketIndex[];
}

export function MarketOverview({ indices }: MarketOverviewProps) {
  return (
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
  );
}
