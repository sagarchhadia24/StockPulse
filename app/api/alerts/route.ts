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
