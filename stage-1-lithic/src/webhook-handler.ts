import { StateManager, TransactionStatus } from "./state-manager.js";
import winston from "winston";
import Lithic from "lithic";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

/**
 * WebhookHandler: Processes incoming Lithic events to drive the state machine.
 * This component is the primary target for removal in Stage Three.
 */
export class WebhookHandler {
  private stateManager: StateManager;
  private lithic: Lithic;
  private webhookSecret: string;

  constructor(stateManager: StateManager, apiKey: string, webhookSecret: string) {
    this.stateManager = stateManager;
    this.lithic = new Lithic({ apiKey });
    this.webhookSecret = webhookSecret;
  }

  /**
   * Verifies and processes a webhook payload.
   */
  public async handle(payload: string, headers: Record<string, string>): Promise<void> {
    try {
      // 1. Signature verification
      const event = this.lithic.webhooks.unwrap(payload, headers, this.webhookSecret);
      
      logger.info(`Received webhook event: ${event.event_type}`);

      // 2. Route by event type
      if (event.event_type === "card_transaction.updated") {
        const transaction = event.payload;
        const lithicToken = transaction.card_token;
        const status = this.mapLithicStatus(transaction.status);

        // 3. Update state manager (Atomic transition)
        // Find local transaction ID by lithic token (in a real app, this would be a DB lookup)
        // For demo, we use the lithic token as the search key in our state reconciliation
        const pending = this.stateManager.getPendingTransactions();
        const localTx = pending.find(t => t.lithic_token === lithicToken);

        if (localTx) {
          await this.stateManager.updateStatus(localTx.id, status);
          logger.info(`Transaction ${localTx.id} updated to ${status} via webhook`);
        }
      }
    } catch (error: any) {
      logger.error("Webhook processing failed:", error);
      throw error; // Force Lithic to retry webhook
    }
  }

  private mapLithicStatus(lithicStatus: string): TransactionStatus {
    switch (lithicStatus) {
      case "SETTLED":
      case "VOIDED":
      case "DECLINED":
        return "SETTLED"; // Simplified for demo logic
      case "PENDING":
        return "SETTLING";
      default:
        return "PENDING";
    }
  }
}
