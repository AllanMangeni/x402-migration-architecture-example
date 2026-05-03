# x402 Migration Guide: Practical Developer Demo

This repository demonstrates an incremental migration from a legacy Lithic webhook-based payment integration to x402 programmable settlement.

## Three-Stage Journey

1.  **Stage One: Legacy Rails** (Current)
    - Full Lithic webhook integration for card transaction state management.
    - Orchestrated by an ElizaOS agent purchasing a Pyth Network price feed.
    - Resilience testing via Toxiproxy.
2.  **Stage Two: Hybrid Migration**
    - Introduction of x402 settlement.
    - Virtual card translation layer for legacy merchant compatibility.
3.  **Stage Three: Full x402**
    - Removal of all legacy state management.
    - Native x402 settlement for all agent payments.

## Metrics Baseline (Stage One)

| Metric | Stage 1 (Legacy) | Stage 2 (Hybrid) | Stage 3 (x402) |
| :--- | :--- | :--- | :--- |
| **State Mgmt LOC** | 24 lines | TBD | TBD |
| **Transaction Latency** | ~3.5s | TBD | TBD |
| **Recovery Complexity** | Toxiproxy Suite (3 failure modes) | TBD | TBD |
| **Settlement Time** | Async (Webhook Dependent) | TBD | TBD |

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
```

### Running Stage One
```bash
docker-compose up stage-1
```

### Running Resilience Tests
```bash
docker-compose run stage-1 bun run src/tests/resilience-suite.ts
```

---
*Developed for Scale Mesh Labs by the x402 Migration Team.*
