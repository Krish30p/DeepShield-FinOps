// Mock OpenClaw Framework Imports
// import { Agent, Tool } from "openclaw-sdk";

/**
 * Step 1: Create the SEC Search Tool (Mocked for Hackathon)
 */
export const sec_edgar_search = async (query) => {
  const queryLower = query.toLowerCase();

  // If the input contains negative/attack keywords
  if (
    queryLower.includes("scandal") ||
    queryLower.includes("resign") ||
    queryLower.includes("bankrupt")
  ) {
    return "http://unverified-news.com/scandal";
  }

  // If the input contains positive/normal keywords
  if (
    queryLower.includes("earnings") ||
    queryLower.includes("apple") ||
    queryLower.includes("partnership") ||
    queryLower.includes("buy") ||
    queryLower.includes("soaring")
  ) {
    return "https://www.sec.gov/ix?doc=/Archives/edgar/data/mocked_valid_report.htm";
  }

  // Default fallback
  return "https://www.sec.gov/ix?doc=/Archives/edgar/data/mocked_valid_report.htm";
};

// OpenClaw Tool Configuration
const secEdgarSearchTool = {
  name: "sec_edgar_search",
  description: "Searches for an official SEC EDGAR provenance URL to verify the news summary.",
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
 * Fallback Function executing the agent logic explicitly for the hackathon
 */
export const runVerificationAgent = async (ingestionData) => {
  console.log("[Verification Agent] Using sec_edgar_search tool with query:", ingestionData.originalText);
  
  // Use the mocked tool
  const provenanceUrl = await sec_edgar_search(ingestionData.originalText);

  // Return the strict JSON output expected by ArmorClaw middleware
  // Note: changing 'ticker' to 'asset' internally based on your JSON schema target
  const intentPayload = {
    // The previously defined schema used 'ticker', so we map asset to ticker for compatibility if needed.
    ticker: ingestionData.ticker, // Keeping ticker for compatibility with rest of API, but structuring similar to instructions
    asset: ingestionData.ticker,
    action: ingestionData.recommendedAction || "HOLD",
    quantity: 10,
    rationale: "News summary validated via tool execution.",
    verification_provenance: provenanceUrl,
  };

  return intentPayload;
};
