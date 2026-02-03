// app/api/cron/check-alerts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { getAllActiveAlerts, triggerAlert } from "@/lib/alerts";
import {
  generateAlertEmailHtml,
  generateAlertEmailSubject,
  generateAlertEmailText,
} from "@/lib/email-templates";
import { PriceAlert, Stock, StockWithScore } from "@/types";
import { createClient } from "@supabase/supabase-js";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn("CRON_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

function checkAlertCondition(
  alert: PriceAlert,
  stock: Stock,
  valueScore: number
): boolean {
  switch (alert.alertType) {
    case "price_above":
      return stock.price >= alert.threshold;
    case "price_below":
      return stock.price <= alert.threshold;
    case "valuation_above":
      return valueScore >= alert.threshold;
    case "valuation_below":
      return valueScore <= alert.threshold;
    default:
      return false;
  }
}

async function getUserEmailById(userId: string): Promise<string | null> {
  // Use service role client for admin operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase service role credentials");
    return null;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error || !users) {
    console.error("Error fetching user:", error);
    return null;
  }

  const user = users.find((u) => u.id === userId);
  return user?.email || null;
}

async function sendAlertEmail(
  alert: PriceAlert,
  stock: Stock,
  valueScore: number
): Promise<boolean> {
  if (!resend) {
    console.warn("Resend not configured, skipping email");
    return false;
  }

  const email = await getUserEmailById(alert.userId);

  if (!email) {
    console.error(`No email found for user ${alert.userId}`);
    return false;
  }

  try {
    await resend.emails.send({
      from: "StockPulse <alerts@stockpulse.app>",
      to: email,
      subject: generateAlertEmailSubject(alert),
      html: generateAlertEmailHtml(alert, stock, valueScore),
      text: generateAlertEmailText(alert, stock, valueScore),
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log("[Cron] Starting alert check");

    // Get all active alerts
    const alerts = await getAllActiveAlerts();
    console.log(`[Cron] Found ${alerts.length} active alerts`);

    if (alerts.length === 0) {
      return NextResponse.json({
        success: true,
        alertsChecked: 0,
        alertsTriggered: 0,
        durationMs: Date.now() - startTime,
      });
    }

    // Get unique symbols
    const symbols = [...new Set(alerts.map((a) => a.symbol))];
    console.log(`[Cron] Fetching ${symbols.length} unique symbols`);

    // Fetch stock data
    const stocks = await getMultipleQuotes(symbols);
    const stockMap = new Map<string, StockWithScore>();

    for (const stock of stocks) {
      const scored = calculateValueScore(stock);
      stockMap.set(stock.symbol, scored);
    }

    // Check each alert
    let triggeredCount = 0;
    let emailsSent = 0;

    for (const alert of alerts) {
      const stock = stockMap.get(alert.symbol);
      if (!stock) {
        console.warn(`[Cron] No data for symbol ${alert.symbol}`);
        continue;
      }

      const triggered = checkAlertCondition(alert, stock, stock.valueScore);

      if (triggered) {
        console.log(`[Cron] Alert triggered: ${alert.id} (${alert.symbol})`);

        // Send email
        const emailSent = await sendAlertEmail(alert, stock, stock.valueScore);
        if (emailSent) emailsSent++;

        // Update alert status
        const currentValue = alert.alertType.startsWith("price_")
          ? stock.price
          : stock.valueScore;
        await triggerAlert(alert.id, currentValue);

        triggeredCount++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron] Completed in ${duration}ms. Triggered: ${triggeredCount}, Emails: ${emailsSent}`);

    return NextResponse.json({
      success: true,
      alertsChecked: alerts.length,
      alertsTriggered: triggeredCount,
      emailsSent,
      durationMs: duration,
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json(
      { error: "Failed to check alerts", details: String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
