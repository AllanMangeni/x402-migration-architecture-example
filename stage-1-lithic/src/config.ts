import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Hardened Configuration Module
 * Parses, validates, and freezes environment variables.
 * Fails fast if required secrets are missing to prevent runtime surprises.
 */
interface Config {
  lithic: {
    apiKey: string;
    webhookSecret: string;
    baseUrl?: string;
  };
  infra: {
    databasePath: string;
    toxiproxyUrl: string;
    port: number;
  };
}

function validateEnv(): Config {
  const apiKey = process.env.LITHIC_API_KEY;
  const webhookSecret = process.env.LITHIC_WEBHOOK_SECRET;

  // Security: Check for missing or placeholder values
  if (!apiKey || apiKey === "sandbox_api_key_placeholder") {
    throw new Error("CRITICAL SECURITY ERROR: LITHIC_API_KEY is missing or using placeholder in environment.");
  }

  if (!webhookSecret) {
    throw new Error("CRITICAL SECURITY ERROR: LITHIC_WEBHOOK_SECRET is missing in environment.");
  }

  return {
    lithic: {
      apiKey,
      webhookSecret,
      // Optional: Used when routing traffic through Toxiproxy for resilience testing
      baseUrl: process.env.LITHIC_BASE_URL,
    },
    infra: {
      databasePath: process.env.DATABASE_PATH || "/app/data/state.db",
      toxiproxyUrl: process.env.TOXIPROXY_URL || "http://toxiproxy:8474",
      port: parseInt(process.env.PORT || "3001", 10),
    },
  };
}

// Export a frozen configuration object to prevent runtime mutations and ensure integrity
export const config = Object.freeze(validateEnv());
