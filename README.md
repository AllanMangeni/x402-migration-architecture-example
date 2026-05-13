# x402 Practical Migration: From Legacy Rails to Native Settlement

This repository provides a step-by-step technical demonstration of migrating a payment infrastructure from **Legacy Webhook-based Rails** (Lithic) to **x402-oriented settlement** over Base Sepolia RPC.

Developed for **Scale Mesh Labs**, this project quantifies the reduction in architectural complexity and the improvement in settlement reliability enabled by the x402 protocol.

**Related repos:**
- [x402-recovery](https://github.com/AllanMangeni/x402-recovery) — settlement recovery middleware and state machine (facilitator timeout, late confirmation handling)

---

## The Three-Stage Migration Journey

| Phase | Architecture | State Management | Avg. Latency | Settlement Type |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 1** | **Legacy Baseline** | 15 Lines (Fragile) | ~3,500ms | Async (Webhooks) |
| **Stage 2** | **Hybrid Transition** | 15 Lines (Retained) | **~802ms** | Synchronous (x402) |
| **Stage 3** | **x402 Simulation** | **0 Lines (Stateless)** | **~1,138ms** | **RPC-level simulation (Base Sepolia)** |

### Key Results
* **Stateless Application Layer**: Stage 3 removes local database schemas and reconciliation logic used in Stages 1 and 2.
* **Synchronous Confirmation**: Moved from asynchronous webhooks to synchronous HTTP-layer settlement simulation over Base Sepolia RPC.
* **Infrastructure Resilience**: Eliminates "Database Locked" and "Connection Timeout" failure modes that affect legacy webhook handlers.

### Stage 3: x402-Native Simulation on Base Sepolia RPC

Stage 3 demonstrates what the architecture looks like when local state management is removed entirely. The current implementation:

* Measures RPC-level latency by calling `getBlockNumber()` against a Base Sepolia endpoint
* Returns a synthetic transaction ID (no on-chain transaction is submitted)
* Confirms settlement synchronously at the HTTP layer

#### Limitations
* The settlement path is simplified — this is an RPC latency measurement, not a full x402 facilitator flow
* Transaction IDs are synthetic; no real on-chain settlement occurs in this demo
* Facilitator timeout recovery is not implemented here; see [x402-recovery](https://github.com/AllanMangeni/x402-recovery) for the state machine that handles late confirmations and facilitator timeouts
* Chain config targets Base Sepolia testnet, not mainnet

---

## Prerequisites

- **Node.js 20+** (Required for native execution)
- **Docker** (Used only for the Toxiproxy network simulator)
- **Lithic Sandbox API Key** (For Stage 1 & 2)
- **Base Sepolia RPC URL** (For Stage 3 RPC simulation)

---

## Setup & Configuration

1. **Initialize Environment**:
   Create a `.env` file in the root directory:
   ```env
   LITHIC_API_KEY=your_sandbox_key
   LITHIC_WEBHOOK_SECRET=your_webhook_secret
   LITHIC_BASE_URL=https://sandbox.lithic.com

   X402_WALLET_PRIVATE_KEY=your_testnet_private_key
   X402_RPC_URL=https://sepolia.base.org
   X402_USDC_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7e
   ```

2. **Start Network Simulator (Toxiproxy)**:
   ```bash
   docker run -d --name toxiproxy -p 8474:8474 -p 21000:21000 -p 8545:8545 shopify/toxiproxy:latest
   ```

---

## Running the Demo

For the most stable experience, we recommend running the stages natively.

### 1. Launch Services
Open three separate terminals and run:

* **Terminal 1 (Legacy):** `cd stage-1-lithic && npx tsx src/index.ts` (Port 3001)
* **Terminal 2 (Hybrid):** `cd stage-2-hybrid && npx tsx src/index.ts` (Port 3002)
* **Terminal 3 (x402 Simulation):** `cd stage-3-x402 && npx tsx src/index.ts` (Port 3003)

### 2. Trigger Live Simulations
In a new terminal, execute the test purchase scripts to generate live metrics:
```bash
# Test Stage 1
cd stage-1-lithic && npx tsx test-purchase.ts

# Test Stage 2
cd stage-2-hybrid && npx tsx test-purchase.ts

# Test Stage 3 (RPC simulation over Base Sepolia)
cd stage-3-x402 && npx tsx test-purchase.ts
```

### 3. View the Observability Dashboard
Access the consolidated migration report at:
[http://localhost:3003/api/observability/comparison](http://localhost:3003/api/observability/comparison)

---

## Resilience Testing

To observe how x402 eliminates legacy failure modes, run the automated resilience suites:
```bash
# Test legacy webhook fragility
cd stage-1-lithic && npx tsx src/tests/resilience-suite.ts

# Test x402 RPC simulation stability
cd stage-3-x402 && npx tsx src/tests/x402-resilience-suite.ts
```

### Running Stage 3 Tests Through Toxiproxy

To test RPC fault injection, set `X402_RPC_URL` to route through the Toxiproxy container:
```bash
X402_RPC_URL=http://toxiproxy:8545 npx tsx src/tests/x402-resilience-suite.ts
```

Under Docker Compose, this is the default behavior — Stage 3 depends on the Toxiproxy service which proxies port 8545 to the Base Sepolia upstream.

---

## Architecture Overview

| Stage | Purpose | State | Next Step |
| :--- | :--- | :--- | :--- |
| **Stage 1** | Webhook-driven baseline with SQLite state | Local DB, fragile reconciliation | Migrate to synchronous path |
| **Stage 2** | Hybrid: x402 payment with retained legacy state | Local DB retained, x402 introduced | Remove local state |
| **Stage 3** | x402-oriented simulation over Base Sepolia RPC | Stateless at application layer | Add facilitator recovery |
| **x402-recovery** | Facilitator timeout and late confirmation handling | External middleware / state machine | Production deployment |

Stage 3 is deliberately scoped as a simulation to establish the architectural baseline. The next step — a real x402 facilitator flow with timeout recovery — is implemented in the [x402-recovery](https://github.com/AllanMangeni/x402-recovery) repo.
