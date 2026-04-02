import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  asset: { type: String, required: true },
  action: { type: String, enum: ["BUY", "SELL", "HOLD"], required: true },
  quantity: { type: Number, required: true },
  verification_provenance: { type: String, required: false },
  status: { type: String, required: true, enum: ["PENDING", "EXECUTED", "BLOCKED", "FAILED"] },
  block_reason: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
