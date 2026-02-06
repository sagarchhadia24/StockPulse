"use client";

import { PortfolioPositionWithMarket } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

interface PortfolioChartProps {
  positions: PortfolioPositionWithMarket[];
}

export function PortfolioChart({ positions }: PortfolioChartProps) {
  // Sector breakdown
  const sectorMap = new Map<string, number>();
  positions.forEach((pos) => {
    const current = sectorMap.get(pos.sector) || 0;
    sectorMap.set(pos.sector, current + pos.currentValue);
  });
  const sectorData = Array.from(sectorMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // P&L by position
  const plData = positions
    .map((pos) => ({
      symbol: pos.symbol,
      gain: pos.gain,
      gainPercent: pos.gainPercent,
    }))
    .sort((a, b) => b.gain - a.gain);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Portfolio Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sectors">
          <TabsList>
            <TabsTrigger value="sectors">Sector Breakdown</TabsTrigger>
            <TabsTrigger value="pnl">P&L by Position</TabsTrigger>
          </TabsList>

          <TabsContent value="sectors">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {sectorData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | string | undefined) => [
                      `$${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                      "Value",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="pnl">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plData} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `$${v.toFixed(0)}`} />
                  <YAxis type="category" dataKey="symbol" width={60} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number | string | undefined) => [
                      `$${Number(value ?? 0).toFixed(2)}`,
                      "P&L",
                    ]}
                  />
                  <Bar
                    dataKey="gain"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
