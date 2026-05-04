import axios from "axios";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

/**
 * PythClient: Simulates a merchant endpoint that provides price feed data.
 * In this demo, the agent pays for access to the price feed.
 */
export class PythClient {
  private hermesUrl = "https://hermes.pyth.network/v2/updates/price/latest";
  private btcFeedId = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

  public async getLatestBtcPrice(): Promise<number> {
    try {
      const response = await axios.get(`${this.hermesUrl}?ids[]=${this.btcFeedId}`);
      const priceData = response.data.parsed[0].price;
      const price = parseFloat(priceData.price) * Math.pow(10, priceData.expo);
      return price;
    } catch (error) {
      logger.error("Failed to fetch Pyth price data:", error);
      throw new Error("Merchant endpoint unreachable or failed.");
    }
  }
}
