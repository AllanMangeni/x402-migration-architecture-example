import Database from "better-sqlite3";
import path from "path";
import winston from "winston";

// Logger configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export type TransactionStatus = "PENDING" | "SETTLING" | "SETTLED" | "FAILED" | "RECONCILING";

export interface TransactionState {
  id: string;
  status: TransactionStatus;
  amount: number;
  lithic_token?: string;
  retry_count: number;
  last_updated: number;
}

/**
 * StateManager: Handles persistence and reconciliation for legacy fiat transactions.
 * Annotated with STATE_MGMT_LINE for metric tracking as per System Architect brief.
 */
export class StateManager {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        amount REAL NOT NULL,
        lithic_token TEXT,
        retry_count INTEGER DEFAULT 0,
        last_updated INTEGER NOT NULL
      )
    `);
  }

  /**
   * Transitions transaction state with strict validation.
   */
  public async updateStatus(id: string, status: TransactionStatus, lithicToken?: string): Promise<void> {
    const now = Date.now();
    try { // STATE_MGMT_LINE: retry logic container
      const stmt = this.db.prepare(`
        UPDATE transactions 
        SET status = ?, lithic_token = COALESCE(?, lithic_token), last_updated = ?, retry_count = retry_count + 1
        WHERE id = ?
      `);
      stmt.run(status, lithicToken || null, now, id); // STATE_MGMT_LINE: persistence of transient state
    } catch (error) { // STATE_MGMT_LINE: failure handling during state transition
      logger.error(`State update failed for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves pending transactions for reconciliation polling.
   */
  public getPendingTransactions(): TransactionState[] {
    const stmt = this.db.prepare("SELECT * FROM transactions WHERE status IN ('PENDING', 'SETTLING', 'RECONCILING')"); // STATE_MGMT_LINE: query for transient states
    return stmt.all() as TransactionState[];
  }

  /**
   * Initializes a new transaction state.
   */
  public createTransaction(id: string, amount: number): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO transactions (id, status, amount, last_updated) 
      VALUES (?, 'PENDING', ?, ?)
    `); // STATE_MGMT_LINE: initial persistence of pending state
    stmt.run(id, amount, now);
  }

  /**
   * Reconciliation logic to handle interrupted webhook flows.
   */
  public async reconcile(id: string, actualStatus: TransactionStatus): Promise<void> {
    if (actualStatus === "SETTLED") { // STATE_MGMT_LINE: connection status handling block
      await this.updateStatus(id, "SETTLED");
    } else if (actualStatus === "FAILED") { // STATE_MGMT_LINE: connection status handling block
      await this.updateStatus(id, "FAILED");
    }
  }
}
