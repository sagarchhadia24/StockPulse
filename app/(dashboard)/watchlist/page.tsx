"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { toast } from "sonner";
import { StockWithScore, WatchlistItem } from "@/types";
import { classifyStock } from "@/lib/valuation";
import { useLiveStockPrices } from "@/hooks/use-live-prices";
import { cn } from "@/lib/utils";
import { Trash2, ExternalLink } from "lucide-react";

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const supabase = createClient();

  const symbols = watchlist.map((w) => w.symbol);
  const { data: stockData, isLive, lastUpdated } = useLiveStockPrices(symbols, {
    enabled: symbols.length > 0,
  });

  useEffect(() => {
    const fetchWatchlist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: items } = await supabase
        .from("watchlists")
        .select("*")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });

      if (items) {
        const mappedItems: WatchlistItem[] = items.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          symbol: item.symbol,
          notes: item.notes,
          addedAt: item.added_at,
        }));
        setWatchlist(mappedItems);
      }
      setLoading(false);
    };

    fetchWatchlist();
  }, [supabase]);

  const handleRemove = async (symbol: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("watchlists")
      .delete()
      .eq("user_id", user.id)
      .eq("symbol", symbol);

    if (!error) {
      setWatchlist(watchlist.filter((w) => w.symbol !== symbol));
      toast.success(`${symbol} removed from watchlist`);
    }
  };

  const handleSaveNotes = async (symbol: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("watchlists")
      .update({ notes: notesValue })
      .eq("user_id", user.id)
      .eq("symbol", symbol);

    if (!error) {
      setWatchlist(
        watchlist.map((w) =>
          w.symbol === symbol ? { ...w, notes: notesValue } : w
        )
      );
      setEditingNotes(null);
      toast.success("Notes saved");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Watchlist</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Watchlist</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Your watchlist is empty. Add stocks to track them here.
            </p>
            <Button asChild>
              <Link href="/undervalued">Browse Undervalued Stocks</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Watchlist</h1>
          <p className="text-muted-foreground">
            {watchlist.length} stock{watchlist.length !== 1 ? "s" : ""} in your watchlist
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLive && <LiveIndicator />}
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {watchlist.map((item) => {
          const stock = stockData?.[item.symbol];
          const classification = stock ? classifyStock(stock.valueScore) : null;

          return (
            <Card key={item.symbol}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/stock/${item.symbol}`}
                        className="text-xl font-bold hover:underline"
                      >
                        {item.symbol}
                      </Link>
                      {stock && (
                        <>
                          <Badge variant="outline">{stock.sector}</Badge>
                          <Badge
                            variant={
                              classification === "undervalued"
                                ? "default"
                                : classification === "overvalued"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            Score: {stock.valueScore}
                          </Badge>
                        </>
                      )}
                    </div>
                    {stock && (
                      <div className="mt-2 flex items-center gap-4">
                        <span className="text-2xl font-semibold">
                          ${stock.price.toFixed(2)}
                        </span>
                        <span
                          className={cn(
                            stock.change >= 0 ? "text-green-500" : "text-red-500"
                          )}
                        >
                          {stock.change >= 0 ? "+" : ""}
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    )}

                    {/* Notes section */}
                    <div className="mt-4">
                      {editingNotes === item.symbol ? (
                        <div className="space-y-2">
                          <Textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            placeholder="Add notes..."
                            className="min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveNotes(item.symbol)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingNotes(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingNotes(item.symbol);
                            setNotesValue(item.notes || "");
                          }}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          {item.notes || "Add notes..."}
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Added{" "}
                      {new Date(item.addedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/stock/${item.symbol}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(item.symbol)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
