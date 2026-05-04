import { purchasePriceFeedAction } from "./src/agent.js";
import { PaymentService } from "./src/payment-service.js";
import { StateManager } from "./src/state-manager.js";
import { PythClient } from "./src/pyth-client.js";

async function testAgentPurchase() {
  console.log("Starting Agent Purchase Test...");

  const stateManager = new StateManager(":memory:");
  const paymentService = new PaymentService(
    process.env.LITHIC_API_KEY!,
    stateManager,
    process.env.LITHIC_BASE_URL
  );
  const pythClient = new PythClient();

  const mockRuntime = {} as any;
  const mockMessage = { content: { text: "Get BTC price" } } as any;
  const mockState = { paymentService, pythClient } as any;
  const mockCallback = (msg: any) => console.log("AGENT RESPONSE:", msg.text);

  await purchasePriceFeedAction.handler(
    mockRuntime,
    mockMessage,
    mockState,
    {},
    mockCallback
  );
}

testAgentPurchase().catch(console.error);
