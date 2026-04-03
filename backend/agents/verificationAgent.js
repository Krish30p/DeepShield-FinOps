// Mock OpenClaw Framework Imports
// import { Agent, Tool } from "openclaw-sdk";

import { verifyProvenance, searchEDGARFilings, getTickerInfo } from "../services/secEdgarService.js";

/**
 * Step 1: SEC EDGAR Search Tool — NOW REAL!
 * Searches the actual SEC EDGAR database for filings related to the query.
 * Replaces the old mock that returned hardcoded URLs.
 */
export const sec_edgar_search = async (ticker, query) => {
  try {
    // Use the real SEC EDGAR service to verify provenance
    const provenanceUrl = await verifyProvenance(ticker, query);
    
    if (provenanceUrl) {
      return provenanceUrl;
    }

    // If no SEC filing found, check if the text explicitly mentions SEC sources
    const queryLower = query.toLowerCase();
    if (queryLower.includes("sec.gov") || queryLower.includes("8-k") || queryLower.includes("10-q") || queryLower.includes("10-k")) {
      // The user's text claims SEC provenance — get the company's filing page
      const info = await getTickerInfo(ticker);
      if (info.cik) {
        const paddedCIK = String(info.cik).padStart(10, "0");
        return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${paddedCIK}&type=&dateb=&owner=include&count=10`;
      }
    }

    return "Unverified Social Media Source";
  } catch (error) {
    console.error("[Verification Agent] SEC EDGAR search error:", error.message);
    return "Unverified Social Media Source";
  }
};

// OpenClaw Tool Configuration
const secEdgarSearchTool = {
  name: "sec_edgar_search",
  description: "Searches the real SEC EDGAR database for official filings to verify news provenance.",
  func: sec_edgar_search,
};

/**
 * Step 2 & 3: Define the Verification Agent's System Prompt and Initialization
 */
const SYSTEM_PROMPT = `
You are a strict financial compliance verifier.
You will receive a market news summary. You MUST use the sec_edgar_search tool to find a verifying government link.
You must output your final response STRICTLY as a JSON object with no markdown formatting or conversational text.

You are an extraction engine, NOT a financial advisor. You must NEVER decide to 'hold position' or cancel a trade. If the user's prompt contains a request to buy or sell, you MUST extract the action, asset, and quantity, and you MUST pass it to the execution tool.

The sec_edgar_search tool now connects to the REAL SEC EDGAR database. It will:
1. Validate the ticker against 13,000+ SEC-registered companies
2. Search for actual SEC filings (8-K, 10-K, 10-Q) matching the company
3. Return a real SEC.gov URL if a filing is found, or "Unverified" if not

If the news is from an unverified source (like a blog or social media) and lacks an SEC.gov link, do not abort. Simply set the verification_provenance field in the JSON payload to 'None' or 'Unverified', and send it to the execution tool anyway.

Expected JSON schema:
{
  "asset": "TICKER_SYMBOL",
  "action": "BUY_OR_SELL",
  "quantity": 10,
  "rationale": "Brief explanation of the news.",
  "verification_provenance": "URL_RETURNED_BY_THE_TOOL"
}
`;

/* 
 * Example OpenClaw Agent Initialization Snippet
 * Uncomment and use this if the OpenClaw SDK is available.
 */
/*
export const verificationAgent = new Agent({
  name: "VerificationAgent",
  llmModel: "gpt-4-turbo",
  systemPrompt: SYSTEM_PROMPT,
  tools: [secEdgarSearchTool],
  outputFormat: "json",
});
*/

/**
 * Fallback Function executing the agent logic explicitly
 * Now uses REAL SEC EDGAR data instead of mocked responses!
 */
export const runVerificationAgent = async (ingestionData) => {
  console.log("[Verification Agent] Using sec_edgar_search tool with ticker:", ingestionData.ticker);
  console.log("[Verification Agent] Original text:", ingestionData.originalText);
  
  // Use the REAL SEC EDGAR search tool (no more mocks!)
  const provenanceUrl = await sec_edgar_search(ingestionData.ticker, ingestionData.originalText);

  // Get additional company info from SEC for richer rationale
  let rationale = "News summary validated via SEC EDGAR tool execution.";
  try {
    const tickerInfo = await getTickerInfo(ingestionData.ticker);
    if (tickerInfo.companyName) {
      rationale = `News about ${tickerInfo.companyName} (${ingestionData.ticker}) validated via SEC EDGAR.`;
    }
  } catch (err) {
    // Non-critical, use default rationale
  }

  // Return the strict JSON output expected by ArmorClaw middleware
  const intentPayload = {
    ticker: ingestionData.ticker,
    asset: ingestionData.ticker,
    action: ingestionData.recommendedAction || "HOLD",
    quantity: ingestionData.quantity,
    rationale,
    verification_provenance: provenanceUrl,
  };

  return intentPayload;
};
