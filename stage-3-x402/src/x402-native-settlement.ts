import { x402Client } from "@x402/core/client";
import { ExactEvmScheme, toFacilitatorEvmSigner } from "@x402/evm";
import { createPublicClient, http, parseUnits } from "viem";
import { baseSepolia } from "viem/chains";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

/**
 * X402NativeSettlementService: RPC-level settlement simulation over Base Sepolia.
 *
 * This service measures RPC latency and returns a synthetic transaction ID.
 * It does NOT perform real on-chain settlement or full x402 facilitator flow.
 * The actual settlement recovery state machine lives in:
 *   https://github.com/AllanMangeni/x402-recovery
 */
export class X402NativeSettlementService {
  private x402: x402Client;

  constructor() {
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.X402_RPC_URL),
    });

    const facilitator = new ExactEvmScheme(
      toFacilitatorEvmSigner(publicClient as any, {} as any)
    );

    this.x402 = x402Client.fromConfig({
      schemes: [
        {
          network: "eip155:84532",
          client: facilitator as any,
        },
      ],
    });
  }

  /**
   * Simulates x402 settlement over Base Sepolia RPC.
   *
   * Current behavior:
   * - Performs a real getBlockNumber() call against the configured RPC
   *   to measure network latency and verify connectivity
   * - Returns a synthetic transaction ID (no on-chain tx is submitted)
   *
   * TODO: integrate full x402 facilitator flow with timeout recovery
   * via x402-recovery middleware.
   */
  public async settle(amountUSD: number, merchantId: string): Promise<string> {
    logger.info(`Simulating x402 settlement of $${amountUSD} to merchant ${merchantId} over Base Sepolia RPC`);

    const startTime = Date.now();

    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(process.env.X402_RPC_URL),
      });

      // Real RPC call to measure latency and verify connectivity
      await publicClient.getBlockNumber();

      // Synthetic tx id — no on-chain transaction is submitted in this demo
      const txId = `x402_sim_${Date.now()}`;
      const latency = Date.now() - startTime;

      logger.info(`RPC simulation completed in ${latency}ms. Synthetic TX: ${txId}`);

      return txId;
    } catch (error) {
      logger.error("x402 RPC simulation failed:", error);
      throw error;
    }
  }
}
