import { X402Client, SettlementParams } from "@x402/core";
import { EVMFacilitator } from "@x402/evm";
import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { mainnet } from "viem/chains";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

/**
 * X402SettlementService: Facilitates programmable synchronous settlement.
 * This represents the modern, state-free payment path.
 */
export class X402SettlementService {
  private x402: X402Client;

  constructor() {
    // In Stage Two, we initialize the x402 client with a simulated EVM facilitator.
    // For this demo, we use a public client pointing to a sandbox/testnet RPC.
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    });

    const facilitator = new EVMFacilitator({
      publicClient,
      // Wallet client would be configured with the agent's private key
      walletClient: {} as any, 
    });

    this.x402 = new X402Client({
      facilitators: [facilitator],
    });
  }

  /**
   * Settles a payment synchronously using x402.
   * Returns a transaction ID that the VirtualCardService uses as an issuance trigger.
   */
  public async settle(amountUSD: number, merchantId: string): Promise<string> {
    logger.info(`Starting x402 settlement for $${amountUSD} to ${merchantId}`);
    
    const startTime = Date.now();

    try {
      // In a real implementation, this would trigger the on-chain atomic settlement
      // For the hybrid demo, we simulate the synchronous confirmation of the x402 path
      const params: SettlementParams = {
        amount: parseUnits(amountUSD.toString(), 6), // USDC usually 6 decimals
        asset: "USDC",
        destination: merchantId,
      };

      // Simulated x402 settlement confirmation
      // This bypasses the legacy webhook state machine entirely
      await new Promise((resolve) => setTimeout(resolve, 800)); // x402 is typically sub-second on L2s
      
      const settlementTxId = `x402_settlement_${Date.now()}`;
      const latency = Date.now() - startTime;
      
      logger.info(`x402 settlement confirmed in ${latency}ms. TX: ${settlementTxId}`);
      
      return settlementTxId;
    } catch (error) {
      logger.error("x402 settlement failed:", error);
      throw error;
    }
  }
}
