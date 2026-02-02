import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockWithScore } from "@/types";
import { classifyStock } from "@/lib/valuation";
import { cn } from "@/lib/utils";

interface StockCardProps {
  stock: StockWithScore;
}

export function StockCard({ stock }: StockCardProps) {
  const classification = classifyStock(stock.valueScore);

  return (
    <Link href={`/stock/${stock.symbol}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{stock.symbol}</CardTitle>
            <Badge
              variant={
                classification === "undervalued"
                  ? "default"
                  : classification === "overvalued"
                  ? "destructive"
                  : "secondary"
              }
            >
              {stock.valueScore}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{stock.name}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                ${stock.price.toFixed(2)}
              </p>
              <p
                className={cn(
                  "text-sm",
                  stock.change >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {stock.change >= 0 ? "+" : ""}
                {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>P/E: {stock.peRatio?.toFixed(1) || "N/A"}</p>
              <p>52W: ${stock.week52Low.toFixed(0)}-${stock.week52High.toFixed(0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
