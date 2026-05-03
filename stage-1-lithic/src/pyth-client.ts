/**
 * Mock Pyth Client to simulate merchant data retrieval.
 * Stage One: Pure HTTP data fetch.
 */
export class PythClient {
  private baseUrl: string = "https://hermes.pyth.network/v2/updates/price/latest";

  /**
   * Fetches the latest BTC/USD price.
   * This is the protected resource the agent is purchasing.
   */
  public async getLatestPrice(priceId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}?ids[]=${priceId}`);
    if (!response.ok) {
      throw new Error(`Pyth API error: ${response.statusText}`);
    }
    return await response.json();
  }
}
