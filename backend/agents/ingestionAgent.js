
import { extractTickersFromText, resolveCompanyNameToTicker } from "../services/secEdgarService.js";

const SYSTEM_PROMPT = `
You are a strict NLP extraction engine. You are NOT a financial advisor, risk manager, or fact-checker. Your ONLY job is to extract trade intents and trigger the execution tool. NEVER output phrases like 'Holding position' or 'Trade aborted'.

Extract the intended action. Map words like 'buy', 'invest', 'maximize' to 'BUY'. Map words like 'sell', 'dump', 'exit' to 'SELL'.

Extract the exact ticker symbol mentioned. Cross-reference it against the SEC EDGAR database of registered companies. If the ticker is not SEC-registered, still extract it — the downstream middleware will validate and block if necessary.

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

// ─── Well-known company name → ticker mappings for natural language extraction ──
// This is NOT a whitelist — it's only used to help the NLP engine resolve common
// company names (e.g., "Apple" → AAPL) when no ticker symbol is explicitly stated.
// The actual validation happens downstream via live SEC EDGAR data.
const COMPANY_NAME_HINTS = {
  "apple": "AAPL",
  "microsoft": "MSFT",
  "nvidia": "NVDA",
  "tesla": "TSLA",
  "google": "GOOGL",
  "alphabet": "GOOGL",
  "amazon": "AMZN",
  "meta": "META",
  "facebook": "META",
  "netflix": "NFLX",
  "gamestop": "GME",
  "amd": "AMD",
  "intel": "INTC",
  "disney": "DIS",
  "boeing": "BA",
  "walmart": "WMT",
  "jpmorgan": "JPM",
  "goldman": "GS",
  "berkshire": "BRK-B",
  "palantir": "PLTR",
  "coinbase": "COIN",
  "uber": "UBER",
  "airbnb": "ABNB",
  "snowflake": "SNOW",
  "salesforce": "CRM",
  "oracle": "ORCL",
  "ibm": "IBM",
  "cisco": "CSCO",
  "adobe": "ADBE",
  "paypal": "PYPL",
  "spotify": "SPOT",
  "rivian": "RIVN",
  "lucid": "LCID",
  "robinhood": "HOOD",
};

export const runIngestionAgent = async (newsText) => {
  // Simulate OpenClaw Ingestion Agent Analysis with strict deterministic extraction
  console.log("[Ingestion Agent] Analyzing text:", newsText);

  const upperText = newsText.toUpperCase();

  // 1. Action Extraction
  let action = "HOLD"; // Default fallback
  if (upperText.includes("BUY") || upperText.includes("INVEST") || upperText.includes("MAXIMIZE")) {
    action = "BUY";
  } else if (upperText.includes("SELL") || upperText.includes("DUMP") || upperText.includes("EXIT")) {
    action = "SELL";
  }

  // 2. Asset Extraction — REAL-TIME SEC EDGAR LOOKUP (no hardcoded list!)
  let tickerMatch = "UNKNOWN";

  // Strategy A: Use the SEC ticker extractor to find valid tickers in the text
  try {
    const secMatches = await extractTickersFromText(newsText);
    if (secMatches.length > 0) {
      tickerMatch = secMatches[0]; // Take the first matched SEC-registered ticker
      console.log(`[Ingestion Agent] ✅ SEC-validated ticker found: ${tickerMatch}`);
    }
  } catch (err) {
    console.warn("[Ingestion Agent] SEC ticker extraction failed, falling back:", err.message);
  }

  // Strategy B: If no SEC ticker found, try resolving common company names
  if (tickerMatch === "UNKNOWN") {
    const lowerText = newsText.toLowerCase();
    for (const [name, ticker] of Object.entries(COMPANY_NAME_HINTS)) {
      if (lowerText.includes(name)) {
        tickerMatch = ticker;
        console.log(`[Ingestion Agent] 🔍 Resolved company name '${name}' → ${ticker}`);
        break;
      }
    }
  }

  // Strategy C: Try SEC's own company name resolution
  if (tickerMatch === "UNKNOWN") {
    try {
      // Extract potential company names (capitalized words that aren't common English)
      const nameRegex = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*)\b/g;
      const nameMatches = [...newsText.matchAll(nameRegex)];
      const skipWords = new Set(["Buy", "Sell", "Trade", "Shares", "Stock", "The", "New", "Big"]);

      for (const m of nameMatches) {
        if (!skipWords.has(m[1])) {
          const resolved = await resolveCompanyNameToTicker(m[1]);
          if (resolved) {
            tickerMatch = resolved;
            console.log(`[Ingestion Agent] 🔍 SEC resolved company name '${m[1]}' → ${resolved}`);
            break;
          }
        }
      }
    } catch (err) {
      console.warn("[Ingestion Agent] SEC company name resolution failed:", err.message);
    }
  }

  // Strategy D: Final fallback — extract any 3-5 char uppercase word as potential ticker
  if (tickerMatch === "UNKNOWN") {
    const fallbackRegex = /\b([A-Z]{3,5})\b/g;
    const allMatches = [...newsText.matchAll(fallbackRegex)];
    const keywords = new Set([
      "BUY", "SELL", "SHARES", "STOCK", "TRADE", "OF", "THE", "IS", "FOR",
      "INVEST", "DUMP", "EXIT", "SEC", "NEWS", "HUGE", "BIG", "IPO", "CEO",
      "CFO", "NEW", "AND", "HAS", "NOW", "ALL", "ETF", "ARE", "WAS", "NOT",
    ]);

    for (const m of allMatches) {
      if (!keywords.has(m[1].toUpperCase())) {
        tickerMatch = m[1].toUpperCase();
        console.log(`[Ingestion Agent] ⚠️  Fallback ticker extraction: ${tickerMatch} (unvalidated)`);
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
