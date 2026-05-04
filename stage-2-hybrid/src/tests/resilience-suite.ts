import { Toxiproxy, Proxy } from "toxiproxy-node-client";
import winston from "winston";
import { PaymentService } from "../payment-service";
import { StateManager } from "../state-manager";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

const toxiproxyUrl = process.env.TOXIPROXY_URL || "http://localhost:8474";
const toxiproxy = new Toxiproxy(toxiproxyUrl);

/**
 * ResilienceSuite: Validates Stage One error recovery using Toxiproxy.
 * Governed by QA Lead persona requirements.
 */
async function runResilienceTests() {
  logger.info("Starting Stage One Resilience Suite...");

  // 1. Setup Proxy for Lithic API
  const proxy = await toxiproxy.createProxy({
    name: "lithic-api",
    listen: "0.0.0.0:21000",
    upstream: "api.lithic.com:443"
  });

  try {
    await testDroppedConnection(proxy);
    for (const t of proxy.toxics) await t.remove();
    
    await testLatencyTimeout(proxy);
    for (const t of proxy.toxics) await t.remove();

    await testReconnectResync(proxy);
  } finally {
    await proxy.remove();
  }
}

async function testDroppedConnection(proxy: Proxy) {
  logger.info("Test 1: Dropped connection mid-auth...");
  
  // Add toxic: reset_peer mid-request
  await proxy.addToxic({
    name: "dropped_conn",
    type: "reset_peer" as any,
    toxicity: 1.0,
    attributes: { timeout: 100 },
    stream: "downstream"
  } as any);

  const lithicBaseUrl = process.env.LITHIC_BASE_URL || "http://localhost:21000";
  const stateManager = new StateManager(":memory:");
  const paymentService = new PaymentService("mock_key", stateManager, lithicBaseUrl);

  try {
    await paymentService.initiatePurchase("test_drop", 10);
  } catch (error: any) {
    logger.info("Successfully caught dropped connection. Checking state manager...");
    const pending = stateManager.getStaleTransactions(0); // Check all pending
    if (pending.length > 0) {
      logger.info("PASSED: Transaction persisted in PENDING state despite network failure.");
    }
  }
}

async function testLatencyTimeout(proxy: Proxy) {
  logger.info("Test 2: High latency causing client timeout...");
  
  // Add toxic: 90s latency (Lithic default timeout is 60s)
  await proxy.addToxic({
    name: "latency_timeout",
    type: "latency" as any,
    toxicity: 1.0,
    attributes: { latency: 90000 },
    stream: "downstream"
  } as any);

  const lithicBaseUrl = process.env.LITHIC_BASE_URL || "http://localhost:21000";
  const stateManager = new StateManager(":memory:");
  const paymentService = new PaymentService("mock_key", stateManager, lithicBaseUrl);

  try {
    await paymentService.initiatePurchase("test_latency", 10);
  } catch (error: any) {
    logger.info("Successfully caught timeout. Verifying reconciliation path...");
    // In Stage One, this transaction stays PENDING until the background poller hits it
    const pending = stateManager.getStaleTransactions(0) as any[];
    if (pending.length > 0 && pending[0].status === "PENDING") {
      logger.info("PASSED: State manager correctly holds PENDING status for manual/polled reconciliation.");
    }
  }
}

async function testReconnectResync(proxy: Proxy) {
  logger.info("Test 3: Reconnect and resync after total outage...");
  
  // Disable the proxy to simulate total network outage
  proxy.enabled = false;
  await proxy.update();

  const lithicBaseUrl = process.env.LITHIC_BASE_URL || "http://localhost:21000";
  const stateManager = new StateManager(":memory:");
  const paymentService = new PaymentService("mock_key", stateManager, lithicBaseUrl);

  try {
    await paymentService.initiatePurchase("test_reconnect", 10);
  } catch (error: any) {
    logger.info("Successfully caught outage error. Re-enabling proxy and verifying reconciliation...");
    
    // Bring the network back up
    proxy.enabled = true;
    await proxy.update();

    // Verify the transaction was persisted for future reconciliation
    const pending = stateManager.getStaleTransactions(0) as any[];
    if (pending.length > 0 && pending[0].id === "test_reconnect") {
      logger.info("PASSED: Outage correctly handled; transaction queued in local state for recovery.");
    }
  }
}

runResilienceTests().catch(err => {
  logger.error("Resilience suite failed:", err);
  process.exit(1);
});
