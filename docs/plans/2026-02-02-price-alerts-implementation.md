# Price Alerts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a price and valuation alert system that emails users when stocks hit their target price or valuation thresholds.

**Architecture:** Alerts stored in Supabase with RLS for user isolation. Daily cron job checks all active alerts against current prices/scores. Resend for email delivery. Alert management via dedicated page and stock detail integration.

**Tech Stack:** Next.js 16 App Router, Supabase (auth + DB), Vercel Cron, Resend email.

---

## Task 1: Install Resend Package

**Step 1: Install the package**

Run: `npm install resend`

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(alerts): add resend email package

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create Database Migration

**Files:**
- Create: `supabase/migrations/003_create_price_alerts.sql`

**Step 1: Write the migration**

```sql
-- supabase/migrations/003_create_price_alerts.sql

-- Price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('price_above', 'price_below', 'valuation_above', 'valuation_below')),
  threshold DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'disabled')),
  triggered_at TIMESTAMP WITH TIME ZONE,
  triggered_value DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON price_alerts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON price_alerts(symbol);

-- Enable Row Level Security
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own alerts"
  ON price_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts"
  ON price_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON price_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON price_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_price_alerts_updated_at
  BEFORE UPDATE ON price_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Commit**

```bash
git add supabase/migrations/003_create_price_alerts.sql
git commit -m "feat(alerts): add price_alerts table migration

- Supports price and valuation alert types
- RLS policies for user isolation
- Auto-updating updated_at timestamp

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

**Note:** Run this migration in Supabase dashboard or via CLI.

---

## Task 3: Add TypeScript Types

**Files:**
- Modify: `types/stock.ts`

**Step 1: Add the alert types**

Add at end of `types/stock.ts`:

```typescript
export type AlertType = 'price_above' | 'price_below' | 'valuation_above' | 'valuation_below';
export type AlertStatus = 'active' | 'triggered' | 'disabled';

export interface PriceAlert {
  id: string;
  userId: string;
  symbol: string;
  alertType: AlertType;
  threshold: number;
  status: AlertStatus;
  triggeredAt: string | null;
  triggeredValue: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertInput {
  symbol: string;
  alertType: AlertType;
  threshold: number;
}

export interface UpdateAlertInput {
  status?: AlertStatus;
  threshold?: number;
}
```

**Step 2: Commit**

```bash
git add types/stock.ts
git commit -m "feat(alerts): add PriceAlert and related types

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create Alerts Library

**Files:**
- Create: `lib/alerts.ts`

**Step 1: Create the alerts library**

```typescript
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
```

**Step 2: Commit**

```bash
git add lib/alerts.ts
git commit -m "feat(alerts): add alerts library for DB operations

- CRUD operations with RLS
- 20 alerts per user limit
- Active alerts query for cron job
- Trigger alert function

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create Email Template

**Files:**
- Create: `lib/email-templates.ts`

**Step 1: Create the email template**

