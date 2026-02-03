/**
 * Calculate Year-to-Date percentage change
 * Uses the first trading day of the current year as baseline
 */
export function calculateYTDChange(
  history: { date: string; price: number }[],
  currentPrice: number
): number | null {
  if (history.length === 0) return null;

  const currentYear = new Date().getFullYear();

  // Find first date in current year
  const ytdHistory = history
    .filter((h) => new Date(h.date).getFullYear() === currentYear)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (ytdHistory.length === 0) return null;

  const startPrice = ytdHistory[0].price;
  if (startPrice === 0) return null;

  const change = ((currentPrice - startPrice) / startPrice) * 100;
  return Math.round(change * 100) / 100;
}

/**
 * Find index of stock with best (highest) value score
 */
export function findBestValue(scores: number[]): number {
  if (scores.length === 0) return -1;

  let bestIndex = 0;
  let bestScore = scores[0];

  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestIndex = i;
    }
  }

  return bestIndex;
}

/**
 * Find index of best metric value (handling nulls)
 * @param mode "lowest" for P/E, P/B, PEG; "highest" for dividend yield
 */
export function getBestMetric(
  values: (number | null)[],
  mode: "lowest" | "highest"
): number {
  let bestIndex = -1;
  let bestValue: number | null = null;

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value === null) continue;

    if (bestValue === null) {
      bestValue = value;
      bestIndex = i;
    } else if (mode === "lowest" && value < bestValue) {
      bestValue = value;
      bestIndex = i;
    } else if (mode === "highest" && value > bestValue) {
      bestValue = value;
      bestIndex = i;
    }
  }

  return bestIndex;
}
