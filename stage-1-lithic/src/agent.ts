import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@ai16z/eliza";
import { PaymentService } from "./payment-service.js";
import { PythClient } from "./pyth-client.js";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

/**
 * ElizaOS Action: purchase-price-feed
 * Orchestrates the payment flow from the agent's perspective.
 */
export const purchasePriceFeedAction: Action = {
  name: "PURCHASE_PRICE_FEED",
  similes: ["BUY_PRICE_DATA", "PAY_FOR_PYTH"],
  description: "Purchases a real-time price feed from Pyth Network using Lithic fiat rails.",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    return !!process.env.LITHIC_API_KEY;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback: HandlerCallback
  ) => {
    const paymentService = state.paymentService as PaymentService;
    const pythClient = state.pythClient as PythClient;
    const priceId = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"; // BTC/USD
    const transactionId = `tx_${Date.now()}`;

    try {
      // 1. Trigger payment initiation
      const cardToken = await paymentService.initiatePurchase(transactionId, 0.01); // $0.01 for demo
      
      // 2. Simulate the merchant charge (Automated for this demo)
      await paymentService.simulateCharge(cardToken, 0.01);

      // 3. Wait for settlement (In Stage One, this is an async webhook flow)
      // For the agent UI flow, we notify that payment is pending
      callback({
        text: `I've initiated a payment (ID: ${transactionId}) for the BTC/USD price feed. Waiting for legacy rail settlement...`,
        content: { transactionId, status: "PENDING" }
      });

      // 4. Fetch the data (In a real app, this would wait for the webhook)
      const data = await pythClient.getLatestPrice(priceId);
      
      callback({
        text: `Payment settled! Latest BTC price is: $${(data.parsed[0].price.price / 10**8).toFixed(2)}`,
        content: { data }
      });

      return true;
    } catch (error: any) {
      logger.error("Agent payment action failed:", error);
      callback({
        text: "I encountered an error processing the payment on the legacy rails.",
        content: { error: error instanceof Error ? error.message : String(error) }
      });
      return false;
    }
  },

  examples: [
    [
      { user: "{{user1}}", content: { text: "Can you get me the current BTC price?" } },
      { user: "{{agentName}}", content: { text: "I'll purchase that price feed for you now.", action: "PURCHASE_PRICE_FEED" } }
    ]
  ]
};
