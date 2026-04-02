import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the policy during initialization
const policyPath = path.join(__dirname, "../policies/armorClawPolicy.json");
const armorClawPolicy = JSON.parse(fs.readFileSync(policyPath, "utf-8"));

export const evaluatePolicy = (intentPayload) => {
  const { ticker, quantity, verification_provenance } = intentPayload;
  const rules = armorClawPolicy.rules;

  // 1. Check allowed tickers
  if (!rules.allowed_tickers.values.includes(ticker)) {
    return {
      allowed: false,
      reason: rules.allowed_tickers.message,
    };
  }

  // 2. Check max order notional value (Assuming price mock or just using quantity as notional for simplicity in hackathon)
  // In a real app we'd multiply quantity by current stock price.
  // Here we assume quantity is the notional amount or we have a flat price assumption.
  // Let's assume order size = quantity for this mock, or quantity * some mock price.
  // We'll just enforce quantity <= max_order_notional.value for simplicity if we don't have a price oracle.
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
