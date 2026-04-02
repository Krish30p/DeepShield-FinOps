import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  agent: {
    type: String,
    required: true,
    enum: ["IngestionAgent", "VerificationAgent", "ExecutionAgent", "ArmorClaw"],
  },
  intent_payload: {
    ticker: { type: String, required: false },
    action: { type: String, required: false, enum: ["BUY", "SELL", "HOLD"] },
    quantity: { type: Number, required: false },
    rationale: { type: String, required: false },
    verification_provenance: { type: String, required: false },
  },
  status: {
    type: String,
    required: true,
    enum: ["Allowed", "Blocked", "Pending", "Executed", "Failed"],
  },
  block_reason: {
    type: String,
    default: null,
  },
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
