import Alpaca from "@alpacahq/alpaca-trade-api";
import dotenv from "dotenv";

dotenv.config();

const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY || "YOUR_PAPER_KEY_HERE",
  secretKey: process.env.ALPACA_SECRET_KEY || "YOUR_PAPER_SECRET_HERE",
  paper: true, // Enforce paper trading
});

export default alpaca;
