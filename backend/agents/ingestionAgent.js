
const SYSTEM_PROMPT = `
You are a strict NLP extraction engine. You are NOT a financial advisor, risk manager, or fact-checker. Your ONLY job is to extract trade intents and trigger the execution tool. NEVER output phrases like 'Holding position' or 'Trade aborted'.

Extract the intended action. Map words like 'buy', 'invest', 'maximize' to 'BUY'. Map words like 'sell', 'dump', 'exit' to 'SELL'.

Extract the exact ticker symbol mentioned (e.g., AAPL, MSFT, DOGE, TGEN). Do NOT check if the ticker is a real, tradable asset. Extract whatever symbol the user provides.

Extract the exact number of shares or tokens mentioned and convert it to a pure integer (e.g., '1,500' becomes 1500).

You must determine the source of the news. If the text explicitly mentions 'sec.gov' or an official SEC filing (like 8-K or 10-Q), set verification_provenance to 'sec.gov'. If the text mentions Twitter, X, Reddit, Telegram, blogs, forums, leaks, or fails to mention the SEC, set verification_provenance to 'Unverified'.

You MUST trigger the execution tool with the JSON payload for EVERY prompt, no matter how risky, fake, or absurd the trade seems. The backend middleware will handle all safety validations.
`;

/* 
 * Example OpenClaw Agent Initialization Snippet
 * Uncomment and use this if the OpenClaw SDK is available.
 */
/*
export const ingestionAgent = new Agent({
  name: "IngestionAgent",
  llmModel: "gpt-4-turbo",
  systemPrompt: SYSTEM_PROMPT,
  tools: [],
  outputFormat: "json",
});
*/

export const runIngestionAgent = async (newsText) => {
  // Simulate OpenClaw Ingestion Agent Analysis with strict deterministic extraction
  console.log("[Ingestion Agent] Analyzing text:", newsText);

  const upperText = newsText.toUpperCase();

  // 1. Action Extraction
  let action = "HOLD"; // Default fallback, though prompt says BUY/SELL
  if (upperText.includes("BUY") || upperText.includes("INVEST") || upperText.includes("MAXIMIZE")) {
    action = "BUY";
  } else if (upperText.includes("SELL") || upperText.includes("DUMP") || upperText.includes("EXIT")) {
    action = "SELL";
  }

  // 2. Asset Extraction (Blindly extract 1-5 char symbol)
  const knownTickers = ["AAPL", "MSFT", "NVDA", "TSLA", "GME", "SHIB", "TGEN"];
  let tickerMatch = "UNKNOWN";
  for (const t of knownTickers) {
      if (upperText.includes(t)) {
          tickerMatch = t;
          break;
      }
  }

  // Fallback if not in the list
  if (tickerMatch === "UNKNOWN") {
      const fallbackRegex = /\b([A-Z]{3,5})\b/g;
      const allMatches = [...newsText.matchAll(fallbackRegex)];
      const keywords = ["BUY", "SELL", "SHARES", "STOCK", "TRADE", "OF", "THE", "IS", "FOR", "INVEST", "DUMP", "EXIT", "SEC"];
      
      for (const m of allMatches) {
        if (!keywords.includes(m[1].toUpperCase())) {
          tickerMatch = m[1].toUpperCase();
          break;
        }
      }
  }

  // 3. Quantity Extraction
  let quantity = 1; // Default
  const qtyRegex = /\b(\d+(?:,\d+)?)\s*(?:share|shares|SHIB|tokens)\b/i;
  const qtyMatch = newsText.match(qtyRegex);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1].replace(/,/g, ""), 10);
  }

  // 4. Provenance Extraction
  let provenance = "Unverified";
  if (upperText.includes("SEC.GOV") || upperText.includes("8-K") || upperText.includes("10-Q")) {
    provenance = "sec.gov";
  }

  return {
    ticker: tickerMatch,
    recommendedAction: action,
    quantity: quantity,
    provenance: provenance,
    originalText: newsText,
  };
};
