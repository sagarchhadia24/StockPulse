// app/api/portfolio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUserPositions,
  createPosition,
  updatePosition,
  deletePosition,
} from "@/lib/portfolio";
import { getMultipleQuotes, SYMBOL_SECTORS } from "@/lib/yahoo-finance";

// GET /api/portfolio - List user's positions with live market data
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const positions = await getUserPositions(user.id);

  if (positions.length === 0) {
    return NextResponse.json({
      positions: [],
      summary: {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        positionCount: 0,
      },
    });
  }

  // Fetch live prices for all symbols
  const symbols = [...new Set(positions.map((p) => p.symbol))];
  const quotes = await getMultipleQuotes(symbols);
  const priceMap = new Map(quotes.map((q) => [q.symbol, q]));

  // Enrich positions with market data
  const enrichedPositions = positions.map((pos) => {
    const quote = priceMap.get(pos.symbol);
    const currentPrice = quote?.price ?? pos.buyPrice;
    const currentValue = currentPrice * pos.shares;
    const cost = pos.buyPrice * pos.shares;

    return {
      ...pos,
      currentPrice,
      currentValue,
      gain: currentValue - cost,
      gainPercent: cost > 0 ? ((currentValue - cost) / cost) * 100 : 0,
      dayChange: quote?.changePercent ?? 0,
      sector: SYMBOL_SECTORS[pos.symbol] || "Technology",
    };
  });

  // Calculate summary
  const totalValue = enrichedPositions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalCost = enrichedPositions.reduce((sum, p) => sum + p.buyPrice * p.shares, 0);

  return NextResponse.json({
    positions: enrichedPositions,
    summary: {
      totalValue,
      totalCost,
      totalGain: totalValue - totalCost,
      totalGainPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      positionCount: positions.length,
    },
  });
}

// POST /api/portfolio - Add new position
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { symbol, shares, buyPrice, buyDate, notes } = body;

    if (!symbol || !shares || !buyPrice) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, shares, buyPrice" },
        { status: 400 }
      );
    }

    if (shares <= 0 || buyPrice <= 0) {
      return NextResponse.json(
        { error: "Shares and buy price must be positive" },
        { status: 400 }
      );
    }

    const result = await createPosition(user.id, {
      symbol,
      shares,
      buyPrice,
      buyDate,
      notes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ position: result.position }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// PATCH /api/portfolio - Update position
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, shares, buyPrice, buyDate, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing position id" }, { status: 400 });
    }

    const result = await updatePosition(id, user.id, {
      shares,
      buyPrice,
      buyDate,
      notes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/portfolio - Delete position
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing position id" }, { status: 400 });
  }

  const result = await deletePosition(id, user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
