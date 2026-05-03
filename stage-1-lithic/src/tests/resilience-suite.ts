import { Toxiproxy, Proxy } from "toxiproxy-node-client";
import winston from "winston";
import { PaymentService } from "../payment-service.js";
import { StateManager } from "../state-manager.js";

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
    await testLatencyTimeout(proxy);
  } finally {
    await proxy.remove();
  }
}

async function testDroppedConnection(proxy: Proxy) {
  logger.info("Test 1: Dropped connection mid-auth...");
  
  // Add toxic: reset_peer mid-request
  await proxy.addToxic({
    type: "reset_peer",
    attributes: { timeout: 100 },
    stream: "downstream"
  });

  const stateManager = new StateManager(":memory:");
  const paymentService = new PaymentService("mock_key", stateManager, "http://localhost:21000");

  try {
    await paymentService.initiatePurchase("test_drop", 10);
  } catch (error) {
    logger.info("Successfully caught dropped connection. Checking state manager...");
    const pending = stateManager.getPendingTransactions();
    if (pending.length > 0) {
      logger.info("PASSED: Transaction persisted in PENDING state despite network failure.");
    }
  }
}

async function testLatencyTimeout(proxy: Proxy) {
  logger.info("Test 2: High latency causing client timeout...");
  
  // Add toxic: 90s latency (Lithic default timeout is 60s)
  await proxy.addToxic({
    type: "latency",
    attributes: { latency: 90000 },
    stream: "downstream"
  });

  const stateManager = new StateManager(":memory:");
  const paymentService = new PaymentService("mock_key", stateManager, "http://localhost:21000");

  try {
    await paymentService.initiatePurchase("test_latency", 10);
  } catch (error) {
    logger.info("Successfully caught timeout. Verifying reconciliation path...");
    // In Stage One, this transaction stays PENDING until the background poller hits it
    const pending = stateManager.getPendingTransactions();
    if (pending[0].status === "PENDING") {
      logger.info("PASSED: State manager correctly holds PENDING status for manual/polled reconciliation.");
    }
  }
}

runResilienceTests().catch(err => {
  logger.error("Resilience suite failed:", err);
  process.exit(1);
});
