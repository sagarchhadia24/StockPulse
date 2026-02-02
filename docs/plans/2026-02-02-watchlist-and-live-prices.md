# Watchlist & Live Prices Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add database migration for watchlist and implement live price updates via polling

**Architecture:** Watchlist uses Supabase with RLS policies. Live prices use a custom React hook that polls the API every 30 seconds, pausing when the tab is hidden.

**Tech Stack:** Next.js 16, React 19, Supabase, TypeScript

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Database migration | `supabase/migrations/001_create_watchlist.sql` |
| 2 | LiveIndicator component | `components/ui/live-indicator.tsx` |
| 3 | useLivePrices hooks | `hooks/use-live-prices.ts` |
| 4 | LiveMarketOverview | `components/dashboard/live-market-overview.tsx` |
| 5 | Dashboard integration | `app/(dashboard)/page.tsx` |
| 6 | LiveStockHeader | `components/stock/live-stock-header.tsx` |
| 7 | Stock detail integration | `app/(dashboard)/stock/[symbol]/page.tsx` |
| 8 | Watchlist live prices | `app/(dashboard)/watchlist/page.tsx` |
| 9 | Hooks index | `hooks/index.ts` |
| 10 | Verification | N/A |
