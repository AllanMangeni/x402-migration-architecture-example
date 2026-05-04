import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@ai16z/eliza";
import { PaymentService } from "./payment-service";
import { PythClient } from "./pyth-client";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

/**
 * purchasePriceFeedAction: ElizaOS action to purchase price data.
 * Orchestrates the payment flow and data retrieval.
 */
export const purchasePriceFeedAction: Action = {
  name: "PURCHASE_PRICE_FEED",
  similes: ["BUY_PRICE_DATA", "FETCH_MARKET_UPDATE", "SETTLE_PYTH_PAYMENT"],
  description: "Purchases a real-time price feed update from the Pyth network using legacy virtual card rails.",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    return true; // Simplified for Stage One
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback
  ) => {
    // These would typically be provided by the runtime or a custom plugin
    const paymentService: PaymentService = (state as any).paymentService;
    const pythClient: PythClient = (state as any).pythClient;

    const transactionId = `tx_${Date.now()}`;

    try {
      // 1. Initiate legacy purchase ($0.01 for the demo)
      const pan = await paymentService.initiatePurchase(transactionId, 0.01);
      
      // 2. Simulate the merchant charge (webhook loop starts here)
      await paymentService.simulateCharge(pan, 0.01);

      // 3. In Stage One, we wait for the webhook. 
      // For this synchronous agent action, we simulate the wait.
      if (callback) {
        callback({
          text: `I've initiated a payment (ID: ${transactionId}) for the BTC/USD price feed. Waiting for legacy rail settlement...`,
        });
      }

      // 4. Polling for settlement (legacy fallback)
      let attempts = 0;
      while (attempts < 10) {
        // In a real ElizaOS action, we'd handle this via an observer or event loop.
        // Here we simulate the legacy "check and wait" pain.
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        // Simulating that settlement happened
        const price = await pythClient.getLatestBtcPrice();
        
        if (callback) {
          callback({
            text: `Payment settled! Latest BTC price is: $${price.toFixed(2)}`,
          });
        }
        return true;
      }

    } catch (error: any) {
      let failureReason = "unknown legacy infrastructure failure";
      
      if (error.status === 401 || error.status === 403) {
        failureReason = "Lithic authentication/permission decline";
      } else if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
        failureReason = "network interruption (Toxiproxy injection confirmed)";
      } else if (error.message.includes("Merchant endpoint unreachable")) {
        failureReason = "downstream merchant (Pyth) API failure";
      }

      logger.error(`Agent payment action failed: ${failureReason}`, error);
      
      if (callback) {
        callback({
          text: `I encountered a critical error: ${failureReason}. The legacy rails were unable to maintain state during this transaction.`,
        });
      }
    }
    return false;
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "What is the current BTC price? Buy an update if you need to." },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll purchase a fresh price feed update for you.",
          action: "PURCHASE_PRICE_FEED",
        },
      },
    ],
  ],
};
