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
        <h1 style="color: #00dc82; font-size: 24px; margin: 0;">Alert Triggered</h1>
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
        View ${alert.symbol}
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
  const action = alert.alertType.includes("above") ? "hit target" : "crossed threshold";
  return `${alert.symbol} ${action}`;
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
