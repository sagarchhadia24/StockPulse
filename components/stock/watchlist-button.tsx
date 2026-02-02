"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star, StarOff, Loader2 } from "lucide-react";

interface WatchlistButtonProps {
  symbol: string;
  variant?: "icon" | "full";
}

export function WatchlistButton({ symbol, variant = "icon" }: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      if (user) {
        const { data } = await supabase
          .from("watchlists")
          .select("id")
          .eq("user_id", user.id)
          .eq("symbol", symbol)
          .single();

        setIsInWatchlist(!!data);
      }
      setLoading(false);
    };

    checkStatus();
  }, [symbol, supabase]);

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast.info("Please login to add stocks to your watchlist");
      router.push(`/login?redirect=/stock/${symbol}`);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (isInWatchlist) {
      const { error } = await supabase
        .from("watchlists")
        .delete()
        .eq("user_id", user!.id)
        .eq("symbol", symbol);

      if (!error) {
        setIsInWatchlist(false);
        toast.success(`${symbol} removed from watchlist`);
      }
    } else {
      const { error } = await supabase
        .from("watchlists")
        .insert({ user_id: user!.id, symbol });

      if (!error) {
        setIsInWatchlist(true);
        toast.success(`${symbol} added to watchlist`);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return variant === "icon" ? (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    ) : (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      >
        {isInWatchlist ? (
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
        ) : (
          <StarOff className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button variant={isInWatchlist ? "secondary" : "outline"} onClick={handleClick}>
      {isInWatchlist ? (
        <>
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 mr-2" />
          In Watchlist
        </>
      ) : (
        <>
          <StarOff className="h-4 w-4 mr-2" />
          Add to Watchlist
        </>
      )}
    </Button>
  );
}
