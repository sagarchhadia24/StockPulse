"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { MoversTable } from "@/components/movers/movers-table";
import { IndexSelector } from "@/components/movers/index-selector";
import { MoverStock } from "@/lib/movers";
import { Button } from "@/components/ui/button";

interface MoversData {
  index: string;
  indexName: string;
  gainers: MoverStock[];
  losers: MoverStock[];
  asOf: string;
}

export default function MoversPage() {
  const searchParams = useSearchParams();
  const index = searchParams.get("index") || "sp500";

  const [data, setData] = useState<MoversData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/market/movers?index=${index}`);
      if (!response.ok) {
        throw new Error("Failed to fetch movers");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovers();
  }, [index]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Top Movers</h1>
          <p className="text-muted-foreground">
            Today&apos;s biggest gainers and losers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <IndexSelector />
          <Button
            variant="outline"
            size="icon"
            onClick={fetchMovers}
            disabled={loading}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Last updated */}
      {data?.asOf && (
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(data.asOf).toLocaleTimeString()}
        </p>
      )}

      {/* Content */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchMovers}>Try Again</Button>
        </div>
      ) : data ? (
        <div className="grid gap-6 md:grid-cols-2">
          <MoversTable stocks={data.gainers} type="gainers" />
          <MoversTable stocks={data.losers} type="losers" />
        </div>
      ) : null}
    </div>
  );
}
