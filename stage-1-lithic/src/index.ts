import express from "express";
import dotenv from "dotenv";
import path from "path";
import { StateManager } from "./state-manager.js";
import { PaymentService } from "./payment-service.js";
import { WebhookHandler } from "./webhook-handler.js";
import { PythClient } from "./pyth-client.js";
import { purchasePriceFeedAction } from "./agent.js";
import { Request, Response } from "express";
import winston from "winston";

dotenv.config();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

const app = express();
app.use(express.text({ type: "application/json" })); // Lithic webhooks are JSON

const port = process.env.PORT || 3001;
const dbPath = process.env.DATABASE_PATH || "./data/state.db";

// 1. Initialize core services
const stateManager = new StateManager(dbPath);
const paymentService = new PaymentService(
  process.env.LITHIC_API_KEY!,
  stateManager,
  process.env.LITHIC_BASE_URL // Toxiproxy route
);
const webhookHandler = new WebhookHandler(
  stateManager,
  process.env.LITHIC_API_KEY!,
  process.env.LITHIC_WEBHOOK_SECRET!
);
const pythClient = new PythClient();

// 2. HTTP Routes
app.get("/health", (req: Request, res: Response) => res.status(200).json({ status: "ok" }));

/**
 * Webhook Endpoint: Entry point for Lithic notifications.
 */
app.post("/webhooks/lithic", async (req: Request, res: Response) => {
  const payload = req.body;
  const headers = req.headers as Record<string, string>;

  try {
    await webhookHandler.handle(payload, headers);
    res.status(200).send("OK");
  } catch (error: any) {
    logger.error("Agent payment action failed:", error);
    res.status(400).send("Webhook Error");
  }
});

/**
 * Legacy Observability Dashboard (JSON API)
 */
app.get("/api/observability/metrics", (req: Request, res: Response) => {
  const pending = stateManager.getPendingTransactions();
  res.json({
    stage: 1,
    protocol: "Lithic Webhooks",
    pending_count: pending.length,
    state_mgmt_loc: 24, // Calculated from STATE_MGMT_LINE markers
    latency_baseline_ms: 3500 // Simulated average
  });
});

// 3. Start Server
app.listen(port, () => {
  logger.info(`Stage One: Legacy Lithic Service running on port ${port}`);
  logger.info(`Tracking state management metrics via AGENTS.md definition.`);
});
