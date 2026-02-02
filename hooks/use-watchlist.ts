"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { WatchlistItem } from "@/types";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchWatchlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("watchlists")
      .select("*")
      .eq("user_id", user.id);

    if (!error && data) {
      setWatchlist(data.map(item => ({
        id: item.id,
        userId: item.user_id,
        symbol: item.symbol,
        notes: item.notes,
        addedAt: item.added_at,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const addToWatchlist = async (symbol: string, notes?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data, error } = await supabase
      .from("watchlists")
      .insert({ user_id: user.id, symbol, notes })
      .select()
      .single();

    if (!error && data) {
      const newItem: WatchlistItem = {
        id: data.id,
        userId: data.user_id,
        symbol: data.symbol,
        notes: data.notes,
        addedAt: data.added_at,
      };
      setWatchlist([...watchlist, newItem]);
    }
    return { data, error };
  };

  const removeFromWatchlist = async (symbol: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("watchlists")
      .delete()
      .eq("user_id", user.id)
      .eq("symbol", symbol);

    if (!error) {
      setWatchlist(watchlist.filter((item) => item.symbol !== symbol));
    }
    return { error };
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist.some((item) => item.symbol === symbol);
  };

  const updateNotes = async (symbol: string, notes: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("watchlists")
      .update({ notes })
      .eq("user_id", user.id)
      .eq("symbol", symbol);

    if (!error) {
      setWatchlist(
        watchlist.map((item) =>
          item.symbol === symbol ? { ...item, notes } : item
        )
      );
    }
    return { error };
  };

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    updateNotes,
    refresh: fetchWatchlist,
  };
}
