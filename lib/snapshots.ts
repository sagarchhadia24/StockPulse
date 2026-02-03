// lib/snapshots.ts
import { createClient } from "@/lib/supabase/server";
import { ValuationSnapshot, HistoryDataPoint } from "@/types";

/**
 * Merge price history with valuation snapshots by date
 */
export function mergeHistoryWithSnapshots(
  priceHistory: { date: string; price: number }[],
  snapshots: { snapshotDate: string; valueScore: number }[]
): HistoryDataPoint[] {
  const snapshotMap = new Map(
    snapshots.map((s) => [s.snapshotDate, s.valueScore])
  );

  return priceHistory.map((point) => ({
    date: point.date,
    price: point.price,
    valueScore: snapshotMap.get(point.date) ?? null,
  }));
}

/**
 * Fetch valuation snapshots for a symbol within a date range
 */
export async function getValuationSnapshots(
  symbol: string,
  startDate: Date,
  endDate: Date = new Date()
): Promise<ValuationSnapshot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("valuation_snapshots")
    .select("*")
    .eq("symbol", symbol.toUpperCase())
    .gte("snapshot_date", startDate.toISOString().split("T")[0])
    .lte("snapshot_date", endDate.toISOString().split("T")[0])
    .order("snapshot_date", { ascending: true });

  if (error) {
    console.error("Error fetching valuation snapshots:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    symbol: row.symbol,
    snapshotDate: row.snapshot_date,
    price: parseFloat(row.price),
    valueScore: row.value_score,
    peScore: row.pe_score,
    pbScore: row.pb_score,
    pegScore: row.peg_score,
    weekPositionScore: row.week_position_score,
    createdAt: row.created_at,
  }));
}

/**
 * Save valuation snapshots (used by cron job)
 */
export async function saveValuationSnapshots(
  snapshots: Omit<ValuationSnapshot, "id" | "createdAt">[]
): Promise<{ success: boolean; count: number }> {
  if (snapshots.length === 0) {
    return { success: true, count: 0 };
  }

  const supabase = await createClient();

  const rows = snapshots.map((s) => ({
    symbol: s.symbol.toUpperCase(),
    snapshot_date: s.snapshotDate,
    price: s.price,
    value_score: s.valueScore,
    pe_score: s.peScore,
    pb_score: s.pbScore,
    peg_score: s.pegScore,
    week_position_score: s.weekPositionScore,
  }));

  const { error } = await supabase
    .from("valuation_snapshots")
    .upsert(rows, { onConflict: "symbol,snapshot_date" });

  if (error) {
    console.error("Error saving valuation snapshots:", error);
    return { success: false, count: 0 };
  }

  return { success: true, count: rows.length };
}

/**
 * Get the date of the most recent snapshot
 */
export async function getLatestSnapshotDate(): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("valuation_snapshots")
    .select("snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.snapshot_date;
}
