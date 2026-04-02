import { runIngestionAgent } from "../agents/ingestionAgent.js";
import { runVerificationAgent } from "../agents/verificationAgent.js";
import { execute_alpaca_trade } from "../skills/AlpacaTradingSkill.js";
import AuditLog from "../models/AuditLog.js";

export const triggerAnalysisPipeline = async (req, res) => {
  const { newsText } = req.body;

  if (!newsText) {
    return res.status(400).json({ error: "Missing newsText in payload" });
  }

  try {
    // Pipeline Step 1: Ingestion
    const ingestionData = await runIngestionAgent(newsText);
    
    // Pipeline Step 2: Verification
    const intentPayload = await runVerificationAgent(ingestionData);

    // Pipeline Step 3 & 4: Execution Skill (Contains ArmorClaw + Logging)
    const executionResult = await execute_alpaca_trade(intentPayload);

    if (executionResult.status === "blocked" || executionResult.status === "error") {
      return res.status(403).json({
        success: false,
        message: executionResult.message,
        intentPayload
      });
    }

    return res.status(200).json({
      success: true,
      message: executionResult.message,
      intentPayload,
      orderId: executionResult.orderId,
    });
  } catch (error) {
    console.error("[Pipeline Error]", error.message);
    
    console.error("[Pipeline Error]", error.message);
    // Any overarching failures not caught inside agents


    return res.status(400).json({
      success: false,
      message: "Pipeline failed due to malformed context or agent guardrails.",
      error: error.message,
    });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(20);
    res.status(200).json(logs);
  } catch (error) {
    console.error("[getAuditLogs Error]", error.message);
    res.status(500).json({ error: "Failed to fetch logs", details: error.message });
  }
};
