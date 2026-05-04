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
    const x402Service: any = (state as any).x402Service; // X402SettlementService
    const virtualCardService: any = (state as any).virtualCardService; // VirtualCardService
    const pythClient: PythClient = (state as any).pythClient;

    const transactionId = `tx_${Date.now()}`;
    const startTime = Date.now();

    try {
      // --- PATH A: x402 Hybrid Path (Synchronous) ---
      if (x402Service && virtualCardService) {
        if (callback) callback({ text: "Attempting modern x402 settlement path..." });

        // 1. Settle synchronously via x402
        const settlementTxId = await x402Service.settle(0.01, "PYTH_FEED_PROVIDER");

        // 2. Issue card via translation layer after settlement is confirmed
        const cardDetails = await virtualCardService.issueCard({
          settlementTxId,
          amountUSD: 0.01,
          merchantId: "PYTH_FEED_PROVIDER"
        });

        // 3. Complete the purchase (immediate)
        const price = await pythClient.getLatestBtcPrice();
        const latency = Date.now() - startTime;

        if (callback) {
          callback({
            text: `[x402 PATH] Payment settled synchronously! BTC price: $${price.toFixed(2)}. Total latency: ${latency}ms.`,
          });
        }
        return true;
      }

      // --- PATH B: Legacy Fallback (Webhook Dependent) ---
      if (callback) callback({ text: "Falling back to legacy webhook-based rails..." });
      
      const pan = await paymentService.initiatePurchase(transactionId, 0.01);
      await paymentService.simulateCharge(pan, 0.01);

      if (callback) {
        callback({
          text: `[LEGACY PATH] Initiated payment (ID: ${transactionId}). Waiting for async webhook settlement...`,
        });
      }

      // Simulating the legacy wait/poll cycle
      await new Promise((resolve) => setTimeout(resolve, 3500));
      const price = await pythClient.getLatestBtcPrice();
      const legacyLatency = Date.now() - startTime;
      
      if (callback) {
        callback({
          text: `[LEGACY PATH] Finally settled! BTC price: $${price.toFixed(2)}. Total latency: ${legacyLatency}ms.`,
        });
      }
      return true;

    } catch (error: any) {
      // Enhanced error parsing for autonomous reasoning as per Stage Two brief
      let failureReason = "infrastructure_failure";
      let context = "unknown";

      if (error.message.includes("x402")) {
        failureReason = "settlement_failure";
        context = "x402_facilitator_rejection";
      } else if (error.status === 401) {
        failureReason = "auth_failure";
        context = "lithic_api_unauthorized";
      } else if (error.code === "ECONNRESET") {
        failureReason = "network_failure";
        context = "toxiproxy_interruption";
      }

      logger.error(`Hybrid action failed: ${failureReason} (${context})`, error);
      
      if (callback) {
        callback({
          text: `Payment failed due to ${failureReason}. Context: ${context}. The agent will attempt a state recovery in the next cycle.`,
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
