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

| **State Mgmt LOC** | 15 lines | 15 lines (Legacy path retained) | TBD |
| **Transaction Latency** | ~3.5s | ~800ms (x402 path) | TBD |
| **Recovery Complexity** | Toxiproxy Suite (3 failure modes) | Translation Layer failure handling | TBD |
| **Settlement Time** | Async (Webhook Dependent) | Synchronous (x402) | TBD |

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

### Running Resilience Tests
```bash
docker-compose run stage-1 bun run src/tests/resilience-suite.ts
```

---
*Developed for Scale Mesh Labs by the x402 Migration Team.*
