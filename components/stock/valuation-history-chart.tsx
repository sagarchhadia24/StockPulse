// components/stock/valuation-history-chart.tsx
"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryDataPoint } from "@/types";
import { classifyStock } from "@/lib/valuation";
import { Info } from "lucide-react";

interface ValuationHistoryChartProps {
  symbol: string;
  initialData?: HistoryDataPoint[];
}

type Period = "1mo" | "3mo" | "6mo" | "1y";

export function ValuationHistoryChart({
  symbol,
  initialData,
}: ValuationHistoryChartProps) {
  const [period, setPeriod] = useState<Period>("1y");
  const [data, setData] = useState<HistoryDataPoint[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/stocks/${symbol}/history?period=${period}`
        );
        if (!response.ok) throw new Error("Failed to fetch history");

        const result = await response.json();
        setData(result.history);
      } catch (err) {
        setError("Failed to load history data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [symbol, period]);

  // Check if we have any valuation data
  const hasValuationData = data.some((d) => d.valueScore !== null);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const priceData = payload.find((p: any) => p.dataKey === "price");
    const scoreData = payload.find((p: any) => p.dataKey === "valueScore");

    const score = scoreData?.value;
    const classification = score ? classifyStock(score) : null;

    return (
      <div className="bg-[#0c1222] border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-xs text-white/60 mb-2">
          {new Date(label).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        {priceData && (
          <p className="text-sm text-white">
            <span className="text-blue-400">Price:</span> $
            {priceData.value.toFixed(2)}
          </p>
        )}
        {score !== null && score !== undefined && (
          <p className="text-sm text-white">
            <span className="text-[#00dc82]">Value Score:</span> {score}
            <span className="text-white/60 ml-1">({classification})</span>
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valuation History</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valuation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-white/60">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Valuation History</CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList>
              <TabsTrigger value="1mo">1M</TabsTrigger>
              <TabsTrigger value="3mo">3M</TabsTrigger>
              <TabsTrigger value="6mo">6M</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {!hasValuationData && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="h-4 w-4 text-blue-400" />
            <p className="text-sm text-blue-400">
              Valuation tracking just started. Score history will appear as data
              accumulates.
            </p>
          </div>
        )}

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
                stroke="rgba(255,255,255,0.1)"
              />
              {/* Price axis (right) */}
              <YAxis
                yAxisId="price"
                orientation="right"
                domain={["auto", "auto"]}
                tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }}
                tickFormatter={(value) => `$${value}`}
                stroke="rgba(255,255,255,0.1)"
              />
              {/* Value Score axis (left) */}
              <YAxis
                yAxisId="score"
                orientation="left"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }}
                stroke="rgba(255,255,255,0.1)"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                formatter={(value) => (
                  <span className="text-white/80 text-sm">{value}</span>
                )}
              />
              {/* Price line */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Price"
              />
              {/* Value Score line */}
              {hasValuationData && (
                <Line
                  yAxisId="score"
                  type="monotone"
                  dataKey="valueScore"
                  stroke="#00dc82"
                  strokeWidth={2}
                  dot={false}
                  name="Value Score"
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
