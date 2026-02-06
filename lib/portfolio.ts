// lib/portfolio.ts
import { createClient } from "@/lib/supabase/server";
import { PortfolioPosition, CreatePositionInput, UpdatePositionInput } from "@/types";

const MAX_POSITIONS_PER_USER = 100;

function mapRowToPosition(row: Record<string, unknown>): PortfolioPosition {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    symbol: row.symbol as string,
    shares: parseFloat(String(row.shares)),
    buyPrice: parseFloat(String(row.buy_price)),
    buyDate: row.buy_date as string | null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getUserPositions(userId: string): Promise<PortfolioPosition[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching positions:", error);
    return [];
  }

  return (data || []).map(mapRowToPosition);
}

export async function getUserPositionCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("portfolios")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error counting positions:", error);
    return 0;
  }

  return count || 0;
}

export async function createPosition(
  userId: string,
  input: CreatePositionInput
): Promise<{ success: boolean; position?: PortfolioPosition; error?: string }> {
  const supabase = await createClient();

  const count = await getUserPositionCount(userId);
  if (count >= MAX_POSITIONS_PER_USER) {
    return { success: false, error: `Maximum ${MAX_POSITIONS_PER_USER} positions allowed` };
  }

  const { data, error } = await supabase
    .from("portfolios")
    .insert({
      user_id: userId,
      symbol: input.symbol.toUpperCase(),
      shares: input.shares,
      buy_price: input.buyPrice,
      buy_date: input.buyDate || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating position:", error);
    return { success: false, error: "Failed to create position" };
  }

  return { success: true, position: mapRowToPosition(data) };
}

export async function updatePosition(
  positionId: string,
  userId: string,
  updates: UpdatePositionInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (updates.shares !== undefined) updateData.shares = updates.shares;
  if (updates.buyPrice !== undefined) updateData.buy_price = updates.buyPrice;
  if (updates.buyDate !== undefined) updateData.buy_date = updates.buyDate;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

  const { error } = await supabase
    .from("portfolios")
    .update(updateData)
    .eq("id", positionId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating position:", error);
    return { success: false, error: "Failed to update position" };
  }

  return { success: true };
}

export async function deletePosition(
  positionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("portfolios")
    .delete()
    .eq("id", positionId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting position:", error);
    return { success: false, error: "Failed to delete position" };
  }

  return { success: true };
}
