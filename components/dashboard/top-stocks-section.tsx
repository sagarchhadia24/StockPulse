import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockCard } from "@/components/stock/stock-card";
import { StockWithScore } from "@/types";

interface TopStocksSectionProps {
  title: string;
  stocks: StockWithScore[];
  href: string;
  description?: string;
}

export function TopStocksSection({
  title,
  stocks,
  href,
  description,
}: TopStocksSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        <Button variant="outline" asChild>
          <Link href={href}>View All</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stocks.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </div>
    </section>
  );
}
