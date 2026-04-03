import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isValidSECTicker } from "./secEdgarService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the policy during initialization
const policyPath = path.join(__dirname, "../policies/armorClawPolicy.json");
const armorClawPolicy = JSON.parse(fs.readFileSync(policyPath, "utf-8"));

export const runArmorClawChecks = async (asset, quantity, provenance) => {
  // Step 1: Sanitize Inputs
  const cleanAsset = String(asset).trim().toUpperCase();
  const cleanQuantity = Number(quantity);
  const cleanProvenance = String(provenance).trim().toLowerCase();

  // Step 2: Add Debug Logger
  console.log(`🔍 [ARMORCLAW DEBUG] Received -> Asset: '${cleanAsset}', Qty: ${cleanQuantity}, Prov: '${cleanProvenance}'`);

  // Step 3: Update Rule Evaluation
  // Rule 1: Provenance check
  if (!cleanProvenance || !cleanProvenance.includes("sec.gov")) {
    return { isSafe: false, blockReason: "Missing verified SEC.gov provenance URL" };
  }

  // Rule 2: DYNAMIC SEC EDGAR Whitelist check (replaces hardcoded array!)
  //   Instead of: const whitelist = ["AAPL", "MSFT", "NVDA", "TSLA"];
  //   Now validates against the full SEC EDGAR database of 13,000+ registered companies
  const secValidation = await isValidSECTicker(cleanAsset);
  if (!secValidation.isValid) {
    return { 
      isSafe: false, 
      blockReason: `Asset '${cleanAsset}' is not registered with the SEC and is not authorized for trading` 
    };
  }

  console.log(`✅ [ARMORCLAW] SEC-validated: ${cleanAsset} = ${secValidation.companyName} (CIK: ${secValidation.cik})`);

  // Rule 3: Blast Radius check
  if (cleanQuantity > 50) {
    return { isSafe: false, blockReason: "Trade exceeds maximum risk limit of 50 shares" };
  }

  return { isSafe: true, blockReason: null };
};

export const evaluatePolicy = async (intentPayload) => {
  const { ticker, quantity, verification_provenance } = intentPayload;
  const rules = armorClawPolicy.rules;

  // 1. DYNAMIC SEC EDGAR ticker validation (replaces hardcoded allowed_tickers list!)
  const secValidation = await isValidSECTicker(ticker);
  if (!secValidation.isValid) {
    return {
      allowed: false,
      reason: `${rules.allowed_tickers.message} '${ticker}' is not found in the SEC EDGAR database.`,
    };
  }

  // 2. Check max order notional value
  const mockPrice = 150; // Mock price per share
  const notionalValue = quantity * mockPrice;
  if (notionalValue > rules.max_order_notional.value) {
    return {
      allowed: false,
      reason: `${rules.max_order_notional.message} (Tried: $${notionalValue})`,
    };
  }

  // 3. Check required provenance
  const regex = new RegExp(rules.required_provenance.pattern);
  if (!regex.test(verification_provenance)) {
    return {
      allowed: false,
      reason: rules.required_provenance.message,
    };
  }

  return { allowed: true, reason: null };
};
