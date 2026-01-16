/**
 * NonceRepository Interface
 * Domain port for nonce (anti-replay) records
 * Critical security component for preventing prescription reuse attacks
 */

import type { NonceRecord, NewNonceRecord } from '@/lib/db/schema';

export interface NonceRepository {
  /**
   * Check if a nonce has been used (exists with usedAt timestamp)
   */
  isUsed(nonce: string): Promise<boolean>;

  /**
   * Check if a nonce exists and is still valid (not expired)
   */
  isValid(nonce: string): Promise<boolean>;

  /**
   * Record a new nonce (when prescription is created)
   */
  create(data: NewNonceRecord): Promise<NonceRecord>;

  /**
   * Mark a nonce as used (when prescription is dispensed)
   * Returns the nonce record or null if not found
   */
  markAsUsed(nonce: string): Promise<NonceRecord | null>;

  /**
   * Get nonce record by value
   */
  findByNonce(nonce: string): Promise<NonceRecord | null>;

  /**
   * Get all nonces for a prescription
   */
  getForPrescription(prescriptionId: string): Promise<NonceRecord[]>;

  /**
   * Get expired nonces (cleanup purpose)
   */
  getExpired(): Promise<NonceRecord[]>;

  /**
   * Delete expired nonces (cleanup)
   */
  deleteExpired(): Promise<number>;

  /**
   * Sync offline nonces (when pharmacy comes back online)
   * Resolves conflicts between offline-recorded nonces and server state
   */
  syncOfflineNonces(
    offlineNonces: Array<{ nonce: string; usedAt: Date }>,
  ): Promise<{ synced: number; conflicts: string[] }>;

  /**
   * Get nonce statistics (for monitoring)
   */
  getStats(): Promise<{
    total: number;
    used: number;
    valid: number;
    expired: number;
  }>;
}
