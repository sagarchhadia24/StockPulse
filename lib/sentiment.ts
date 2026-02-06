// lib/sentiment.ts

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

interface SentimentResult {
  score: number; // -1.0 to 1.0
  label: "bullish" | "neutral" | "bearish";
  summary: string;
}

export async function analyzeNewsSentiment(
  symbol: string,
  headlines: string[]
): Promise<SentimentResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || headlines.length === 0) {
    return { score: 0, label: "neutral", summary: "No news data available." };
  }

  const prompt = `Analyze the sentiment of these news headlines for stock ${symbol}. Return ONLY valid JSON with no markdown formatting:
{"score": <number from -1.0 to 1.0>, "label": "<bullish|neutral|bearish>", "summary": "<1-2 sentence summary of overall news sentiment>"}

Headlines:
${headlines.slice(0, 10).map((h, i) => `${i + 1}. ${h}`).join("\n")}

Rules:
- score: -1.0 (very bearish) to 1.0 (very bullish), 0 = neutral
- label: "bullish" if score > 0.2, "bearish" if score < -0.2, "neutral" otherwise
- summary: Brief overview of what the news suggests
- Return ONLY the JSON object, no other text`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 256,
        },
      }),
    });

    if (!response.ok) {
      console.error("Gemini sentiment API error:", response.status);
      return { score: 0, label: "neutral", summary: "Sentiment analysis unavailable." };
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return { score: 0, label: "neutral", summary: "No sentiment generated." };
    }

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    // Validate and clamp score
    const score = Math.max(-1, Math.min(1, Number(parsed.score) || 0));
    const label = score > 0.2 ? "bullish" : score < -0.2 ? "bearish" : "neutral";

    return {
      score,
      label,
      summary: parsed.summary || "No summary available.",
    };
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return { score: 0, label: "neutral", summary: "Sentiment analysis failed." };
  }
}

export async function batchAnalyzeSentiment(
  stocks: { symbol: string; headlines: string[] }[]
): Promise<Map<string, SentimentResult>> {
  const results = new Map<string, SentimentResult>();
  const batchSize = 5;

  for (let i = 0; i < stocks.length; i += batchSize) {
    const batch = stocks.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(({ symbol, headlines }) => analyzeNewsSentiment(symbol, headlines))
    );

    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.set(batch[index].symbol, result.value);
      } else {
        results.set(batch[index].symbol, {
          score: 0,
          label: "neutral",
          summary: "Analysis failed.",
        });
      }
    });

    // Delay between batches to avoid rate limiting
    if (i + batchSize < stocks.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
