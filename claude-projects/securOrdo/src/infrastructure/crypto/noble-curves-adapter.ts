/**
 * NobleCurvesAdapter - Production Cryptography Implementation
 *
 * Uses audited @noble/curves library for:
 * - ECDSA P-256 signatures (RFC 6979 deterministic k)
 * - ECIES hybrid encryption (ECDH + HKDF + AES-256-GCM)
 * - Cryptographically secure nonce generation
 *
 * Key Features:
 * - Zero dependencies (audited cryptography)
 * - Deterministic signatures (RFC 6979)
 * - Authenticated encryption (AES-256-GCM)
 * - Secure key derivation (HKDF-SHA256)
 * - Compressed public key format (33 bytes)
 *
 * @noble/curves is used by MetaMask, Solana, Ethereum, and other major projects
 * GitHub: https://github.com/paulmillr/noble-curves
 */

import { p256 } from '@noble/curves/p256';
import { sha256 } from '@noble/hashes/sha256';
import { hkdf } from '@noble/hashes/hkdf';
import { randomBytes } from 'crypto'; // Node.js native crypto

export interface KeyPair {
  publicKey: string; // 66 hex chars (33 bytes compressed)
  privateKey: string; // 64 hex chars (32 bytes)
  fingerprint: string; // 16 hex chars (8 bytes)
}

