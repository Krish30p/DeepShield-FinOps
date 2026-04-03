import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

//connect db
connectDB();

// middlewares
app.use(express.json());

// userRoutes
app.use("/api/auth", userRoutes);
app.use("/api", analysisRoutes); // /api/trigger-analysis, /api/audit-logs

// routes
app.get("/", (req, res) => {
  res.send(" Backend Running on Vercel ");
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
  );
}

// Export the Express app for Vercel Serverless Functions
// Note: Since this file uses ES Modules (import), we use 'export default' instead of 'module.exports'
export default app;
