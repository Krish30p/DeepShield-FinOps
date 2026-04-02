export const runIngestionAgent = async (newsText) => {
  // Simulate OpenClaw Ingestion Agent Analysis
  console.log("[Ingestion Agent] Analyzing text:", newsText);

  let sentiment = "NEUTRAL";
  let tickerMatch = null;
  let recommendedAction = "HOLD";

  const upperText = newsText.toUpperCase();

  // Basic sentiment heuristics for hackathon
  if (upperText.includes("BULLISH") || upperText.includes("SOARING") || upperText.includes("PARTNERSHIP")) {
    sentiment = "POSITIVE";
    recommendedAction = "BUY";
  } else if (upperText.includes("BEARISH") || upperText.includes("CRASH") || upperText.includes("FRAUD")) {
    sentiment = "NEGATIVE";
    recommendedAction = "SELL";
  }

  // Find ticker
  const possibleTickers = ["AAPL", "MSFT", "NVDA", "GOOGL", "TSLA"];
  for (const t of possibleTickers) {
    if (upperText.includes(t)) {
      tickerMatch = t;
      break;
    }
  }

  if (!tickerMatch) {
    throw new Error("No recognized ticker found in the ingested data.");
  }

  return {
    ticker: tickerMatch,
    sentiment,
    recommendedAction,
    originalText: newsText,
  };
};
