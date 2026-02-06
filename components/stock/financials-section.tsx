"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancialStatements } from "@/types";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface FinancialsSectionProps {
  symbol: string;
}

function formatLargeNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toFixed(0)}`;
}

export function FinancialsSection({ symbol }: FinancialsSectionProps) {
  const [data, setData] = useState<FinancialStatements | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/stocks/${symbol}?enriched=true`);
      if (!response.ok) throw new Error("Failed to fetch financial data");
      const result = await response.json();
      setData(result.financials || null);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load financials");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = data
    ? data.annualRevenue.map((rev, i) => ({
        date: rev.date.substring(0, 4),
        revenue: rev.value,
        netIncome: data.annualNetIncome[i]?.value ?? 0,
        freeCashFlow: data.annualFreeCashFlow[i]?.value ?? 0,
      })).reverse()
    : [];

  const ratios = data
    ? [
        { label: "Profit Margin", value: data.profitMargin, format: "percent" },
        { label: "Operating Margin", value: data.operatingMargin, format: "percent" },
        { label: "ROE", value: data.returnOnEquity, format: "percent" },
        { label: "Debt/Equity", value: data.debtToEquity, format: "ratio" },
        { label: "Current Ratio", value: data.currentRatio, format: "ratio" },
      ]
    : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-500" />
          Financial Statements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasLoaded && !loading && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">
              View revenue, income, and key financial ratios
            </p>
            <Button onClick={loadData} variant="outline" size="sm">
              Load Financial Data
            </Button>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {data && !loading && (
          <div className="space-y-6">
            {/* Revenue/Income Chart */}
            {chartData.length > 0 && (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => formatLargeNumber(v)}
                    />
                    <Tooltip
                      formatter={(value: number | string | undefined) => [formatLargeNumber(Number(value ?? 0))]}
                      labelFormatter={(label) => `FY ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="netIncome" name="Net Income" fill="#22c55e" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="freeCashFlow" name="Free Cash Flow" fill="#a855f7" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Key Ratios Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {ratios.map((ratio) => (
                <div key={ratio.label}>
                  <p className="text-sm text-muted-foreground">{ratio.label}</p>
                  <p className="text-lg font-semibold">
                    {ratio.value !== null
                      ? ratio.format === "percent"
                        ? `${(ratio.value * 100).toFixed(1)}%`
                        : ratio.value.toFixed(2)
                      : "N/A"}
                  </p>
                </div>
              ))}
            </div>

            {chartData.length === 0 && ratios.every((r) => r.value === null) && (
              <p className="text-sm text-muted-foreground">No financial data available</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
