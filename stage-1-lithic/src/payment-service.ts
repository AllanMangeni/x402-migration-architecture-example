import Lithic from "lithic";
import { StateManager } from "./state-manager.js";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

/**
 * PaymentService: Orchestrates Lithic SDK interactions for card issuance 
 * and transaction simulation in a sandbox environment.
 */
export class PaymentService {
  private client: Lithic;
  private stateManager: StateManager;

  constructor(apiKey: string, stateManager: StateManager, baseUrl?: string) {
    this.client = new Lithic({
      apiKey,
      environment: "sandbox",
      baseURL: baseUrl, // Allows routing through Toxiproxy
    });
    this.stateManager = stateManager;
  }

  /**
   * Initiates a price feed purchase by creating a single-use virtual card.
   */
  public async initiatePurchase(transactionId: string, amount: number): Promise<string> {
    logger.info(`Initiating purchase ${transactionId} for $${amount}`);
    
    // 1. Persist initial state
    this.stateManager.createTransaction(transactionId, amount);

    try { // STATE_MGMT_LINE: network retry container
      // 2. Create single-use card
      const card = await this.client.cards.create({
        type: "SINGLE_USE",
        memo: `Purchase ${transactionId}`,
        spend_limit: amount * 100, // Lithic expects cents
        spend_limit_duration: "TRANSACTION",
      });

      // 3. Update status to PENDING with Lithic token
      await this.stateManager.updateStatus(transactionId, "PENDING", card.token);
      
      return card.token;
    } catch (error) { // STATE_MGMT_LINE: catch for transient card creation failure
      logger.error(`Card creation failed for ${transactionId}:`, error);
      await this.stateManager.updateStatus(transactionId, "FAILED");
      throw error;
    }
  }

  /**
   * Simulates a transaction authorization in sandbox.
   * In a real flow, this would be triggered by a merchant charge.
   */
  public async simulateCharge(cardToken: string, amount: number): Promise<void> {
    try { // STATE_MGMT_LINE: simulation retry container
      await this.client.transactions.simulateAuthorization({
        token: cardToken,
        amount: amount * 100,
        descriptor: "PYTH_PRICE_FEED_MERCHANT",
      });
      logger.info(`Simulated authorization for card ${cardToken}`);
    } catch (error) { // STATE_MGMT_LINE: simulation failure handling
      logger.error(`Simulation failed for ${cardToken}:`, error);
      throw error;
    }
  }

  /**
   * Helper to resolve transaction status via polling (Stage One recovery path).
   */
  public async pollTransactionStatus(cardToken: string): Promise<string> {
    const txs = await this.client.transactions.list({ card_token: cardToken });
    const latest = txs.data[0];
    return latest?.status || "PENDING";
  }
}
