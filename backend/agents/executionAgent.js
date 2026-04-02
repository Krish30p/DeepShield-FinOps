import alpaca from "../config/alpaca.js";

export const runExecutionAgent = async (intentPayload) => {
  console.log("[Execution Agent] Received Intent Payload for Execution:", intentPayload);

  if (intentPayload.action === "HOLD") {
    console.log("[Execution Agent] Action is HOLD, bypassing execution.");
    return { success: true, message: "No execution needed (HOLD)", order: null };
  }

  try {
    // Only attempt actual execution if Alpaca keys are present to avoid hackathon crash
    if (process.env.ALPACA_API_KEY && process.env.ALPACA_SECRET_KEY) {
      const order = await alpaca.createOrder({
        symbol: intentPayload.ticker,
        qty: intentPayload.quantity,
        side: intentPayload.action.toLowerCase(), // 'buy' or 'sell'
        type: "market",
        time_in_force: "day",
      });
      return { success: true, message: "Order executed via Alpaca Paper API.", order };
    } else {
      return { success: true, message: "Mock execution successful (No Alpaca Keys Provided).", order: { mockOrderId: "mock-12345" } };
    }
  } catch (error) {
    console.error("[Execution Agent] Error Executing Order:", error.message);
    throw new Error(`Execution Failed: ${error.message}`);
  }
};