export class NobleCurvesAdapter {
  /**
   * Convert hex string to Uint8Array
   */
  private hexToBytes(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) {
      throw new Error(`Invalid hex string: ${hex}`);
    }
    return Uint8Array.from(Buffer.from(hex, 'hex'));
  }

  /**
   * Convert Uint8Array to hex string
   */
  private bytesToHex(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('hex');
  }

  /**
   * Generate ECDSA P-256 key pair
   *
   * Returns:
   * - publicKey: 33 bytes compressed (66 hex chars)
   * - privateKey: 32 bytes (64 hex chars)
   * - fingerprint: 16 hex chars for key identification
   *
   * @returns {KeyPair} Generated key pair
   */
  generateKeyPair(): KeyPair {
    try {
      // Generate random 32-byte private key
      const privateKeyBytes = p256.utils.randomPrivateKey();
      const privateKeyHex = this.bytesToHex(privateKeyBytes);

      // Derive compressed public key (33 bytes)
      const publicKeyBytes = p256.getPublicKey(privateKeyBytes, true); // true = compressed
      const publicKeyHex = this.bytesToHex(publicKeyBytes);

      // Fingerprint: first 16 hex chars of public key
      const fingerprint = publicKeyHex.slice(0, 16);

      return {
        publicKey: publicKeyHex,
        privateKey: privateKeyHex,
        fingerprint,
      };
    } catch (error) {
      throw new Error(`Key generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hash payload with SHA-256
   *
   * Used as input to ECDSA signing. Always produces consistent hash for same payload.
   *
   * @param payload - Any JSON-serializable object
   * @returns 64 hex chars (32 bytes SHA-256 hash)
   */
  hashPayload(payload: any): string {
    try {
      const json = JSON.stringify(payload);
      const bytes = new TextEncoder().encode(json);
      const hash = sha256(bytes);
      return this.bytesToHex(hash);
    } catch (error) {
      throw new Error(`Hashing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Sign prescription payload with ECDSA P-256
   *
   * Algorithm:
   * 1. Hash payload with SHA-256
   * 2. Sign hash with ECDSA P-256 (RFC 6979 deterministic k)
   * 3. Return signature in compact form (64 bytes)
   *
   * The same payload will always produce the same signature (deterministic),
   * which is important for reproducible tests but doesn't weaken security.
   *
   * @param payload - Prescription data to sign
   * @param privateKeyHex - Prescriber's private key (64 hex chars)
   * @returns 128 hex chars (64 bytes ECDSA signature)
   */
  signPrescription(payload: any, privateKeyHex: string): string {
    try {
      // 1. Hash payload
      const payloadJson = JSON.stringify(payload);
      const payloadBytes = new TextEncoder().encode(payloadJson);
      const hash = sha256(payloadBytes);

      // 2. Sign with ECDSA P-256
      // RFC 6979: deterministic k-value (same payload = same signature)
      const privateKeyBytes = this.hexToBytes(privateKeyHex);
      const signature = p256.sign(hash, privateKeyBytes);

      // 3. Return compact form: 64 bytes (r and s, 32 bytes each)
      return this.bytesToHex(signature.toCompactRawBytes());
    } catch (error) {
      throw new Error(
        `Prescription signing failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Verify ECDSA P-256 signature
   *
   * Uses prescriber's public key to verify that:
   * 1. The payload hasn't been tampered with
   * 2. The signature was actually created by the prescriber
   *
   * Invalid signatures could indicate:
   * - Forged prescription (attacker created)
   * - Tampered payload (prescription modified after signing)
   *
   * Returns false for any invalid signature (doesn't throw).
   *
   * @param signatureHex - 128 hex chars (64 bytes ECDSA signature)
   * @param payloadHashHex - 64 hex chars (32 bytes SHA-256 hash)
   * @param publicKeyHex - 66 hex chars (33 bytes compressed ECDSA public key)
   * @returns true if valid, false otherwise
   */
  verifySignature(signatureHex: string, payloadHashHex: string, publicKeyHex: string): boolean {
    try {
      // Convert inputs
      const signatureBytes = this.hexToBytes(signatureHex);
      const hashBytes = this.hexToBytes(payloadHashHex);
      const publicKeyBytes = this.hexToBytes(publicKeyHex);

      // Verify with p256
      return p256.verify(signatureBytes, hashBytes, publicKeyBytes);
    } catch (error) {
      // Invalid signature format → return false instead of throwing
      console.error('[CryptoAdapter.verifySignature] Error:', error);
      return false;
    }
  }

  /**
   * Encrypt payload with ECIES (Elliptic Curve Integrated Encryption Scheme)
   *
   * Algorithm (ECDH + HKDF + AES-256-GCM):
   * 1. Generate ephemeral key pair
   * 2. Perform ECDH with recipient's public key
   * 3. Derive AES-256 key using HKDF-SHA256
   * 4. Encrypt payload with AES-256-GCM
   * 5. Package and return: ephemeralPublicKey || IV || ciphertext || authTag
   *
   * Key Properties:
   * - Forward secrecy: Each encryption uses unique ephemeral key
   * - Authenticated encryption: GCM mode prevents tampering
   * - Key derivation: HKDF is NIST-approved and robust
   *
   * @param payload - Data to encrypt (will be JSON-stringified)
   * @param pharmacyPublicKeyHex - Recipient's ECIES public key (66 hex chars)
   * @returns Base64-encoded encrypted package
   */
  encryptPayload(payload: any, pharmacyPublicKeyHex: string): string {
    try {
      // Use Node.js crypto for AES (native, fast, audited)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const crypto = require('crypto');

      // 1. Generate ephemeral key pair
      const ephemeralPrivateKey = p256.utils.randomPrivateKey();
      const ephemeralPublicKey = p256.getPublicKey(ephemeralPrivateKey, true); // compressed

      // 2. ECDH: Derive shared secret with pharmacy's public key
      const pharmacyPublicKeyBytes = this.hexToBytes(pharmacyPublicKeyHex);
      const sharedSecret = p256.getSharedSecret(ephemeralPrivateKey, pharmacyPublicKeyBytes);

      // Remove point compression byte (first byte of uncompressed point)
      const sharedSecretStripped = sharedSecret.slice(1);

      // 3. HKDF: Derive AES-256 key (32 bytes)
      // Using empty salt and context (info) for simplicity
      const aesKey = hkdf(sha256, sharedSecretStripped, undefined, new Uint8Array(), 32);

      // 4. AES-256-GCM encryption
      const payloadJson = JSON.stringify(payload);
      const iv = randomBytes(12); // 96-bit IV for GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(aesKey), iv);

      let ciphertext = cipher.update(payloadJson, 'utf8');
      ciphertext = Buffer.concat([ciphertext, cipher.final()]);
      const authTag = cipher.getAuthTag(); // 16 bytes authentication tag

      // 5. Package: ephemeralPublicKey || IV || ciphertext || authTag
      const packagedData = Buffer.concat([Buffer.from(ephemeralPublicKey), iv, ciphertext, authTag]);

      return packagedData.toString('base64');
    } catch (error) {
      throw new Error(
        `ECIES encryption failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Decrypt ECIES-encrypted payload
   *
   * Reverses the encryption process:
   * 1. Extract ephemeralPublicKey, IV, ciphertext, authTag from package
   * 2. Perform ECDH with ephemeral public key
   * 3. Derive same AES-256 key using HKDF-SHA256
   * 4. Decrypt and verify with AES-256-GCM
   *
   * Verification:
   * - If auth tag doesn't match, GCM throws error (tampering detected)
   * - If any decryption step fails, throws error
   *
   * @param encryptedBase64 - Base64-encoded encrypted package
   * @param pharmacyPrivateKeyHex - Recipient's ECIES private key (64 hex chars)
   * @returns Decrypted and parsed original payload
   */
  decryptPayload(encryptedBase64: string, pharmacyPrivateKeyHex: string): any {
    try {
      // Use Node.js crypto for AES
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const crypto = require('crypto');

      // 1. Unpackage encrypted data
      const packagedData = Buffer.from(encryptedBase64, 'base64');

      const ephemeralPublicKey = packagedData.slice(0, 33); // First 33 bytes
      const iv = packagedData.slice(33, 45); // Next 12 bytes
      const authTagStart = packagedData.length - 16; // Last 16 bytes
      const ciphertext = packagedData.slice(45, authTagStart);
      const authTag = packagedData.slice(authTagStart);

      // 2. ECDH: Derive shared secret using pharmacy's private key
      const pharmacyPrivateKeyBytes = this.hexToBytes(pharmacyPrivateKeyHex);
      const sharedSecret = p256.getSharedSecret(pharmacyPrivateKeyBytes, ephemeralPublicKey);
      const sharedSecretStripped = sharedSecret.slice(1);

      // 3. HKDF: Derive same AES-256 key
      const aesKey = hkdf(sha256, sharedSecretStripped, undefined, new Uint8Array(), 32);

      // 4. AES-256-GCM decryption and verification
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(aesKey), iv);
      decipher.setAuthTag(authTag); // Will verify tag during decryption

      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return JSON.parse(decrypted.toString('utf8'));
    } catch (error) {
      throw new Error(
        `ECIES decryption failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate cryptographically secure 256-bit nonce
   *
   * Used for anti-replay protection:
   * - Each prescription gets unique nonce
   * - Nonce is stored and marked as "used" after dispensation
   * - Attempting to reuse same nonce is blocked (replay attack detection)
   *
   * Properties:
   * - 256-bit (32 bytes) of cryptographic entropy
   * - Uses Node.js randomBytes (CSPRNG)
   * - No collisions (cryptographically secure random)
   *
   * @returns 64 hex chars (32 bytes)
   */
  generateNonce(): string {
    return this.bytesToHex(randomBytes(32));
  }

  /**
   * Verify nonce against known value (for anti-replay checks)
   *
   * Helper method to compare nonces safely.
   *
   * @param providedNonce - Nonce from request (64 hex chars)
   * @param expectedNonce - Nonce from database (64 hex chars)
   * @returns true if nonces match
   */
  verifyNonce(providedNonce: string, expectedNonce: string): boolean {
    // Use constant-time comparison to prevent timing attacks
    // This is important even though nonces aren't secret
    if (providedNonce.length !== expectedNonce.length) {
      return false;
    }

    let match = 0;
    for (let i = 0; i < providedNonce.length; i++) {
      match |= providedNonce.charCodeAt(i) ^ expectedNonce.charCodeAt(i);
    }

    return match === 0;
  }
}

/**
 * Singleton instance for application-wide use
 * Can be replaced with mock adapter via factory pattern
 */
export const cryptoAdapter = new NobleCurvesAdapter();
