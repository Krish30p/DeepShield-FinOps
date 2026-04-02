// Step 2: Initialize the Alpaca Client
// File: services/alpacaService.js

import Alpaca from "@alpacahq/alpaca-trade-api";
import dotenv from "dotenv";

// Load environment variables dynamically from the .env file
dotenv.config();

/**
 * Initialize the Alpaca API client.
 * We must explicitly set 'paper: true' so that the SDK points to 'https://paper-api.alpaca.markets'
 * instead of the live brokerage, preventing actual money transactions during the hackathon.
 */
const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,         // Pulled securely from .env
  secretKey: process.env.ALPACA_API_SECRET,  // Pulled securely from .env
  paper: true,                               // GUARANTEES we are in the paper trading environment
});

/**
 * A simple function wrapping the Alpaca createOrder endpoint.
 *
 * @param {string} asset - The stock symbol (e.g., 'AAPL')
 * @param {number} qty - The number of shares to trade
 * @param {string} side - 'buy' or 'sell'
 */
export const executePaperTrade = async (asset, action, qty) => {
  try {
    console.log(`[Alpaca Service] Attempting to ${action} ${qty} shares of ${asset}...`);
    
    // Create market order through the Alpaca Paper API
    const order = await alpaca.createOrder({
      symbol: asset,
      qty: qty,
      side: action.toLowerCase(), // Alpaca expects lowercase 'buy' or 'sell'
      type: "market",
      time_in_force: "day", // Order is valid for the current trading day
    });

    console.log(`[Alpaca Service] Order successfully placed! Order ID: ${order.id}`);
    return { success: true, order };
  } catch (error) {
    console.error(`[Alpaca Service] Trade failed: ${error.message}`);
    throw error; // Rethrow to let the agent/middleware handle the failure
  }
};

export default alpaca;
