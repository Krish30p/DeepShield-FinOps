// Step 3: Define the OpenClaw Execution Tool
// File: skills/AlpacaTradingSkill.js

import { placePaperTrade } from "../services/alpacaService.js";

/**
 * Step 3: Create the OpenClaw custom tool definition.
 * This tool is assigned to the Execution Agent. It takes the parsed JSON intent
 * and acts as the bridge to our Alpaca integration.
 */
export const execute_alpaca_trade = async (intentPayload) => {
  const { ticker, action, quantity } = intentPayload;

  console.log(`[AlpacaTradingSkill] Tool triggered for ${action} ${quantity} ${ticker}.`);

  // =========================================================================
  // TODO: ArmorClaw Policy Check Goes Here
  // E.g., const policyResult = evaluateArmorClawPolicy(intentPayload);
  // if (!policyResult.allowed) throw new Error("Blocked by ArmorClaw");
  // =========================================================================

  try {
    // If the (mocked) ArmorClaw check passes, we execute the trade via Alpaca:
    if (action === "HOLD") {
      return { status: "success", message: "Holding position. No trade executed." };
    }

    // Call the placePaperTrade function initialized in Step 2 securely.
    const result = await placePaperTrade(ticker, quantity, action);
    
    return { 
      status: "success", 
      message: `Successfully executed ${action} for ${quantity} shares of ${ticker}`,
      orderId: result.order.id 
    };
  } catch (error) {
    // Return a structured error output back to the OpenClaw agent
    return { 
      status: "error", 
      message: `Execution failed: ${error.message}` 
    };
  }
};

/**
 * OpenClaw Skill / Tool Definition object
 * This is how the Agent becomes "aware" of the tool's existence and purpose.
 */
export const AlpacaTradingSkill = {
  name: "execute_alpaca_trade",
  description: "Places a paper trade via the Alpaca API based on a verified JSON intent object.",
  func: execute_alpaca_trade,
};
