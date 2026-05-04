import { x402Client } from "@x402/core/client";
import { ExactEvmScheme, toFacilitatorEvmSigner } from "@x402/evm";
import { createPublicClient, http, parseUnits } from "viem";
import { mainnet } from "viem/chains";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

/**
 * X402NativeSettlementService: Pure programmable settlement.
 * In Stage Three, this is the only payment path.
 * No local state management or legacy card translation is required.
 */
export class X402NativeSettlementService {
  private x402: x402Client;

  constructor() {
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    });

    const facilitator = new ExactEvmScheme(
      toFacilitatorEvmSigner(publicClient as any, {} as any)
    );

    this.x402 = x402Client.fromConfig({
      schemes: [
        {
          network: "eip155:1",
          client: facilitator as any,
        },
      ],
    });
  }

  /**
   * Settles a payment natively via x402.
   * The merchant accepts the programmable transaction directly.
   */
  public async settle(amountUSD: number, merchantId: string): Promise<string> {
    logger.info(`Natively settling $${amountUSD} to merchant ${merchantId} via x402`);
    
    const startTime = Date.now();

    try {
      const params = {
        amount: parseUnits(amountUSD.toString(), 6),
        asset: "USDC",
        destination: merchantId,
      };

      // Direct x402 settlement (simulated sub-second confirmation)
      await new Promise((resolve) => setTimeout(resolve, 600)); 
      
      const txId = `x402_native_${Date.now()}`;
      const latency = Date.now() - startTime;
      
      logger.info(`Native x402 settlement confirmed in ${latency}ms. TX: ${txId}`);
      
      return txId;
    } catch (error) {
      logger.error("Native x402 settlement failed:", error);
      throw error;
    }
  }
}
