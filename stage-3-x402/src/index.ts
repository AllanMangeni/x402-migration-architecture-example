import express, { Request, Response } from "express";
import dotenv from "dotenv";
import winston from "winston";
import { X402NativeSettlementService } from "./x402-native-settlement";
import { MigrationObservability } from "./observability";

dotenv.config();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

const app = express();
app.use(express.json());

// x402-recovery middleware extension point
// TODO: wire in createRecoveryMiddleware from x402-recovery once the package
// is available. This is where facilitator timeout and late-confirmation
// recovery will be handled. See:
//   https://github.com/AllanMangeni/x402-recovery
//
// Example (when available):
//   import { createRecoveryMiddleware } from "x402-recovery";
//   app.use(createRecoveryMiddleware({
//     profile: "east_africa_3g",
//     rpcUrl: process.env.X402_RPC_URL,
//   }));

// In Stage Three, only the native settlement service is required.
// Legacy infrastructure (State Manager, Webhook Handler) has been decommissioned.
const x402Service = new X402NativeSettlementService();
const observability = new MigrationObservability();

/**
 * Health Endpoint
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", stage: 3, architecture: "x402-rpc-simulation" });
});

/**
 * Consolidated Observability Endpoint
 * Aggregates results from all three stages for the final report.
 */
app.get("/api/observability/comparison", async (req: Request, res: Response) => {
  try {
    const report = await observability.getComparisonReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate comparison report" });
  }
});

/**
 * Observability Endpoint (Stage 3 Local)
 * Reports the target metrics for the completed migration.
 */
app.get("/api/observability/metrics", (req: Request, res: Response) => {
  res.json({
    stage: 3,
    state_management_loc: 0,
    settlement_type: "rpc_simulation_base_sepolia",
    avg_latency_ms: 600,
    recovery_complexity: "None (stateless demo — see x402-recovery for production)",
    idempotency: "Synthetic (demo-level)"
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  logger.info(`Stage Three: x402 Simulation Service running on port ${port}`);
  logger.info(`RPC endpoint: ${process.env.X402_RPC_URL || "not configured"}`);
  logger.info("Application layer is stateless; settlement is RPC-level simulation over Base Sepolia.");
});
