// lib/alerts.ts
import { createClient } from "@/lib/supabase/server";
import { PriceAlert, AlertType, AlertStatus, CreateAlertInput } from "@/types";

const MAX_ALERTS_PER_USER = 20;

/**
 * Map database row to PriceAlert interface
 */
function mapRowToAlert(row: any): PriceAlert {
  return {
    id: row.id,
    userId: row.user_id,
    symbol: row.symbol,
    alertType: row.alert_type as AlertType,
    threshold: parseFloat(row.threshold),
    status: row.status as AlertStatus,
    triggeredAt: row.triggered_at,
    triggeredValue: row.triggered_value ? parseFloat(row.triggered_value) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all alerts for a user
 */
export async function getUserAlerts(userId: string): Promise<PriceAlert[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }

  return (data || []).map(mapRowToAlert);
}

/**
 * Get user's alert count
 */
export async function getUserAlertCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("price_alerts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error counting alerts:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Create a new alert
 */
export async function createAlert(
  userId: string,
  input: CreateAlertInput
): Promise<{ success: boolean; alert?: PriceAlert; error?: string }> {
  const supabase = await createClient();

  // Check limit
  const count = await getUserAlertCount(userId);
  if (count >= MAX_ALERTS_PER_USER) {
    return { success: false, error: `Maximum ${MAX_ALERTS_PER_USER} alerts allowed` };
  }

  const { data, error } = await supabase
    .from("price_alerts")
    .insert({
      user_id: userId,
      symbol: input.symbol.toUpperCase(),
      alert_type: input.alertType,
      threshold: input.threshold,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating alert:", error);
    return { success: false, error: "Failed to create alert" };
  }

  return { success: true, alert: mapRowToAlert(data) };
}

/**
 * Update an alert
 */
export async function updateAlert(
  alertId: string,
  userId: string,
  updates: { status?: AlertStatus; threshold?: number }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const updateData: any = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.threshold !== undefined) updateData.threshold = updates.threshold;

  // Reset trigger data if re-enabling
  if (updates.status === "active") {
    updateData.triggered_at = null;
    updateData.triggered_value = null;
  }

  const { error } = await supabase
    .from("price_alerts")
    .update(updateData)
    .eq("id", alertId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating alert:", error);
    return { success: false, error: "Failed to update alert" };
  }

  return { success: true };
}

/**
 * Delete an alert
 */
export async function deleteAlert(
  alertId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("price_alerts")
    .delete()
    .eq("id", alertId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting alert:", error);
    return { success: false, error: "Failed to delete alert" };
  }

  return { success: true };
}

/**
 * Get all active alerts (for cron job - uses service role)
 */
export async function getAllActiveAlerts(): Promise<PriceAlert[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("status", "active");

  if (error) {
    console.error("Error fetching active alerts:", error);
    return [];
  }

  return (data || []).map(mapRowToAlert);
}

/**
 * Mark alert as triggered (for cron job)
 */
export async function triggerAlert(
  alertId: string,
  triggeredValue: number
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("price_alerts")
    .update({
      status: "triggered",
      triggered_at: new Date().toISOString(),
      triggered_value: triggeredValue,
    })
    .eq("id", alertId);

  if (error) {
    console.error("Error triggering alert:", error);
    return { success: false };
  }

  return { success: true };
}

/**
 * Get user email by ID (for sending notifications)
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("auth.users")
    .select("email")
    .eq("id", userId)
    .single();

  if (error || !data) {
    // Fallback: try auth.getUser if direct query fails
    return null;
  }

  return data.email;
}
