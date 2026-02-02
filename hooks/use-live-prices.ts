"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StockWithScore, MarketIndex } from "@/types";

interface UseLivePricesOptions {
  interval?: number; // polling interval in ms, default 30000
  enabled?: boolean; // whether to enable polling, default true
}

interface UseLivePricesResult<T> {
  data: T | null;
  isLive: boolean;
  lastUpdated: Date | null;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useLiveMarketIndices(
  options: UseLivePricesOptions = {}
): UseLivePricesResult<MarketIndex[]> {
  const { interval = 30000, enabled = true } = options;
  const [data, setData] = useState<MarketIndex[] | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const isVisibleRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/market");
      if (!res.ok) throw new Error("Failed to fetch market data");
      const { indices } = await res.json();
      setData(indices);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchData();
    setIsLive(true);

    // Handle visibility change
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Polling interval
    const intervalId = setInterval(() => {
      if (isVisibleRef.current) {
        fetchData();
      }
    }, interval);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      setIsLive(false);
    };
  }, [enabled, interval, fetchData]);

  return { data, isLive, lastUpdated, error, refresh: fetchData };
}

export function useLiveStockPrices(
  symbols: string[],
  options: UseLivePricesOptions = {}
): UseLivePricesResult<Record<string, StockWithScore>> {
  const { interval = 30000, enabled = true } = options;
  const [data, setData] = useState<Record<string, StockWithScore> | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const isVisibleRef = useRef(true);
  const symbolsKey = symbols.sort().join(",");

  const fetchData = useCallback(async () => {
    if (symbols.length === 0) return;
    try {
      const res = await fetch("/api/stocks");
      if (!res.ok) throw new Error("Failed to fetch stock data");
      const { stocks } = await res.json();

      const stockMap: Record<string, StockWithScore> = {};
      stocks.forEach((stock: StockWithScore) => {
        if (symbols.includes(stock.symbol)) {
          stockMap[stock.symbol] = stock;
        }
      });

      setData(stockMap);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }, [symbolsKey]);

  useEffect(() => {
    if (!enabled || symbols.length === 0) return;

    // Initial fetch
    fetchData();
    setIsLive(true);

    // Handle visibility change
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Polling interval
    const intervalId = setInterval(() => {
      if (isVisibleRef.current) {
        fetchData();
      }
    }, interval);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      setIsLive(false);
    };
  }, [enabled, interval, fetchData, symbolsKey]);

  return { data, isLive, lastUpdated, error, refresh: fetchData };
}

export function useLiveSingleStock(
  symbol: string,
  options: UseLivePricesOptions = {}
): UseLivePricesResult<StockWithScore> {
  const { interval = 30000, enabled = true } = options;
  const [data, setData] = useState<StockWithScore | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const isVisibleRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!symbol) return;
    try {
      const res = await fetch(`/api/stocks/${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch stock data");
      const { stock } = await res.json();
      setData(stock);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }, [symbol]);

  useEffect(() => {
    if (!enabled || !symbol) return;

    // Initial fetch
    fetchData();
    setIsLive(true);

    // Handle visibility change
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Polling interval
    const intervalId = setInterval(() => {
      if (isVisibleRef.current) {
        fetchData();
      }
    }, interval);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      setIsLive(false);
    };
  }, [enabled, interval, fetchData, symbol]);

  return { data, isLive, lastUpdated, error, refresh: fetchData };
}
