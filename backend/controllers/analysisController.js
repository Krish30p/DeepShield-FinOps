import { runIngestionAgent } from "../agents/ingestionAgent.js";
import { runVerificationAgent } from "../agents/verificationAgent.js";
import { runExecutionAgent } from "../agents/executionAgent.js";
import { evaluatePolicy } from "../services/armorClawService.js";
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

    // Initial Audit Log creation
    let auditLog = new AuditLog({
      agent: "VerificationAgent",
      intent_payload: intentPayload,
      status: "Pending",
    });

    // Pipeline Step 3: Middleware ArmorClaw Evaluation
    const policyResult = evaluatePolicy(intentPayload);

    if (!policyResult.allowed) {
      // ArmorClaw Blocked the action
      auditLog.agent = "ArmorClaw";
      auditLog.status = "Blocked";
      auditLog.block_reason = policyResult.reason;
      await auditLog.save();

      return res.status(403).json({
        success: false,
        message: "ArmorClaw blocked the execution.",
        reason: policyResult.reason,
        intentPayload,
      });
    }

    // Pipeline Step 4: Execution
    const executionResult = await runExecutionAgent(intentPayload);

    // ArmorClaw Allowed -> Log Execution Success
    auditLog.agent = "ExecutionAgent";
    auditLog.status = "Executed";
    await auditLog.save();

    return res.status(200).json({
      success: true,
      message: executionResult.message,
      intentPayload,
      order: executionResult.order,
    });
  } catch (error) {
    console.error("[Pipeline Error]", error.message);
    
    const auditLog = new AuditLog({
      agent: "ExecutionAgent",
      status: "Failed",
      block_reason: error.message,
    });
    // Partial intent saving logic could be added if intent was generated.
    await auditLog.save();

    return res.status(500).json({
      success: false,
      message: "Pipeline failed.",
      error: error.message,
    });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};
