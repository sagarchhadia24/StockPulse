"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EarningsData } from "@/types";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface EarningsSectionProps {
  symbol: string;
}

export function EarningsSection({ symbol }: EarningsSectionProps) {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/stocks/${symbol}?enriched=true`);
      if (!response.ok) throw new Error("Failed to fetch earnings data");
      const result = await response.json();
      setData(result.earnings || null);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Earnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasLoaded && !loading && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">
              View earnings history and upcoming dates
            </p>
            <Button onClick={loadData} variant="outline" size="sm">
              Load Earnings Data
            </Button>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {data && !loading && (
          <div className="space-y-4">
            {/* Next Earnings Date */}
            {data.earningsDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Next Earnings:</span>
                <Badge variant="outline">{data.earningsDate}</Badge>
              </div>
            )}

            {/* EPS */}
            <div className="flex gap-4 text-sm">
              {data.epsTrailing !== null && (
                <div>
                  <span className="text-muted-foreground">EPS (TTM): </span>
                  <span className="font-medium">${data.epsTrailing.toFixed(2)}</span>
                </div>
              )}
              {data.epsForward !== null && (
                <div>
                  <span className="text-muted-foreground">EPS (Fwd): </span>
                  <span className="font-medium">${data.epsForward.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Earnings History Table */}
            {data.earningsHistory.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-muted-foreground font-medium">Quarter</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Estimate</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Actual</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Surprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.earningsHistory.map((q, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{q.date}</td>
                        <td className="text-right py-2">
                          {q.epsEstimate !== null ? `$${q.epsEstimate.toFixed(2)}` : "N/A"}
                        </td>
                        <td className="text-right py-2">
                          {q.epsActual !== null ? `$${q.epsActual.toFixed(2)}` : "N/A"}
                        </td>
                        <td className="text-right py-2">
                          {q.epsSurprisePercent !== null ? (
                            <span className={cn(
                              "flex items-center justify-end gap-1",
                              q.epsSurprisePercent >= 0 ? "text-green-500" : "text-red-500"
                            )}>
                              {q.epsSurprisePercent >= 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {q.epsSurprisePercent >= 0 ? "+" : ""}
                              {q.epsSurprisePercent.toFixed(1)}%
                            </span>
                          ) : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!data.earningsDate && data.earningsHistory.length === 0 && (
              <p className="text-sm text-muted-foreground">No earnings data available</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
