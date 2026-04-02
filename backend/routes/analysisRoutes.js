import express from "express";
import { triggerAnalysisPipeline, getAuditLogs } from "../controllers/analysisController.js";

const router = express.Router();

// Trigger Multi-Agent Pipeline
router.post("/trigger-analysis", triggerAnalysisPipeline);

// Get Audit Logs for Frontend Dashboard
router.get("/audit-logs", getAuditLogs);

export default router;
