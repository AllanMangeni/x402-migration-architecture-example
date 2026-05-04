import Lithic from "lithic";
import { StateManager } from "./state-manager";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

/**
 * PaymentService: Orchestrates Lithic SDK interactions and state transitions.
 */
export class PaymentService {
  private client: Lithic;
  private stateManager: StateManager;

  constructor(apiKey: string, stateManager: StateManager, baseUrl?: string) {
    this.client = new Lithic({
      apiKey,
      environment: baseUrl ? undefined : "sandbox",
      baseURL: baseUrl, // Routed through Toxiproxy for network simulation
    });
    this.stateManager = stateManager;
  }

  /**
   * Initiates a purchase by creating a single-use virtual card.
   */
  public async initiatePurchase(transactionId: string, amount: number): Promise<string> {
    logger.info(`Initiating purchase ${transactionId} for $${amount}`);
    
    // STATE_MGMT_LINE: tracking initiation before network request
    this.stateManager.createTransaction(transactionId, amount);

    try { 
      // 2. Create single-use card
      const card = await this.client.cards.create({
        type: "SINGLE_USE",
        memo: `Purchase ${transactionId}`,
        spend_limit: amount * 100, // Lithic expects cents
        spend_limit_duration: "TRANSACTION",
      });

      // STATE_MGMT_LINE: persisting card token for future webhook correlation
      await this.stateManager.updateStatus(transactionId, "PENDING", card.token);
      
      return card.pan || ""; // Return PAN for sandbox simulation
    } catch (error: any) { 
      // STATE_MGMT_LINE: manual failure state handling on network error
      logger.error(`Card creation failed for ${transactionId}:`, error);
      await this.stateManager.updateStatus(transactionId, "FAILED");
      throw error;
    }
  }

  /**
   * Simulates a transaction authorization in sandbox.
   */
  public async simulateCharge(pan: string, amount: number): Promise<void> {
    try {
      await this.client.transactions.simulateAuthorization({
        pan: pan,
        amount: amount * 100,
        descriptor: "PYTH_PRICE_FEED_MERCHANT",
      });
      logger.info(`Simulated authorization for card ${pan}`);
    } catch (error) {
      logger.error(`Simulation failed for ${pan}:`, error);
      throw error;
    }
  }

  /**
   * Polling fallback for reconciliation when webhooks fail.
   */
  public async pollTransactionStatus(cardToken: string): Promise<string> {
    // STATE_MGMT_LINE: manual polling logic required by legacy async rails
    const txs = await this.client.transactions.list({ card_token: cardToken });
    const latest = txs.data[0];
    return latest?.status || "PENDING";
  }
}