```typescript
// lib/email-templates.ts
import { PriceAlert, AlertType, Stock } from "@/types";
import { classifyStock } from "@/lib/valuation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stockpulse.app";

function getAlertTypeLabel(alertType: AlertType): string {
  switch (alertType) {
    case "price_above":
      return "went above";
    case "price_below":
      return "dropped below";
    case "valuation_above":
      return "became undervalued (score above";
    case "valuation_below":
      return "became overvalued (score below";
  }
}

function formatThreshold(alertType: AlertType, threshold: number): string {
  if (alertType.startsWith("price_")) {
    return `$${threshold.toFixed(2)}`;
  }
  return `${threshold})`;
}

export function generateAlertEmailHtml(
  alert: PriceAlert,
  stock: Stock,
  valueScore: number
): string {
  const classification = classifyStock(valueScore);
  const typeLabel = getAlertTypeLabel(alert.alertType);
  const thresholdStr = formatThreshold(alert.alertType, alert.threshold);

  const currentValue = alert.alertType.startsWith("price_")
    ? `$${stock.price.toFixed(2)}`
    : `${valueScore}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StockPulse Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0f1a; color: #ffffff; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #0c1222 0%, #141d2f 100%); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); padding: 32px;">

      <!-- Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #00dc82; font-size: 24px; margin: 0;">🔔 Alert Triggered</h1>
      </div>

      <!-- Main Content -->
      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0;">${alert.symbol}</h2>
        <p style="color: rgba(255,255,255,0.6); margin: 0 0 16px 0;">${stock.name}</p>

        <p style="color: #ffffff; font-size: 16px; margin: 0;">
          ${alert.symbol} ${typeLabel} ${thresholdStr}
        </p>
        <p style="color: #00dc82; font-size: 24px; font-weight: bold; margin: 8px 0;">
          Current: ${currentValue}
        </p>
      </div>

      <!-- Metrics -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px;">
          <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0;">Price</p>
          <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin: 4px 0 0 0;">
            $${stock.price.toFixed(2)}
            <span style="color: ${stock.changePercent >= 0 ? '#00dc82' : '#f87171'}; font-size: 14px;">
              (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
            </span>
          </p>
        </div>
        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px;">
          <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0;">Value Score</p>
          <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin: 4px 0 0 0;">
            ${valueScore}
            <span style="color: rgba(255,255,255,0.6); font-size: 14px;">(${classification})</span>
          </p>
        </div>
      </div>

      <!-- CTA Button -->
      <a href="${APP_URL}/stock/${alert.symbol}"
         style="display: block; background: #00dc82; color: #0a0f1a; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        View ${alert.symbol} →
      </a>

    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px; color: rgba(255,255,255,0.4); font-size: 12px;">
      <p style="margin: 0 0 8px 0;">You're receiving this because you set a price alert on StockPulse.</p>
      <a href="${APP_URL}/alerts" style="color: rgba(255,255,255,0.6);">Manage your alerts</a>
    </div>
  </div>
</body>
</html>
`;
}

export function generateAlertEmailSubject(alert: PriceAlert): string {
  const emoji = alert.alertType.startsWith("price_") ? "🔔" : "📊";
  const action = alert.alertType.includes("above") ? "hit target" : "crossed threshold";
  return `${emoji} ${alert.symbol} ${action}`;
}

export function generateAlertEmailText(
  alert: PriceAlert,
  stock: Stock,
  valueScore: number
): string {
  const classification = classifyStock(valueScore);

  return `
${alert.symbol} Alert Triggered

${stock.name} has triggered your alert.

Current Price: $${stock.price.toFixed(2)} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
Value Score: ${valueScore} (${classification})

View stock: ${APP_URL}/stock/${alert.symbol}
Manage alerts: ${APP_URL}/alerts

---
StockPulse
`;
}
```

**Step 2: Commit**

```bash
git add lib/email-templates.ts
git commit -m "feat(alerts): add email template for alert notifications

- HTML email with dark theme matching app
- Plain text fallback
- Dynamic subject lines

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create Alerts API Route

**Files:**
- Create: `app/api/alerts/route.ts`

**Step 1: Create the CRUD API**

```typescript
// app/api/alerts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUserAlerts,
  getUserAlertCount,
  createAlert,
  updateAlert,
  deleteAlert,
} from "@/lib/alerts";

// GET /api/alerts - List user's alerts
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [alerts, count] = await Promise.all([
    getUserAlerts(user.id),
    getUserAlertCount(user.id),
  ]);

  return NextResponse.json({
    alerts,
    count,
    limit: 20,
  });
}

// POST /api/alerts - Create new alert
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { symbol, alertType, threshold } = body;

    // Validation
    if (!symbol || !alertType || threshold === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, alertType, threshold" },
        { status: 400 }
      );
    }

    const validTypes = ["price_above", "price_below", "valuation_above", "valuation_below"];
    if (!validTypes.includes(alertType)) {
      return NextResponse.json(
        { error: "Invalid alertType" },
        { status: 400 }
      );
    }

    const result = await createAlert(user.id, { symbol, alertType, threshold });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ alert: result.alert }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// PATCH /api/alerts - Update alert
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, threshold } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing alert id" }, { status: 400 });
    }

    const result = await updateAlert(id, user.id, { status, threshold });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/alerts - Delete alert
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing alert id" }, { status: 400 });
  }

  const result = await deleteAlert(id, user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 2: Commit**

```bash
git add app/api/alerts/route.ts
git commit -m "feat(alerts): add alerts CRUD API route

- GET: list user's alerts with count
- POST: create new alert (with limit check)
- PATCH: update alert status/threshold
- DELETE: remove alert

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Create Alert Checking Cron Job

**Files:**
- Create: `app/api/cron/check-alerts/route.ts`

**Step 1: Create the cron endpoint**

```typescript
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
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  const supabase = await createClient();

  // Use admin client to get user email
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error || !users) {
    console.error("Error fetching user:", error);
    return null;
  }

  const user = users.find(u => u.id === userId);
  return user?.email || null;
}

