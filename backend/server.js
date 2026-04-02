import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";

dotenv.config();

const app = express();

app.use(cors());

//connect db
connectDB();

// middlewares
app.use(express.json());

// userRoutes
app.use("/api/auth", userRoutes);
app.use("/api", analysisRoutes); // /api/trigger-analysis, /api/audit-logs

// routes
app.get("/", (req, res) => {
  res.send(" Backend Running on ");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
