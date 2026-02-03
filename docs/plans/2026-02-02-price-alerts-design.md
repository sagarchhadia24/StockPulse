# Price Alerts Feature Design

## Overview

A price and valuation alert system that emails users when stocks hit their target price or when valuation scores cross thresholds. Managed via dedicated alerts page and stock detail pages.

## User Experience

### Alert Types

**Price Alerts:**
- "Alert me when AAPL goes above $250"
- "Alert me when AAPL goes below $200"

**Valuation Alerts:**
- "Alert me when AAPL becomes undervalued" (score crosses above 65)
- "Alert me when AAPL becomes overvalued" (score crosses below 35)

### Entry Points

**From Stock Detail (`/stock/[symbol]`):**
- "Set Alert" button in stock header
- Opens modal with alert type selection and threshold input

**Alerts Page (`/alerts`):**
- Lists all user's alerts (active and triggered)
- Create new alert via search + form
- Edit/delete/re-enable existing alerts
- Shows count: "3 of 20 alerts used"

### Alert States

| State | Meaning |
|-------|---------|
| **Active** | Monitoring, waiting to trigger |
| **Triggered** | Condition met, email sent, now inactive |
| **Disabled** | User manually paused (can re-enable) |

### Alert Behavior

- One-time trigger: alert fires once, then becomes inactive
- User can re-enable triggered alerts to monitor again
- 20 alerts per user limit

## Data Storage

### Database Schema

```sql
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  alert_type VARCHAR(20) NOT NULL,  -- 'price_above', 'price_below', 'valuation_above', 'valuation_below'
  threshold DECIMAL(10,2) NOT NULL,  -- price in $ or score (0-100)
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'triggered', 'disabled'
  triggered_at TIMESTAMP WITH TIME ZONE,
  triggered_value DECIMAL(10,2),  -- actual price/score when triggered
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_alerts_status ON price_alerts(status) WHERE status = 'active';
```

## Email Delivery

### Provider

Resend (free tier: 3,000 emails/month)

### Email Template

```
Subject: 🔔 AAPL hit your price target

AAPL reached $251.30, crossing your target of $250.00.

Current metrics:
- Price: $251.30 (+1.2%)
- Value Score: 58 (Fair)

[View AAPL →]

---
You're receiving this because you set a price alert on StockPulse.
[Manage alerts]
```

## Technical Implementation

### Alert Checking Job

Daily cron job (runs after valuation snapshot):

1. Fetch all active alerts from `price_alerts`
2. Group alerts by symbol to minimize API calls
3. For each symbol, get current price and value score
4. Check each alert condition
5. For triggered alerts: send email, update status to 'triggered'

**Endpoint:** `app/api/cron/check-alerts/route.ts`

### File Structure

```
app/(dashboard)/alerts/page.tsx           # Alerts management page
app/api/alerts/route.ts                   # CRUD for alerts
app/api/cron/check-alerts/route.ts        # Daily alert checker
components/alerts/
  alert-form.tsx                          # Create/edit alert modal
  alert-list.tsx                          # List of user's alerts
  alert-card.tsx                          # Single alert display
components/stock/
  set-alert-button.tsx                    # Button + modal on stock page
lib/
  alerts.ts                               # Alert DB queries, email sending
  email-templates.ts                      # Alert email template
supabase/migrations/
  003_create_price_alerts.sql             # New table
```

### New Types

```typescript
type AlertType = 'price_above' | 'price_below' | 'valuation_above' | 'valuation_below';
type AlertStatus = 'active' | 'triggered' | 'disabled';

interface PriceAlert {
  id: string;
  userId: string;
  symbol: string;
  alertType: AlertType;
  threshold: number;
  status: AlertStatus;
  triggeredAt: string | null;
  triggeredValue: number | null;
  createdAt: string;
}
```

## Scope

### In Scope

- Price alerts (above/below target)
- Valuation alerts (becomes undervalued/overvalued)
- Email notifications via Resend
- 20 alerts per user limit
- Daily alert checking (with cron job)
- Alerts page + "Set Alert" on stock detail
- Alert states: active, triggered, disabled

### Out of Scope

- Real-time/15-min alerts (requires paid cron tier)
- Push notifications
- SMS alerts
- Percentage change alerts
- In-app notification center

## Dependencies

- Resend (free tier: 3,000 emails/month) - **new dependency**
- Supabase (existing)
- Vercel Cron (existing, daily)