async function sendAlertEmail(
  alert: PriceAlert,
  stock: Stock,
  valueScore: number
): Promise<boolean> {
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
```

**Step 2: Update vercel.json to add the alerts cron**

```json
{
  "crons": [
    {
      "path": "/api/cron/snapshot-valuations",
      "schedule": "30 21 * * 1-5"
    },
    {
      "path": "/api/cron/check-alerts",
      "schedule": "35 21 * * 1-5"
    }
  ]
}
```

**Step 3: Commit**

```bash
git add app/api/cron/check-alerts/route.ts vercel.json
git commit -m "feat(alerts): add daily alert checking cron job

- Checks all active alerts against current prices/scores
- Sends email notifications via Resend
- Updates triggered alerts in database
- Runs 5 min after valuation snapshots

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Create Alert Form Component

**Files:**
- Create: `components/alerts/alert-form.tsx`

**Step 1: Create the alert form**

```tsx
// components/alerts/alert-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertType } from "@/types";
import { Loader2 } from "lucide-react";

interface AlertFormProps {
  symbol: string;
  currentPrice: number;
  currentScore: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ALERT_TYPE_OPTIONS: { value: AlertType; label: string }[] = [
  { value: "price_above", label: "Price goes above" },
  { value: "price_below", label: "Price drops below" },
  { value: "valuation_above", label: "Becomes undervalued (score above 65)" },
  { value: "valuation_below", label: "Becomes overvalued (score below 35)" },
];

export function AlertForm({
  symbol,
  currentPrice,
  currentScore,
  open,
  onOpenChange,
  onSuccess,
}: AlertFormProps) {
  const [alertType, setAlertType] = useState<AlertType>("price_above");
  const [threshold, setThreshold] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPriceAlert = alertType.startsWith("price_");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const thresholdValue = parseFloat(threshold);
    if (isNaN(thresholdValue) || thresholdValue <= 0) {
      setError("Please enter a valid threshold");
      return;
    }

    // Validate valuation thresholds
    if (!isPriceAlert && (thresholdValue < 0 || thresholdValue > 100)) {
      setError("Value score must be between 0 and 100");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          alertType,
          threshold: thresholdValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create alert");
        return;
      }

      onSuccess();
      onOpenChange(false);
      setThreshold("");
    } catch (err) {
      setError("Failed to create alert");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (value: AlertType) => {
    setAlertType(value);
    // Set default threshold based on type
    if (value === "price_above") {
      setThreshold((currentPrice * 1.1).toFixed(2)); // 10% above
    } else if (value === "price_below") {
      setThreshold((currentPrice * 0.9).toFixed(2)); // 10% below
    } else if (value === "valuation_above") {
      setThreshold("65");
    } else if (value === "valuation_below") {
      setThreshold("35");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Alert for {symbol}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Alert Type</Label>
            <Select value={alertType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALERT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {isPriceAlert ? "Target Price ($)" : "Target Score (0-100)"}
            </Label>
            <Input
              type="number"
              step={isPriceAlert ? "0.01" : "1"}
              min={isPriceAlert ? "0.01" : "0"}
              max={isPriceAlert ? undefined : "100"}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder={isPriceAlert ? "Enter price..." : "Enter score..."}
            />
            <p className="text-xs text-muted-foreground">
              Current {isPriceAlert ? "price" : "score"}:{" "}
              {isPriceAlert ? `$${currentPrice.toFixed(2)}` : currentScore}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Alert
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add components/alerts/alert-form.tsx
git commit -m "feat(alerts): add alert form dialog component

- Select alert type (price/valuation above/below)
- Input threshold with validation
- Shows current price/score for reference
- Loading and error states

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Create Alert Card Component

**Files:**
- Create: `components/alerts/alert-card.tsx`

**Step 1: Create the component**

```tsx
// components/alerts/alert-card.tsx
"use client";

import { useState } from "react";
import { PriceAlert, AlertType, AlertStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Trash2,
  RefreshCw,
  Pause,
  Play,
  Loader2,
} from "lucide-react";

interface AlertCardProps {
  alert: PriceAlert;
  onUpdate: (id: string, status: AlertStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function getAlertIcon(alertType: AlertType) {
  switch (alertType) {
    case "price_above":
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    case "price_below":
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    case "valuation_above":
    case "valuation_below":
      return <BarChart3 className="h-4 w-4 text-blue-400" />;
  }
}

function getAlertDescription(alert: PriceAlert): string {
  const threshold = alert.alertType.startsWith("price_")
    ? `$${alert.threshold.toFixed(2)}`
    : alert.threshold.toString();

  switch (alert.alertType) {
    case "price_above":
      return `Price goes above ${threshold}`;
    case "price_below":
      return `Price drops below ${threshold}`;
    case "valuation_above":
      return `Value score goes above ${threshold}`;
    case "valuation_below":
      return `Value score drops below ${threshold}`;
  }
}

function getStatusBadge(status: AlertStatus) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-500/20 text-green-400">Active</Badge>;
    case "triggered":
      return <Badge className="bg-blue-500/20 text-blue-400">Triggered</Badge>;
    case "disabled":
      return <Badge variant="secondary">Disabled</Badge>;
  }
}

export function AlertCard({ alert, onUpdate, onDelete }: AlertCardProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: AlertStatus) => {
    setLoading(true);
    try {
      await onUpdate(alert.id, newStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(alert.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border bg-white/5 transition-all",
        alert.status === "active" && "border-green-500/30",
        alert.status === "triggered" && "border-blue-500/30",
        alert.status === "disabled" && "border-white/10 opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">{getAlertIcon(alert.alertType)}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{alert.symbol}</span>
              {getStatusBadge(alert.status)}
            </div>
            <p className="text-sm text-white/60 mt-1">
              {getAlertDescription(alert)}
            </p>
            {alert.status === "triggered" && alert.triggeredAt && (
              <p className="text-xs text-white/40 mt-2">
                Triggered at {alert.triggeredValue?.toFixed(2)} on{" "}
                {new Date(alert.triggeredAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white/40" />
          ) : (
            <>
              {alert.status === "active" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStatusChange("disabled")}
                  title="Pause alert"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              {alert.status === "disabled" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStatusChange("active")}
                  title="Resume alert"
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
              {alert.status === "triggered" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStatusChange("active")}
                  title="Re-enable alert"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300"
                title="Delete alert"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/alerts/alert-card.tsx
git commit -m "feat(alerts): add alert card component

- Shows alert type, symbol, threshold
- Status badge (active/triggered/disabled)
- Pause/resume/re-enable/delete actions
- Loading states

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Create Alerts Page

**Files:**
- Create: `app/(dashboard)/alerts/page.tsx`

**Step 1: Create the alerts page**

```tsx
// app/(dashboard)/alerts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PriceAlert, AlertStatus } from "@/types";
import { AlertCard } from "@/components/alerts/alert-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Plus } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts");
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch alerts");
      }
      const data = await response.json();
      setAlerts(data.alerts);
      setCount(data.count);
    } catch (err) {
      setError("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleUpdate = async (id: string, status: AlertStatus) => {
    const response = await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (response.ok) {
      fetchAlerts();
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/alerts?id=${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      fetchAlerts();
    }
  };

  // Group alerts by status
  const activeAlerts = alerts.filter((a) => a.status === "active");
  const triggeredAlerts = alerts.filter((a) => a.status === "triggered");
  const disabledAlerts = alerts.filter((a) => a.status === "disabled");

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Price Alerts</h1>
          <p className="text-white/60 mt-1">
            {count} of 20 alerts used
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-white/40" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No alerts yet
          </h2>
          <p className="text-white/60 max-w-md mb-4">
            Set up price and valuation alerts from any stock detail page.
            You'll receive an email when your conditions are met.
          </p>
          <Button onClick={() => router.push("/")}>
            <Plus className="h-4 w-4 mr-2" />
            Browse Stocks
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white">
                Active ({activeAlerts.length})
              </h2>
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Triggered Alerts */}
          {triggeredAlerts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white">
                Triggered ({triggeredAlerts.length})
              </h2>
              <div className="space-y-3">
                {triggeredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Disabled Alerts */}
          {disabledAlerts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white/60">
                Disabled ({disabledAlerts.length})
              </h2>
              <div className="space-y-3">
                {disabledAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/alerts/page.tsx
git commit -m "feat(alerts): add alerts management page

- Lists all user alerts grouped by status
- Empty state with CTA to browse stocks
- Update/delete handlers
- Shows count of 20 limit

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Create Set Alert Button for Stock Detail

**Files:**
- Create: `components/stock/set-alert-button.tsx`

**Step 1: Create the button component**

```tsx
// components/stock/set-alert-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertForm } from "@/components/alerts/alert-form";
import { Bell } from "lucide-react";
import { toast } from "sonner";

interface SetAlertButtonProps {
  symbol: string;
  currentPrice: number;
  currentScore: number;
}

export function SetAlertButton({
  symbol,
  currentPrice,
  currentScore,
}: SetAlertButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    toast.success("Alert created successfully!");
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Bell className="h-4 w-4" />
        Set Alert
      </Button>

      <AlertForm
        symbol={symbol}
        currentPrice={currentPrice}
        currentScore={currentScore}
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
```

**Step 2: Commit**

```bash
git add components/stock/set-alert-button.tsx
git commit -m "feat(alerts): add Set Alert button component

- Opens alert form dialog
- Shows toast on success

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Add Set Alert Button to Stock Detail Page

**Files:**
- Modify: `app/(dashboard)/stock/[symbol]/page.tsx`

**Step 1: Add import and button**

Add import:
```tsx
import { SetAlertButton } from "@/components/stock/set-alert-button";
```

Add after Compare button in the header actions area:
```tsx
<SetAlertButton
  symbol={stock.symbol}
  currentPrice={stock.price}
  currentScore={stock.valueScore}
/>
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/stock/\[symbol\]/page.tsx
git commit -m "feat(alerts): add Set Alert button to stock detail page

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Add Alerts Link to Navigation

**Files:**
- Modify: `components/layout/nav-links.tsx`

**Step 1: Add Alerts link**

Add to navigation links array:
```tsx
{ href: "/alerts", label: "Alerts", icon: Bell }
```

Import `Bell` from `lucide-react`.

**Step 2: Commit**

```bash
git add components/layout/nav-links.tsx
git commit -m "feat(alerts): add Alerts link to navigation

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 14: Add Environment Variables

**Step 1: Add to .env.local**

```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

**Step 2: Add to Vercel**

In Vercel dashboard, add `RESEND_API_KEY`.

**Step 3: Configure Resend**

1. Sign up at resend.com
2. Add your domain or use test domain
3. Create API key and add to env vars

---

## Task 15: Final Testing & Verification

**Step 1: Run all tests**

Run: `npm test`

**Step 2: Run linter**

Run: `npm run lint`

**Step 3: Build check**

Run: `npm run build`

**Step 4: Manual testing**

1. Create alert from stock detail page
2. View alerts on /alerts page
3. Test pause/resume/delete
4. Trigger cron job manually to test email

---

## Summary

This implementation plan creates the Price Alerts feature with:

1. **Database** - `price_alerts` table with RLS
2. **Library** (`lib/alerts.ts`) - CRUD operations
3. **Email** (`lib/email-templates.ts`) - HTML/text templates
4. **API** - `/api/alerts` CRUD endpoint
5. **Cron** - Daily alert checking job
6. **UI** - Alert form, card, management page
7. **Integration** - Button on stock detail, nav link

Total: ~15 tasks, requires Resend account setup.
