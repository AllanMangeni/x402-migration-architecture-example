/**
 * Global interface for virtual card issuance translation layer.
 * Strictly defined in AGENTS.md. Stage One declares this contract 
 * to establish the architectural target for the x402 migration.
 */
export interface VirtualCardService {
  /**
   * Issues a single-use virtual card after settlement verification.
   */
  issueCard(params: {
    settlementTxId: string;
    amountUSD: number;
    merchantId: string;
  }): Promise<{
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    issuedAt: string;
  }>;

  /**
   * Retrieves the current usage status of a previously issued card.
   */
  getCardStatus(cardNumber: string): Promise<{
    status: "active" | "used" | "expired" | "failed";
    usedAt?: string;
  }>;
}
