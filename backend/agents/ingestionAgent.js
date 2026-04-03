export const runIngestionAgent = async (newsText) => {
  // Simulate OpenClaw Ingestion Agent Analysis
  console.log("[Ingestion Agent] Analyzing text:", newsText);

  let sentiment = "NEUTRAL";
  let tickerMatch = null;
  let recommendedAction = "HOLD";

  const upperText = newsText.toUpperCase();

  // Basic sentiment heuristics for hackathon
  if (upperText.includes("BULLISH") || upperText.includes("SOARING") || upperText.includes("PARTNERSHIP") || upperText.includes("EARNINGS") || upperText.includes("BUY")) {
    sentiment = "POSITIVE";
    recommendedAction = "BUY";
  } else if (upperText.includes("BEARISH") || upperText.includes("CRASH") || upperText.includes("FRAUD") || upperText.includes("SCANDAL") || upperText.includes("RESIGN") || upperText.includes("SELL")) {
    sentiment = "NEGATIVE";
    recommendedAction = "SELL";
  }

  // Find ticker: Blindly extract any symbol mentioned
  // Logic: First look for a 1-5 character uppercase word that follows "Buy", "Sell", "of", or "is"
  const tickerRegex = /\b(?:BUY|SELL|OF|IS)\s+([A-Z]{1,5})\b/i;
  const match = newsText.match(tickerRegex);
  
  if (match) {
    tickerMatch = match[1].toUpperCase();
  } else {
    // Fallback: Look for the first 1-5 character uppercase word that isn't a common keyword
    const generalTickerRegex = /\b([A-Z]{1,5})\b/g;
    const allMatches = [...newsText.matchAll(generalTickerRegex)];
    const keywords = ["BUY", "SELL", "SHARES", "STOCK", "TRADE", "OF", "THE", "IS", "FOR"];
    
    for (const m of allMatches) {
      if (!keywords.includes(m[1].toUpperCase())) {
        tickerMatch = m[1].toUpperCase();
        break;
      }
    }
  }

  // If still no ticker, use a default placeholder to keep the pipeline alive for ArmorClaw to block
  if (!tickerMatch) {
    tickerMatch = "UNKNOWN";
  }

  return {
    ticker: tickerMatch,
    sentiment,
    recommendedAction,
    originalText: newsText,
  };
};
