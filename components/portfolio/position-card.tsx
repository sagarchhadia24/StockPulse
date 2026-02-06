"use client";

import Link from "next/link";
import { PortfolioPositionWithMarket } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface PositionCardProps {
  position: PortfolioPositionWithMarket;
  onDelete: () => void;
}

export function PositionCard({ position, onDelete }: PositionCardProps) {
  const isPositive = position.gain >= 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <Link
                href={`/stock/${position.symbol}`}
                className="font-bold text-lg hover:underline flex items-center gap-1"
              >
                {position.symbol}
                <ExternalLink className="h-3 w-3" />
              </Link>
              <p className="text-xs text-muted-foreground">{position.sector}</p>
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground">
                {position.shares} shares @ ${position.buyPrice.toFixed(2)}
              </p>
              {position.buyDate && (
                <p className="text-xs text-muted-foreground">
                  Bought: {position.buyDate}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="font-semibold">${position.currentPrice.toFixed(2)}</p>
              <p className={cn("text-sm", position.dayChange >= 0 ? "text-green-500" : "text-red-500")}>
                {position.dayChange >= 0 ? "+" : ""}{position.dayChange.toFixed(2)}%
              </p>
            </div>

            <div className="text-right">
              <p className={cn("font-semibold", isPositive ? "text-green-500" : "text-red-500")}>
                {isPositive ? "+" : ""}${position.gain.toFixed(2)}
              </p>
              <p className={cn("text-sm", isPositive ? "text-green-500" : "text-red-500")}>
                {isPositive ? "+" : ""}{position.gainPercent.toFixed(2)}%
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
