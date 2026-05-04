import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@ai16z/eliza";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

/**
 * purchasePriceFeedAction: Simplified x402 native action.
 * Zero state management logic. Zero webhook handling.
 */
export const purchasePriceFeedAction: Action = {
  name: "PURCHASE_PRICE_FEED",
  similes: ["BUY_PRICE_DATA", "FETCH_MARKET_UPDATE", "SETTLE_X402_PAYMENT"],
  description: "Purchases a real-time price feed update using native x402 programmable settlement.",
  validate: async (runtime: IAgentRuntime, message: Memory) => true,
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback
  ) => {
    const x402Service: any = (state as any).x402Service;
    const pythClient: any = (state as any).pythClient;
    const startTime = Date.now();

    try {
      if (callback) callback({ text: "Initiating native x402 settlement..." });

      // Direct, synchronous settlement with no state manager required
      const txId = await x402Service.settle(0.01, "PYTH_FEED_PROVIDER");

      const price = await pythClient.getLatestBtcPrice();
      const latency = Date.now() - startTime;

      if (callback) {
        callback({
          text: `[x402 NATIVE] Payment settled! BTC price: $${price.toFixed(2)}. Latency: ${latency}ms. (Zero State Required)`,
        });
      }
      return true;

    } catch (error: any) {
      logger.error("Native settlement action failed:", error);
      if (callback) {
        callback({
          text: "I encountered a settlement error. Since we use programmable x402 rails, I can safely retry without manual state reconciliation.",
        });
      }
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Update the BTC price feed." },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Settling natively via x402 to retrieve the latest data.",
          action: "PURCHASE_PRICE_FEED",
        },
      },
    ],
  ],
};
