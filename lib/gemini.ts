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
  // Normalize text - handle various formatting issues
  const normalizedText = text
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/\r\n/g, '\n') // Normalize line endings
    .trim();

  // Parse the structured response with flexible matching
  // Support variations like "SUMMARY:", "**SUMMARY:**", "Summary:", etc.
  const summaryMatch = normalizedText.match(/(?:^|\n)\s*\*?\*?SUMMARY\*?\*?:?\s*([\s\S]*?)(?=\n\s*\*?\*?VALUATION|$)/i);
  const valuationMatch = normalizedText.match(/(?:^|\n)\s*\*?\*?VALUATION[_\s]?ANALYSIS\*?\*?:?\s*([\s\S]*?)(?=\n\s*\*?\*?RECENT|$)/i);
  const performanceMatch = normalizedText.match(/(?:^|\n)\s*\*?\*?RECENT[_\s]?PERFORMANCE\*?\*?:?\s*([\s\S]*?)(?=\n\s*\*?\*?KEY|$)/i);
  const considerationsMatch = normalizedText.match(/(?:^|\n)\s*\*?\*?KEY[_\s]?CONSIDERATIONS\*?\*?:?\s*([\s\S]*?)$/i);

  const summary = summaryMatch?.[1]?.trim() || "Analysis unavailable.";
  const valuationAnalysis = valuationMatch?.[1]?.trim() || "";
  const recentPerformance = performanceMatch?.[1]?.trim() || "";

  // Parse bullet points with flexible matching
  // Support: -, *, •, numbered lists (1., 1), etc.
  const considerationsText = considerationsMatch?.[1] || "";
  const keyConsiderations = considerationsText
    .split(/\n/)
    .map(line => line
      .replace(/^\s*[-•*]\s*/, '') // Bullet points
      .replace(/^\s*\d+[.)]\s*/, '') // Numbered lists
      .replace(/^\s*\*\*/, '') // Bold markers at start
      .replace(/\*\*\s*$/, '') // Bold markers at end
      .trim()
    )
    .filter(line => line.length > 5) // Filter out empty or very short lines
    .slice(0, 5); // Allow up to 5 considerations

  // If no considerations found, try to extract any bullet-like content from the whole response
  let finalConsiderations = keyConsiderations;
  if (finalConsiderations.length === 0) {
    // Fallback: look for any bullet points in the entire text
    const bulletMatches = normalizedText.match(/(?:^|\n)\s*[-•*]\s*(.+)/gm);
    if (bulletMatches) {
      finalConsiderations = bulletMatches
        .map(match => match.replace(/^\s*[-•*]\s*/, '').trim())
        .filter(line => line.length > 10)
        .slice(-3); // Take last 3 (likely the considerations)
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
