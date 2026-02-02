"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StockChartProps {
  history: { date: string; price: number }[];
  week52High: number;
  week52Low: number;
}

export function StockChart({ history, week52High, week52Low }: StockChartProps) {
  const [period, setPeriod] = useState("1y");

  const filterData = (data: typeof history, period: string) => {
    const now = new Date();
    let cutoff = new Date();

    switch (period) {
      case "1mo":
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case "3mo":
        cutoff.setMonth(now.getMonth() - 3);
        break;
      case "6mo":
        cutoff.setMonth(now.getMonth() - 6);
        break;
      case "1y":
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      case "5y":
        cutoff.setFullYear(now.getFullYear() - 5);
        break;
    }

    return data.filter((d) => new Date(d.date) >= cutoff);
  };

  const filteredData = filterData(history, period);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Price History</CardTitle>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="1mo">1M</TabsTrigger>
              <TabsTrigger value="3mo">3M</TabsTrigger>
              <TabsTrigger value="6mo">6M</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
              <TabsTrigger value="5y">5Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                }
              />
              <ReferenceLine
                y={week52High}
                stroke="#22c55e"
                strokeDasharray="3 3"
                label={{ value: "52W High", fontSize: 10 }}
              />
              <ReferenceLine
                y={week52Low}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: "52W Low", fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
