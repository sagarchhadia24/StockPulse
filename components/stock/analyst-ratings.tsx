"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalystRatings as AnalystRatingsType } from "@/types";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalystRatingsSectionProps {
  symbol: string;
  currentPrice: number;
}

function getRecommendationColor(rec: string): string {
  switch (rec.toLowerCase()) {
    case "strong_buy":
    case "buy":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "hold":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "sell":
    case "strong_sell":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatRecommendation(rec: string): string {
  return rec.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AnalystRatingsSection({ symbol, currentPrice }: AnalystRatingsSectionProps) {
  const [data, setData] = useState<AnalystRatingsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/stocks/${symbol}?enriched=true`);
      if (!response.ok) throw new Error("Failed to fetch analyst data");
      const result = await response.json();
      setData(result.analystRatings || null);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analyst ratings");
    } finally {
      setLoading(false);
    }
  };

  const upside = data?.targetMedian
    ? ((data.targetMedian - currentPrice) / currentPrice * 100)
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Analyst Ratings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasLoaded && !loading && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">
              View analyst consensus and price targets
            </p>
            <Button onClick={loadData} variant="outline" size="sm">
              Load Analyst Data
            </Button>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {data && !loading && (
          <div className="space-y-4">
            {/* Consensus Badge */}
            <div className="flex items-center gap-3">
              <span className={cn("px-3 py-1 text-sm font-medium rounded-full border", getRecommendationColor(data.recommendation))}>
                {formatRecommendation(data.recommendation)}
              </span>
              {data.numberOfAnalysts > 0 && (
                <span className="text-sm text-muted-foreground">
                  {data.numberOfAnalysts} analyst{data.numberOfAnalysts !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Price Target Range */}
            {data.targetLow !== null && data.targetHigh !== null && data.targetMedian !== null && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${data.targetLow.toFixed(2)}</span>
                  <span>Median: ${data.targetMedian.toFixed(2)}</span>
                  <span>${data.targetHigh.toFixed(2)}</span>
                </div>
                <div className="relative h-2 bg-muted rounded-full">
                  {/* Current price marker */}
                  <div
                    className="absolute top-0 h-2 w-0.5 bg-foreground z-10"
                    style={{
                      left: `${Math.min(100, Math.max(0, ((currentPrice - data.targetLow) / (data.targetHigh - data.targetLow)) * 100))}%`,
                    }}
                  />
                  {/* Median marker */}
                  <div
                    className="absolute top-0 h-2 w-1 bg-blue-500 rounded-full z-10"
                    style={{
                      left: `${((data.targetMedian - data.targetLow) / (data.targetHigh - data.targetLow)) * 100}%`,
                    }}
                  />
                  <div className="h-full bg-gradient-to-r from-red-500/30 via-yellow-500/30 to-green-500/30 rounded-full" />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Low</span>
                  <span className="text-muted-foreground">High</span>
                </div>
              </div>
            )}

            {/* Upside/Downside */}
            {upside !== null && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Implied upside:</span>
                <span className={cn("font-medium", upside >= 0 ? "text-green-500" : "text-red-500")}>
                  {upside >= 0 ? "+" : ""}{upside.toFixed(1)}%
                </span>
              </div>
            )}

            {data.numberOfAnalysts === 0 && (
              <p className="text-sm text-muted-foreground">No analyst coverage available</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
