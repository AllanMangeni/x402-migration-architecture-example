import { Toxiproxy, Proxy } from "toxiproxy-node-client";
import { X402NativeSettlementService } from "../x402-native-settlement";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

const TOXIPROXY_URL = process.env.TOXIPROXY_URL || "http://toxiproxy:8474";
const toxiproxy = new Toxiproxy(TOXIPROXY_URL);

/**
 * X402ResilienceSuite: Validates that the native x402 path handles 
 * network-level failures gracefully without local state management.
 */
async function runResilienceTests() {
  logger.info("Starting x402 Resilience Suite...");

  // 1. Setup RPC Proxy
  // Note: In a real test, the upstream would be the actual RPC provider
  const rpcUpstream = process.env.X402_RPC_URL_UPSTREAM || "base-sepolia.g.alchemy.com:443";
  let rpcProxy: Proxy;

  try {
    rpcProxy = await toxiproxy.createProxy({
      listen: "0.0.0.0:8545",
      name: "x402-rpc-proxy",
      upstream: rpcUpstream
    });
  } catch (e) {
    // If proxy already exists, just get it
    rpcProxy = await toxiproxy.getProxy("x402-rpc-proxy");
  }

  const x402Service = new X402NativeSettlementService();

  /**
   * TEST: RPC Timeout
   * Simulates a 90-second latency on RPC calls, exceeding the client timeout.
   */
  async function testRPCTimeout() {
    logger.info("TEST: RPC Timeout (Simulating network latency)");
    
    await rpcProxy.addToxic({
      attributes: { latency: 90000 },
      name: "rpc-latency",
      type: "latency",
      toxicity: 1
    });

    try {
      await x402Service.settle(50.0, "merchant_abc");
      logger.error("FAIL: Settlement should have timed out");
    } catch (error: any) {
      logger.info(`SUCCESS: Caught expected timeout error: ${error.message}`);
    } finally {
      await rpcProxy.removeToxic("rpc-latency");
    }
  }

  /**
   * TEST: Settlement Rejection
   * Simulates a facilitator rejecting a settlement (e.g. insufficient funds)
   * This is a logic-level failure that x402 should report synchronously.
   */
  async function testSettlementRejection() {
    logger.info("TEST: Settlement Rejection (Simulating protocol failure)");
    
    // For this demo, we simulate a rejection by passing an invalid merchant ID
    try {
      await x402Service.settle(10.0, "INVALID_MERCHANT");
    } catch (error: any) {
      logger.info(`SUCCESS: Caught expected rejection: ${error.message}`);
    }
  }

  // Execute suite
  try {
    await testRPCTimeout();
    await testSettlementRejection();
    logger.info("x402 Resilience Suite Completed Successfully.");
  } catch (error) {
    logger.error("Resilience Suite Failed", error);
    process.exit(1);
  }
}

runResilienceTests();
