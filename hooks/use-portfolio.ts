"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PortfolioPosition, CreatePositionInput, UpdatePositionInput } from "@/types";

export function usePortfolio() {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchPositions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setPositions([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPositions(data.map((item: Record<string, unknown>) => ({
        id: item.id as string,
        userId: item.user_id as string,
        symbol: item.symbol as string,
        shares: parseFloat(String(item.shares)),
        buyPrice: parseFloat(String(item.buy_price)),
        buyDate: item.buy_date as string | null,
        notes: item.notes as string | null,
        createdAt: item.created_at as string,
        updatedAt: item.updated_at as string,
      })));
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const addPosition = async (input: CreatePositionInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data, error } = await supabase
      .from("portfolios")
      .insert({
        user_id: user.id,
        symbol: input.symbol.toUpperCase(),
        shares: input.shares,
        buy_price: input.buyPrice,
        buy_date: input.buyDate || null,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (!error && data) {
      await fetchPositions();
    }
    return { data, error };
  };

  const removePosition = async (positionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("portfolios")
      .delete()
      .eq("id", positionId)
      .eq("user_id", user.id);

    if (!error) {
      setPositions(positions.filter((p) => p.id !== positionId));
    }
    return { error };
  };

  const updatePosition = async (positionId: string, updates: UpdatePositionInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const updateData: Record<string, unknown> = {};
    if (updates.shares !== undefined) updateData.shares = updates.shares;
    if (updates.buyPrice !== undefined) updateData.buy_price = updates.buyPrice;
    if (updates.buyDate !== undefined) updateData.buy_date = updates.buyDate;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from("portfolios")
      .update(updateData)
      .eq("id", positionId)
      .eq("user_id", user.id);

    if (!error) {
      await fetchPositions();
    }
    return { error };
  };

  return {
    positions,
    loading,
    addPosition,
    removePosition,
    updatePosition,
    refresh: fetchPositions,
  };
}
