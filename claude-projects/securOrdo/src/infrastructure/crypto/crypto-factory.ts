/**
 * Cryptographic Adapter Factory
 *
 * Provides flexible selection between mock and real cryptography implementations.
 * Uses environment variable feature flag for testing and development.
 *
 * Usage:
 *   const crypto = createCryptoAdapter();
 *   const signature = crypto.signPrescription(payload, privateKey);
 *
 * Environment Variables:
 *   USE_MOCK_CRYPTO=true  - Use MockCryptoAdapter (test mode, signatures not verified)
 *   USE_MOCK_CRYPTO=false - Use NobleCurvesAdapter (production, real verification)
 *
 * ⚠️  WARNING: DO NOT use mock crypto in production!
 */

import { MockCryptoAdapter } from './mock-crypto-adapter';
import { NobleCurvesAdapter } from './noble-curves-adapter';

type CryptoAdapter = MockCryptoAdapter | NobleCurvesAdapter;

/**
 * Factory function to create appropriate crypto adapter
 *
 * @returns {CryptoAdapter} MockCryptoAdapter or NobleCurvesAdapter
 * @throws {Error} If crypto adapter cannot be determined
 */
export function createCryptoAdapter(): CryptoAdapter {
  const useMockCrypto = process.env.USE_MOCK_CRYPTO === 'true';

  if (useMockCrypto) {
    console.warn(
      '⚠️  [CryptoFactory] Using MOCK cryptography - signatures not verified!',
    );
    console.warn(
      '⚠️  [CryptoFactory] This is FOR TESTING ONLY. Do NOT use in production.',
    );
    return new MockCryptoAdapter();
  }

  console.info('[CryptoFactory] Using REAL cryptography (NobleCurvesAdapter)');
  console.info('[CryptoFactory] ECDSA P-256 + ECIES encryption enabled');
  return new NobleCurvesAdapter();
}

/**
 * Singleton instance for application-wide use
 * Can be replaced with dependency injection in production
 */
let cryptoInstance: CryptoAdapter | null = null;

/**
 * Get or create the singleton crypto adapter
 *
 * @returns {CryptoAdapter} Cached crypto adapter instance
 */
export function getCryptoAdapter(): CryptoAdapter {
  if (!cryptoInstance) {
    cryptoInstance = createCryptoAdapter();
  }
  return cryptoInstance;
}

/**
 * Reset crypto adapter (for testing)
 * Clears singleton cache to force re-creation
 */
export function resetCryptoAdapter(): void {
  cryptoInstance = null;
}

/**
 * Check if mock crypto is enabled
 *
 * @returns {boolean} true if USE_MOCK_CRYPTO=true
 */
export function isMockCryptoEnabled(): boolean {
  return process.env.USE_MOCK_CRYPTO === 'true';
}
