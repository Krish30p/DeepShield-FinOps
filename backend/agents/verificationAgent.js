import { verifyProvenance } from "../services/secEdgarService.js";

export const runVerificationAgent = async (ingestionData) => {
  console.log("[Verification Agent] Searching for cryptographic provenance for:", ingestionData.ticker);

  const provenanceUrl = await verifyProvenance(ingestionData.ticker, ingestionData.originalText);

  // Generate Intent Payload
  // Note: hardcoded quantity for hackathon simulation
  const intentPayload = {
    ticker: ingestionData.ticker,
    action: ingestionData.recommendedAction,
    quantity: 10, 
    rationale: `Sentiment was ${ingestionData.sentiment} based on the ingested news context.`,
    verification_provenance: provenanceUrl,
  };

  return intentPayload;
};
