import { purchasePriceFeedAction } from "./src/agent.js";
import { PaymentService } from "./src/payment-service.js";
import { StateManager } from "./src/state-manager.js";
import { PythClient } from "./src/pyth-client.js";
import { X402SettlementService } from "./src/x402-settlement.js";
import { VirtualCardServiceImpl } from "./src/virtual-card-service-impl.js";

async function testAgentPurchase() {
  console.log("Starting Stage Two Hybrid Purchase Test...");

  const stateManager = new StateManager(":memory:");
  const paymentService = new PaymentService(
    process.env.LITHIC_API_KEY!,
    stateManager,
    process.env.LITHIC_BASE_URL
  );
  const x402Service = new X402SettlementService();
  const virtualCardService = new VirtualCardServiceImpl(
    process.env.LITHIC_API_KEY!,
    process.env.LITHIC_BASE_URL
  );
  const pythClient = new PythClient();

  const mockRuntime = {} as any;
  const mockMessage = { content: { text: "Get BTC price" } } as any;
  const mockState = { 
    paymentService, 
    x402Service, 
    virtualCardService, 
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
