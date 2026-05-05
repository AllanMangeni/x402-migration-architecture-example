# x402 Migration Guide: Practical Developer Demo

This repository demonstrates an incremental migration from a legacy Lithic webhook-based payment integration to x402 programmable settlement.

## Three-Stage Journey

1.  **Stage One: Legacy Rails** (Baseline)
    - Full Lithic webhook integration for card transaction state management.
    - Orchestrated by an ElizaOS agent purchasing a Pyth Network price feed.
    - Resilience testing via Toxiproxy.
2.  **Stage Two: Hybrid Migration** (Transition)
    - Introduction of x402 settlement.
    - Virtual card translation layer for legacy merchant compatibility.
3.  **Stage Three: Full x402** (Target Achieved)
    - Removal of all legacy state management.
    - Native x402 settlement for all agent payments.

| Metric | Stage 1 (Legacy) | Stage 2 (Hybrid) | Stage 3 (x402) |
| :--- | :--- | :--- | :--- |
| **State Mgmt LOC** | 15 lines | 15 lines (Legacy path retained) | 0 lines (Goal Achieved) |
| **Transaction Latency** | ~3.5s | ~800ms (x402 path) | ~600ms (Native) |
| **Recovery Complexity** | Toxiproxy Suite (3 failure modes) | Translation Layer failure handling | None (Stateless) |
| **Settlement Time** | Async (Webhook Dependent) | Synchronous (x402) | Synchronous (Native) |

## Observability Results

The final migration report is available via the Stage 3 dashboard:
`GET http://localhost:3003/api/observability/comparison`

This endpoint aggregates real-time metrics from all three services to quantify the architectural shift.

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Bun 1.1+ (local development)
- Lithic Sandbox API Key

### Configuration
Create a `.env` file in the root:
```env
LITHIC_API_KEY=your_key_here
LITHIC_WEBHOOK_SECRET=your_secret_here
LITHIC_BASE_URL=http://toxiproxy:21000
X402_WALLET_PRIVATE_KEY=your_private_key_here
X402_RPC_URL=your_rpc_url_here
X402_USDC_CONTRACT=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
```

## Running the Stages

### Running Stage One (Legacy)
```bash
docker-compose up stage-1
```

### Running Stage Two (Hybrid)
```bash
docker-compose up stage-2
```

### Running Stage Three (Native x402)
```bash
docker-compose up stage-3
```

### Running Resilience Tests
```bash
docker-compose run stage-1 bun run src/tests/resilience-suite.ts
```

### Running x402 Resilience Tests (Stage Three)
```bash
docker-compose run stage-3 bun run src/tests/x402-resilience-suite.ts
```

---
*Developed for Scale Mesh Labs by the x402 Migration Team.*
