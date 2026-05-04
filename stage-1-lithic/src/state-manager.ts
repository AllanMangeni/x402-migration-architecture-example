import Database from "better-sqlite3";
import path from "path";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export type TransactionStatus = "INITIATED" | "PENDING" | "SETTLING" | "SETTLED" | "FAILED" | "TIMED_OUT";

/**
 * StateManager: Manages transaction persistence and state transitions.
 * This is the primary complexity driver in legacy webhook-based architectures.
 */
export class StateManager {
  private db: Database.Database;

  constructor(dbPath: string) {
    const fullPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
    this.db = new Database(fullPath);
    this.init();
  }

  private init() {
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount INTEGER,
        status TEXT,
        lithic_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  }

  public createTransaction(id: string, amount: number) {
    // STATE_MGMT_LINE: initialization of local state to track async webhook response
    this.db.prepare(
      "INSERT INTO transactions (id, amount, status) VALUES (?, ?, ?)"
    ).run(id, amount, "INITIATED");
  }

  public updateStatus(id: string, status: TransactionStatus, lithicToken?: string) {
    // STATE_MGMT_LINE: complex conditional logic to handle async state transitions
    if (lithicToken) {
      this.db.prepare(
        "UPDATE transactions SET status = ?, lithic_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(status, lithicToken, id);
    } else {
      this.db.prepare(
        "UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(status, id);
    }
  }

  public getTransaction(id: string) {
    // STATE_MGMT_LINE: manual retrieval of state for polling/reconciliation
    return this.db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any;
  }

  public getPendingTransactions() {
    // STATE_MGMT_LINE: retrieval of all active/pending transactions
    return this.db.prepare("SELECT * FROM transactions WHERE status IN ('INITIATED', 'PENDING', 'SETTLING')").all() as any[];
  }

  public getStaleTransactions(timeoutMinutes: number = 5) {
    // STATE_MGMT_LINE: logic to identify hung transactions needing manual recovery
    return this.db.prepare(`
      SELECT * FROM transactions 
      WHERE status = 'PENDING' 
      AND updated_at < datetime('now', ?)
    `).all(`-${timeoutMinutes} minutes`);
  }
}
