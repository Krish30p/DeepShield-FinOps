import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import AuditLog from "./models/AuditLog.js";

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const log = await AuditLog.findOne().sort({ timestamp: -1 });
  console.log("LAST LOG:");
  console.dir(log, { depth: null });
  process.exit(0);
}).catch(console.error);
