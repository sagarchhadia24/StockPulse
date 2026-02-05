// lib/gemini.ts
import { InsightInputData, AnalysisStyle } from "@/types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface GeneratedInsight {
  summary: string;
  valuationAnalysis: string;
  recentPerformance: string;
  keyConsiderations: string[];
}

function formatVsSector(ratio: number | null): string {
  if (ratio === null) return "N/A";
  if (ratio < 0.8) return `${((1 - ratio) * 100).toFixed(0)}% below sector avg`;
  if (ratio > 1.2) return `${((ratio - 1) * 100).toFixed(0)}% above sector avg`;
  return "near sector average";
}

function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1_000_000_000_000) return `$${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
  if (marketCap >= 1_000_000_000) return `$${(marketCap / 1_000_000_000).toFixed(1)}B`;
  return `$${(marketCap / 1_000_000).toFixed(0)}M`;
}

function buildPrompt(symbol: string, name: string, data: InsightInputData, style: AnalysisStyle): string {
  const positionPercent = data.week52High > data.week52Low
    ? Math.round(((data.price - data.week52Low) / (data.week52High - data.week52Low)) * 100)
    : 50;

  const volumeStatus = data.volumeRatio > 1.5
    ? "unusually high volume"
    : data.volumeRatio < 0.5
      ? "unusually low volume"
      : "normal volume";

  const wordCount = style === "detailed" ? "250-350" : "150-200";

  return `You are a stock analyst assistant. Generate a ${style} insight for ${symbol} (${name}).

STOCK DATA (use these exact values):
- Current Price: $${data.price.toFixed(2)} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}% today)
- Market Cap: ${formatMarketCap(data.marketCap)} (${data.marketCapCategory})
- Stock Type: ${data.stockType}
- Value Score: ${data.valueScore}/100 (${data.classification})

VALUATION METRICS vs ${data.sector} SECTOR:
- P/E Ratio: ${data.peRatio?.toFixed(1) ?? 'N/A'} (sector avg: ${data.sectorAvgPE}) - ${formatVsSector(data.peVsSector)}
- P/B Ratio: ${data.pbRatio?.toFixed(1) ?? 'N/A'} (sector avg: ${data.sectorAvgPB}) - ${formatVsSector(data.pbVsSector)}
- P/S Ratio: ${data.psRatio?.toFixed(1) ?? 'N/A'} (sector avg: ${data.sectorAvgPS}) - ${formatVsSector(data.psVsSector)}
- PEG Ratio: ${data.pegRatio?.toFixed(1) ?? 'N/A'}

GROWTH & INCOME:
- Revenue Growth: ${data.revenueGrowth !== null ? `${(data.revenueGrowth * 100).toFixed(1)}%` : 'N/A'}
- Dividend Yield: ${data.dividendYield !== null ? `${data.dividendYield.toFixed(2)}%` : 'N/A'}

TRADING DATA:
- 52-week range: $${data.week52Low.toFixed(2)} - $${data.week52High.toFixed(2)}
- Current position: ${positionPercent}% of 52-week range (price: $${data.price.toFixed(2)})
- Volume: ${volumeStatus} (${data.volumeRatio.toFixed(1)}x average)

DATA QUALITY: ${data.dataCompleteness}% of metrics available

Write a brief analysis (${wordCount} words total) with these exact sections:

SUMMARY: (1-2 sentences) Is this stock undervalued, fairly valued, or overvalued based on the ${data.valueScore}/100 Value Score and why?

VALUATION_ANALYSIS: (2-3 sentences) Compare key metrics to sector averages. Explain what's driving the valuation assessment.

RECENT_PERFORMANCE: (1-2 sentences) The stock is trading at $${data.price.toFixed(2)}, which is ${positionPercent}% of its 52-week range ($${data.week52Low.toFixed(2)} - $${data.week52High.toFixed(2)}). Add context about this positioning.

KEY_CONSIDERATIONS:
- (First bullet: main risk or opportunity based on the data)
- (Second bullet: sector comparison insight)
- (Third bullet: trading/volume observation or growth outlook)

IMPORTANT RULES:
1. Use the EXACT numerical values provided above - do not round, truncate, or modify any prices or metrics
2. The current price is $${data.price.toFixed(2)} - use this exact value when mentioning price
3. Be objective and data-driven based on the metrics provided
4. Avoid hype or recommendations to buy/sell
5. Use the exact section headers shown above`;
}

function parseGeminiResponse(text: string): GeneratedInsight {
  // Normalize text - handle various formatting issues
  const normalizedText = text
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/\r\n/g, '\n') // Normalize line endings
    .trim();

  // Parse the structured response with flexible matching
  const summaryMatch = normalizedText.match(/(?:^|\n)\s*\*?\*?SUMMARY\*?\*?:?\s*([\s\S]*?)(?=\n\s*\*?\*?VALUATION|$)/i);
  const valuationMatch = normalizedText.match(/(?:^|\n)\s*\*?\*?VALUATION[_\s]?ANALYSIS\*?\*?:?\s*([\s\S]*?)(?=\n\s*\*?\*?RECENT|$)/i);
  const performanceMatch = normalizedText.match(/(?:^|\n)\s*\*?\*?RECENT[_\s]?PERFORMANCE\*?\*?:?\s*([\s\S]*?)(?=\n\s*\*?\*?KEY|$)/i);
  const considerationsMatch = normalizedText.match(/(?:^|\n)\s*\*?\*?KEY[_\s]?CONSIDERATIONS\*?\*?:?\s*([\s\S]*?)$/i);

  const summary = summaryMatch?.[1]?.trim() || "Analysis unavailable.";
  const valuationAnalysis = valuationMatch?.[1]?.trim() || "";
  const recentPerformance = performanceMatch?.[1]?.trim() || "";

  // Parse bullet points with flexible matching
  const considerationsText = considerationsMatch?.[1] || "";
  const keyConsiderations = considerationsText
    .split(/\n/)
    .map(line => line
      .replace(/^\s*[-•*]\s*/, '')
      .replace(/^\s*\d+[.)]\s*/, '')
      .replace(/^\s*\*\*/, '')
      .replace(/\*\*\s*$/, '')
      .trim()
    )
    .filter(line => line.length > 5)
    .slice(0, 5);

  // Fallback if no considerations found
  let finalConsiderations = keyConsiderations;
  if (finalConsiderations.length === 0) {
    const bulletMatches = normalizedText.match(/(?:^|\n)\s*[-•*]\s*(.+)/gm);
    if (bulletMatches) {
      finalConsiderations = bulletMatches
        .map(match => match.replace(/^\s*[-•*]\s*/, '').trim())
        .filter(line => line.length > 10)
        .slice(-3);
    }
  }

  return {
    summary,
    valuationAnalysis,
    recentPerformance,
    keyConsiderations: finalConsiderations.length > 0
      ? finalConsiderations
      : ["Analysis based on current valuation metrics and market position."],
  };
}

export async function generateInsight(
  symbol: string,
  name: string,
  data: InsightInputData,
  style: AnalysisStyle = "concise"
): Promise<GeneratedInsight> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const prompt = buildPrompt(symbol, name, data, style);

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Gemini API error:", error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result: GeminiResponse = await response.json();

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No response from Gemini");
  }

  return parseGeminiResponse(text);
}
