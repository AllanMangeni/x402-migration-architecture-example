import "dotenv/config";
import { purchasePriceFeedAction } from "./src/agent.js";
import { PythClient } from "./src/pyth-client.js";
import { X402NativeSettlementService } from "./src/x402-native-settlement.js";

async function testAgentPurchase() {
  console.log("Starting Stage Three Native x402 Purchase Test...");

  // No StateManager, No PaymentService required in Stage Three.
  const x402Service = new X402NativeSettlementService();
  const pythClient = new PythClient();

  const mockRuntime = {} as any;
  const mockMessage = { content: { text: "Get BTC price" } } as any;
  const mockState = { 
    x402Service, 
    pythClient 
  } as any;
  const mockCallback = (msg: any) => {
    console.log("AGENT RESPONSE:", msg.text);
    return Promise.resolve([]);
  };

  await purchasePriceFeedAction.handler(
    mockRuntime,
    mockMessage,
    mockState,
    {},
    mockCallback
  );
}

testAgentPurchase().catch(console.error);
