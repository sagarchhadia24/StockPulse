import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectorSummary } from "@/types";

interface SectorCardProps {
  sector: SectorSummary;
}

export function SectorCard({ sector }: SectorCardProps) {
  const slug = sector.sector.toLowerCase().replace(/\s+/g, "-");

  return (
    <Link href={`/sectors/${slug}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{sector.sector}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Stocks</span>
              <span className="font-medium">{sector.stockCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg Score</span>
              <Badge
                variant={
                  sector.avgScore >= 60
                    ? "default"
                    : sector.avgScore >= 40
                    ? "secondary"
                    : "destructive"
                }
              >
                {sector.avgScore.toFixed(0)}
              </Badge>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">Top Stock</p>
              <div className="flex items-center justify-between">
                <span className="font-medium">{sector.topStock}</span>
                <Badge variant="outline">{sector.topStockScore}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
