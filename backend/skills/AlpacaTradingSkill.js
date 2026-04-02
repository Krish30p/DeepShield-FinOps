// Step 3: Define the OpenClaw Execution Tool
// File: skills/AlpacaTradingSkill.js

import { executePaperTrade } from "../services/alpacaService.js";
import AuditLog from "../models/AuditLog.js";

/**
 * Step 3: Create the OpenClaw custom tool definition.
 * This tool is assigned to the Execution Agent. It takes the parsed JSON intent
 * and acts as the bridge to our Alpaca integration.
 */
export const execute_alpaca_trade = async (intentPayload) => {
  const { asset, action, quantity, verification_provenance } = intentPayload;

  console.log(`[AlpacaTradingSkill] Tool triggered for ${action} ${quantity} ${asset}.`);

  // Log Intent: Create an initial AuditLog entry with status 'PENDING'
  let auditLog = new AuditLog({
    asset,
    action,
    quantity,
    verification_provenance,
    status: "PENDING"
  });
  await auditLog.save();

  // =========================================================================
  // TODO: ArmorClaw Middleware Policy Check Goes Here
  // E.g., evaluateArmorClawPolicy(intentPayload)
  // if (!allowed) {
  //   auditLog.status = "BLOCKED";
  //   auditLog.block_reason = reason;
  //   await auditLog.save();
  //   return { status: "blocked", message: reason };
  // }
  // =========================================================================

  try {
    if (action === "HOLD") {
      auditLog.status = "EXECUTED";
      auditLog.block_reason = "Holding position";
      await auditLog.save();
      return { status: "success", message: "Holding position. No trade executed." };
    }

    // Call the executePaperTrade function initialized in Step 2 securely.
    const result = await executePaperTrade(asset, action, quantity);
    
    // Update DB: Update the MongoDB AuditLog entry status to 'EXECUTED'
    auditLog.status = "EXECUTED";
    await auditLog.save();

    return { 
      status: "success", 
      message: `Successfully executed ${action} for ${quantity} shares of ${asset}`,
      orderId: result.order.id 
    };
  } catch (error) {
    // Update DB: Mark as FAILED if something crashes during trading
    auditLog.status = "FAILED";
    auditLog.block_reason = error.message;
    await auditLog.save();

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
