import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockWithScore } from "@/types";

interface StockMetricsProps {
  stock: StockWithScore;
}

export function StockMetrics({ stock }: StockMetricsProps) {
  const metrics = [
    { label: "Current Price", value: `$${stock.price.toFixed(2)}` },
    { label: "52-Week High", value: `$${stock.week52High.toFixed(2)}` },
    { label: "52-Week Low", value: `$${stock.week52Low.toFixed(2)}` },
    { label: "P/E Ratio", value: stock.peRatio?.toFixed(2) || "N/A" },
    { label: "P/B Ratio", value: stock.pbRatio?.toFixed(2) || "N/A" },
    { label: "PEG Ratio", value: stock.pegRatio?.toFixed(2) || "N/A" },
    {
      label: "Market Cap",
      value: formatMarketCap(stock.marketCap),
    },
    {
      label: "Dividend Yield",
      value: stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : "N/A",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="text-lg font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}
