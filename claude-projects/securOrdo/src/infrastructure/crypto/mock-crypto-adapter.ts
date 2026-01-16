/**
 * MockCryptoAdapter
 *
 * ⚠️ PROOF-OF-CONCEPT ONLY - For MVP Testing
 *
 * This adapter provides FAKE cryptographic operations:
 * - Signatures are constant fake hex strings (never validated)
 * - Encryption is just base64 encoding (no real encryption)
 * - Nonces are UUIDs (no anti-replay checking)
 *
 * Replace with NobleCurvesAdapter (using @noble/curves) in Phase 2
 * for real ECDSA P-256 signatures and ECIES encryption.
 */

import crypto from 'crypto';

export class MockCryptoAdapter {
  /**
   * Generate a fake ECDSA key pair
   * In Phase 2: Replace with @noble/curves secp256r1
   */
  generateKeyPair() {
    const publicKey = 'MOCK_PUBLIC_KEY_' + crypto.randomBytes(16).toString('hex');
    const privateKey = 'MOCK_PRIVATE_KEY_' + crypto.randomBytes(16).toString('hex');

    return {
      publicKey,
      privateKey,
      fingerprint: publicKey.slice(0, 16), // 16-char fingerprint for lookups
    };
  }

  /**
   * Create a fake signature of the prescription payload
   * In Phase 2: Replace with real ECDSA P-256 signature using @noble/curves
   */
  signPrescription(payload: any): string {
    // Just return a constant fake signature prefixed with timestamp
    // In MVP, verification always returns true, so content doesn't matter
    return 'MOCK_SIGNATURE_' + Date.now().toString(16).padEnd(16, '0');
  }

  /**
   * Verify a signature (always returns true in MVP)
   * In Phase 2: Replace with real ECDSA P-256 verification
   */
  verifySignature(signature: string, payloadHash: string): boolean {
    // MVP: Always return true (mocked)
    // Phase 2: Verify signature against prescriber's public key
    return true;
  }

  /**
   * Encrypt payload to base64 (not real encryption)
   * In Phase 2: Replace with ECIES hybrid encryption
   * Format: {"prescriptionId":"...", "prescriptionNumber":"...", "patientInsNumber":"..."}
   */
  encryptPayload(payload: any): string {
    // MVP: Just base64 encode the JSON
    // This is the QR code payload - it's self-contained and readable
    // Phase 2: Add real ECIES encryption with target pharmacy's public key
    const json = JSON.stringify(payload);
    return Buffer.from(json).toString('base64');
  }

  /**
   * Decrypt payload from base64
   */
  decryptPayload(encrypted: string): any {
    try {
      // MVP: Just base64 decode
      // Phase 2: Decrypt with ECIES using pharmacy's private key
      const json = Buffer.from(encrypted, 'base64').toString('utf-8');
      return JSON.parse(json);
    } catch (error) {
      throw new Error('Failed to decrypt payload');
    }
  }

  /**
   * Generate a 256-bit anti-replay nonce
   * In Phase 2: This nonce is checked against nonce_records table
   * to prevent prescription reuse (essential for security)
   */
  generateNonce(): string {
    // Return UUID (will be stored in nonce_records with TTL)
    // Phase 2: Validate nonce hasn't been used (usedAt != NULL)
    return crypto.randomUUID();
  }

  /**
   * Hash a prescription payload with SHA-256
   * Used as input to signature algorithm
   * In Phase 2: Real ECDSA P-256 will sign this hash
   */
  hashPayload(payload: any): string {
    const json = JSON.stringify(payload);
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  /**
   * Generate a fake nonce record for storage in nonce_records table
   * Format: { nonce, expiresAt, usedAt: NULL }
   */
  createNonceRecord(nonce: string, ttlDays: number = 365) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    return {
      nonce,
      expiresAt: expiresAt.toISOString(),
      usedAt: null, // Will be set when prescription is dispensed
    };
  }

  /**
   * For testing: Print mock warning
   * (Remove before Phase 2 deployment)
   */
  static printWarning() {
    console.warn(`
╔════════════════════════════════════════════════════════════════╗
║  ⚠️  PROOF-OF-CONCEPT CRYPTOGRAPHY - NOT FOR PRODUCTION       ║
║                                                                 ║
║  This is MockCryptoAdapter providing FAKE operations:          ║
║  • Signatures are not validated                                ║
║  • Encryption is plain base64                                  ║
║  • Nonces don't prevent replay attacks                         ║
║                                                                 ║
║  Replace with NobleCurvesAdapter (Phase 2) for real:           ║
║  • ECDSA P-256 signatures (@noble/curves)                      ║
║  • ECIES hybrid encryption                                     ║
║  • Nonce anti-replay verification                              ║
║                                                                 ║
║  See Phase 2 roadmap in MVP plan                               ║
╚════════════════════════════════════════════════════════════════╝
    `);
  }
}

/**
 * Export singleton instance for use across application
 */
export const mockCrypto = new MockCryptoAdapter();
