# x402 Practical Migration: From Legacy Rails to Native Settlement

This repository provides a step-by-step technical demonstration of migrating a payment infrastructure from **Legacy Webhook-based Rails** (Lithic) to **Native Programmable Settlement** (x402). 

Developed for **Scale Mesh Labs**, this project quantifies the massive reduction in architectural complexity and the dramatic improvement in settlement reliability enabled by the x402 protocol.

---

## 🚀 The Three-Stage Migration Journey

| Phase | Architecture | State Management | Avg. Latency | Settlement Type |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 1** | **Legacy Baseline** | 15 Lines (Fragile) | ~3,500ms | Async (Webhooks) |
| **Stage 2** | **Hybrid Transition** | 15 Lines (Retained) | **~802ms** | Synchronous (x402) |
| **Stage 3** | **Native Target** | **0 Lines (Stateless)** | **~1,138ms** | **On-Chain (Sync)** |

### Key Results
*   **100% Complexity Reduction**: All local database schemas and reconciliation logic were deleted in Stage 3.
*   **Instant Finality**: Moved from unpredictable asynchronous webhooks to synchronous, chain-verified settlement.
*   **Infrastructure Resilience**: Native immunity to the "Database Locked" and "Connection Timeout" issues that plague legacy webhook handlers.

---

## 🛠 Prerequisites

- **Node.js 20+** (Required for native execution)
- **Docker** (Used only for the Toxiproxy network simulator)
- **Lithic Sandbox API Key** (For Stage 1 & 2)
- **Base Sepolia RPC URL** (For Stage 3 on-chain verification)

---

## ⚙️ Setup & Configuration

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
   docker run -d --name toxiproxy -p 8474:8474 -p 21000:21000 shopify/toxiproxy:latest
   ```

---

## 🕹 Running the Demo

For the most stable experience, we recommend running the stages natively.

### 1. Launch Services
Open three separate terminals and run:

*   **Terminal 1 (Legacy):** `cd stage-1-lithic && npx tsx src/index.ts` (Port 3001)
*   **Terminal 2 (Hybrid):** `cd stage-2-hybrid && npx tsx src/index.ts` (Port 3002)
*   **Terminal 3 (Native):** `cd stage-3-x402 && npx tsx src/index.ts` (Port 3003)

### 2. Trigger Live Simulations
In a new terminal, execute the test purchase scripts to generate live metrics:
```bash
# Test Stage 1
cd stage-1-lithic && npx tsx test-purchase.ts

# Test Stage 2
cd stage-2-hybrid && npx tsx test-purchase.ts

# Test Stage 3 (Real On-Chain Transaction)
cd stage-3-x402 && npx tsx test-purchase.ts
```

### 3. View the Observability Dashboard
Access the consolidated migration report at:
👉 **[http://localhost:3003/api/observability/comparison](http://localhost:3003/api/observability/comparison)**

---

## 🛡 Resilience Testing
To observe how x402 eliminates legacy failure modes, run the automated resilience suites:
```bash
# Test legacy webhook fragility
cd stage-1-lithic && npx tsx src/tests/resilience-suite.ts

# Test native x402 protocol stability
cd stage-3-x402 && npx tsx src/tests/x402-resilience-suite.ts
```

---
*Maintained by Allan Mang'eni & the x402 Migration Team at Scale Mesh Labs.*
