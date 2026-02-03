// lib/gemini.ts
import { InsightInputData } from "@/types";

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

function buildPrompt(symbol: string, name: string, data: InsightInputData): string {
  const positionPercent = data.week52High > data.week52Low
    ? Math.round(((data.price - data.week52Low) / (data.week52High - data.week52Low)) * 100)
    : 50;

  return `You are a stock analyst assistant. Generate a concise insight for ${symbol} (${name}).

Current data:
- Price: $${data.price.toFixed(2)} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}% today)
- Value Score: ${data.valueScore}/100 (${data.classification})
- P/E Ratio: ${data.peRatio?.toFixed(1) ?? 'N/A'}
- P/B Ratio: ${data.pbRatio?.toFixed(1) ?? 'N/A'}
- PEG Ratio: ${data.pegRatio?.toFixed(1) ?? 'N/A'}
- 52-week range: $${data.week52Low.toFixed(2)} - $${data.week52High.toFixed(2)} (currently at ${positionPercent}%)
- Sector: ${data.sector}

Write a brief analysis (150-200 words total) with these exact sections:

SUMMARY: (1-2 sentences) Is this stock undervalued, fairly valued, or overvalued and why?

VALUATION_ANALYSIS: (2-3 sentences) Explain the key metrics driving the score.

RECENT_PERFORMANCE: (1-2 sentences) Context on where price sits in 52-week range.

KEY_CONSIDERATIONS:
- (First bullet point about a risk or opportunity)
- (Second bullet point)
- (Third bullet point if relevant)

Be objective and data-driven. Avoid hype or recommendations to buy/sell. Use the exact section headers shown above.`;
}

function parseGeminiResponse(text: string): GeneratedInsight {
  // Parse the structured response
  const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*?)(?=VALUATION_ANALYSIS:|$)/i);
  const valuationMatch = text.match(/VALUATION_ANALYSIS:\s*([\s\S]*?)(?=RECENT_PERFORMANCE:|$)/i);
  const performanceMatch = text.match(/RECENT_PERFORMANCE:\s*([\s\S]*?)(?=KEY_CONSIDERATIONS:|$)/i);
  const considerationsMatch = text.match(/KEY_CONSIDERATIONS:\s*([\s\S]*?)$/i);

  const summary = summaryMatch?.[1]?.trim() || "Analysis unavailable.";
  const valuationAnalysis = valuationMatch?.[1]?.trim() || "";
  const recentPerformance = performanceMatch?.[1]?.trim() || "";

  // Parse bullet points
  const considerationsText = considerationsMatch?.[1] || "";
  const keyConsiderations = considerationsText
    .split(/\n/)
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(line => line.length > 0)
    .slice(0, 3);

  return {
    summary,
    valuationAnalysis,
    recentPerformance,
    keyConsiderations: keyConsiderations.length > 0 ? keyConsiderations : ["No specific considerations identified."],
  };
}

export async function generateInsight(
  symbol: string,
  name: string,
  data: InsightInputData
): Promise<GeneratedInsight> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const prompt = buildPrompt(symbol, name, data);

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
