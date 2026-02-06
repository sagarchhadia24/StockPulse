"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OHLCVDataPoint } from "@/types";
import { Loader2, CandlestickChart as CandlestickChartIcon, LineChart as LineChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface AdvancedChartProps {
  symbol: string;
}

type ChartType = "candlestick" | "line";
type Period = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y";

const PERIOD_MAP: Record<Period, string> = {
  "1D": "1d",
  "1W": "1w",
  "1M": "1mo",
  "3M": "3mo",
  "6M": "6mo",
  "1Y": "1y",
  "5Y": "5y",
};

export function calculateMA(
  data: { close: number }[],
  period: number,
  isEMA: boolean = false
): (number | null)[] {
  const result: (number | null)[] = [];

  if (data.length < period) {
    return data.map(() => null);
  }

  if (!isEMA) {
    // SMA
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(null);
        continue;
      }
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j].close;
      }
      result.push(sum / period);
    }
  } else {
    // EMA
    const multiplier = 2 / (period + 1);
    // Start with SMA for first value
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i].close;
      result.push(null);
    }
    result[period - 1] = sum / period;

    for (let i = period; i < data.length; i++) {
      const prevEMA = result[i - 1]!;
      result.push((data[i].close - prevEMA) * multiplier + prevEMA);
    }
  }

  return result;
}

export function AdvancedChart({ symbol }: AdvancedChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // lightweight-charts types are only available after dynamic import
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeSeriesRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sma20Ref = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sma50Ref = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ema20Ref = useRef<any>(null);

  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [period, setPeriod] = useState<Period>("1Y");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OHLCVDataPoint[]>([]);
  const [showSMA20, setShowSMA20] = useState(false);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showEMA20, setShowEMA20] = useState(false);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/stocks/${symbol}/history?period=${PERIOD_MAP[period]}&format=ohlcv`
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [symbol, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Dynamically import lightweight-charts
    let disposed = false;

    import("lightweight-charts").then((lc) => {
      if (disposed || !chartContainerRef.current) return;

      // Clean up previous chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      const chart = lc.createChart(chartContainerRef.current, {
        layout: {
          background: { color: "transparent" },
          textColor: isDark ? "#94a3b8" : "#64748b",
        },
        grid: {
          vertLines: { color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" },
          horzLines: { color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" },
        },
        crosshair: {
          mode: 0,
        },
        rightPriceScale: {
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        },
        timeScale: {
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          timeVisible: period === "1D" || period === "1W",
        },
      });

      chartRef.current = chart;

      // Format data for lightweight-charts
      const formattedData = data.map((d) => ({
        time: (period === "1D" || period === "1W")
          ? Math.floor(new Date(d.date).getTime() / 1000)
          : d.date.split("T")[0],
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      const lineData = data.map((d) => ({
        time: (period === "1D" || period === "1W")
          ? Math.floor(new Date(d.date).getTime() / 1000)
          : d.date.split("T")[0],
        value: d.close,
      }));

      // Main series (v5 API: chart.addSeries(SeriesType, options))
      if (chartType === "candlestick") {
        const series = chart.addSeries(lc.CandlestickSeries, {
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderUpColor: "#22c55e",
          borderDownColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        series.setData(formattedData as any);
        seriesRef.current = series;
      } else {
        const series = chart.addSeries(lc.LineSeries, {
          color: "#3b82f6",
          lineWidth: 2,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        series.setData(lineData as any);
        seriesRef.current = series;
      }

      // Volume histogram
      const volumeSeries = chart.addSeries(lc.HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(
        data.map((d) => ({
          time: (period === "1D" || period === "1W")
            ? Math.floor(new Date(d.date).getTime() / 1000)
            : d.date.split("T")[0],
          value: d.volume,
          color: d.close >= d.open
            ? "rgba(34, 197, 94, 0.3)"
            : "rgba(239, 68, 68, 0.3)",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })) as any
      );
      volumeSeriesRef.current = volumeSeries;

      // Moving averages
      const maData = data.map((d) => ({ close: d.close }));

      if (showSMA20) {
        const sma20Values = calculateMA(maData, 20);
        const sma20Series = chart.addSeries(lc.LineSeries, {
          color: "#f59e0b",
          lineWidth: 1,
        });
        sma20Series.setData(
          sma20Values
            .map((val, i) =>
              val !== null
                ? {
                    time: (period === "1D" || period === "1W")
                      ? Math.floor(new Date(data[i].date).getTime() / 1000)
                      : data[i].date.split("T")[0],
                    value: val,
                  }
                : null
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter(Boolean) as any
        );
        sma20Ref.current = sma20Series;
      }

      if (showSMA50) {
        const sma50Values = calculateMA(maData, 50);
        const sma50Series = chart.addSeries(lc.LineSeries, {
          color: "#a855f7",
          lineWidth: 1,
        });
        sma50Series.setData(
          sma50Values
            .map((val, i) =>
              val !== null
                ? {
                    time: (period === "1D" || period === "1W")
                      ? Math.floor(new Date(data[i].date).getTime() / 1000)
                      : data[i].date.split("T")[0],
                    value: val,
                  }
                : null
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter(Boolean) as any
        );
        sma50Ref.current = sma50Series;
      }

      if (showEMA20) {
        const ema20Values = calculateMA(maData, 20, true);
        const ema20Series = chart.addSeries(lc.LineSeries, {
          color: "#06b6d4",
          lineWidth: 1,
          lineStyle: lc.LineStyle.Dashed,
        });
        ema20Series.setData(
          ema20Values
            .map((val, i) =>
              val !== null
                ? {
                    time: (period === "1D" || period === "1W")
                      ? Math.floor(new Date(data[i].date).getTime() / 1000)
                      : data[i].date.split("T")[0],
                    value: val,
                  }
                : null
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter(Boolean) as any
        );
        ema20Ref.current = ema20Series;
      }

      chart.timeScale().fitContent();

      // Responsive resize
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          chart.applyOptions({ width, height });
        }
      });
      resizeObserver.observe(chartContainerRef.current);

      return () => {
        disposed = true;
        resizeObserver.disconnect();
        chart.remove();
      };
    });

    return () => {
      disposed = true;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, chartType, isDark, showSMA20, showSMA50, showEMA20, period]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>Price Chart</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Chart Type Toggle */}
            <div className="flex gap-1 border rounded-lg p-0.5">
              <Button
                variant={chartType === "candlestick" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setChartType("candlestick")}
              >
                <CandlestickChartIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={chartType === "line" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setChartType("line")}
              >
                <LineChartIcon className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Period Selector */}
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList className="h-8">
                {(["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"] as Period[]).map((p) => (
                  <TabsTrigger key={p} value={p} className="text-xs px-2 h-7">
                    {p}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Indicator toggles */}
        <div className="flex gap-2 mt-2">
          <Button
            variant={showSMA20 ? "default" : "outline"}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setShowSMA20(!showSMA20)}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-1" />
            SMA 20
          </Button>
          <Button
            variant={showSMA50 ? "default" : "outline"}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setShowSMA50(!showSMA50)}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mr-1" />
            SMA 50
          </Button>
          <Button
            variant={showEMA20 ? "default" : "outline"}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setShowEMA20(!showEMA20)}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 mr-1" />
            EMA 20
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && data.length === 0 && (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No chart data available for this period
          </div>
        )}
        <div
          ref={chartContainerRef}
          className={cn("h-[400px] w-full", loading || data.length === 0 ? "hidden" : "")}
        />
      </CardContent>
    </Card>
  );
}
