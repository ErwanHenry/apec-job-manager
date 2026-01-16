/**
 * Dispensation Server Actions
 *
 * 'use server' - Runs on server only
 * Handles QR scanning and prescription dispensation (pharmacist workflow)
 * Performs real ECDSA P-256 signature verification and anti-replay checks
 */

'use server';

import { requireAuth } from '@/lib/auth';
import { PrescriptionRepositoryPostgres } from '@/infrastructure/databases/postgres/prescription-repository-postgres';
import { DispensationRepositoryPostgres } from '@/infrastructure/databases/postgres/dispensation-repository-postgres';
import { getCryptoAdapter } from '@/infrastructure/crypto/crypto-factory';
import { serializePrescription } from '@/lib/serialize-dates';
import { db } from '@/lib/db/client';
import { prescriptions, nonceRecords, fraudAlerts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Scan QR code and retrieve prescription details
 * Called when pharmacist scans/pastes QR code
 *
 * Returns: { success, prescription, verified }
 */
export async function scanQRAction(qrPayload: string): Promise<
  | {
      success: true;
      prescription: any;
      verified: boolean;
      prescriptionId: string;
      prescriptionNumber: string;
    }
  | { success: false; error: string }
> {
  try {
    // Verify user is pharmacist
    await requireAuth('pharmacist');

    const crypto = getCryptoAdapter();

    // 1. Decode QR payload (broadcast mode: base64-encoded JSON with signature)
    let data;
    try {
      const decodedStr = Buffer.from(qrPayload, 'base64').toString('utf-8');
      data = JSON.parse(decodedStr);
    } catch (error) {
      console.error('[ScanQR] Invalid QR payload format:', error);
      return { success: false, error: 'Invalid QR code format' };
    }

    if (!data.prescriptionId) {
      return { success: false, error: 'Invalid QR payload - missing prescriptionId' };
    }

    // 2. Fetch complete prescription (with patient, prescriber, items)
    const prescriptionRepo = new PrescriptionRepositoryPostgres();
    const prescription = await prescriptionRepo.getComplete(data.prescriptionId);

    if (!prescription) {
      return { success: false, error: 'Prescription not found' };
    }

    // 3. Real signature verification (ECDSA P-256)
    // Load prescriber's public key from database
    const verified = crypto.verifySignature(
      data.signature,
      prescription.payloadHash,
      prescription.prescriber.publicKeyEcdsa,
    );

    if (!verified) {
      // Signature verification failed - potential forgery or tampering
      await db.insert(fraudAlerts).values({
        alertType: 'invalid_signature',
        severity: 'critical',
        prescriptionId: prescription.id,
        pharmacyId: null,
        pharmacistId: null,
        description: `Invalid signature detected on prescription ${prescription.prescriptionNumber}. Possible forgery or tampering.`,
        details: JSON.stringify({
          qrSignature: data.signature,
          databaseSignature: prescription.signature,
          prescriberPublicKey: prescription.prescriber.publicKeyEcdsa,
        }),
      } as any);

      return {
        success: false,
        error: 'Signature verification failed - prescription cannot be dispensed',
      };
    }

    // 4. Additional prescription status checks
    if (prescription.status === 'fully_dispensed') {
      return {
        success: false,
        error: 'Prescription already fully dispensed',
      };
    }

    if (prescription.status === 'cancelled') {
      return {
        success: false,
        error: 'Prescription cancelled',
      };
    }

    if (prescription.status === 'expired') {
      return {
        success: false,
        error: 'Prescription expired',
      };
    }

    // 5. Anti-replay check: ENFORCE nonce verification (CRITICAL SECURITY FIX)
    const [nonceRecord] = await db
      .select()
      .from(nonceRecords)
      .where(eq(nonceRecords.nonce, data.nonce))
      .limit(1);

    if (!nonceRecord) {
      // Nonce not found in database - invalid
      await db.insert(fraudAlerts).values({
        alertType: 'invalid_nonce',
        severity: 'high',
        prescriptionId: prescription.id,
        pharmacyId: null,
        pharmacistId: null,
        description: `Nonce not found in database. Possible forged prescription.`,
        details: JSON.stringify({ nonce: data.nonce }),
      } as any);

      return {
        success: false,
        error: 'Nonce verification failed - prescription appears invalid',
      };
    }

    if (nonceRecord.usedAt) {
      // CRITICAL: Nonce already used - REPLAY ATTACK DETECTED
      // This blocks duplicate dispensation attempts
      await db.insert(fraudAlerts).values({
        alertType: 'replay_attempt',
        severity: 'critical',
        prescriptionId: prescription.id,
        pharmacyId: null,
        pharmacistId: null,
        description: `Replay attack blocked! Nonce was already used at ${nonceRecord.usedAt}. Prescription already dispensed.`,
        details: JSON.stringify({
          nonce: data.nonce,
          previousUseTime: nonceRecord.usedAt,
          currentAttemptTime: new Date(),
        }),
      } as any);

      return {
        success: false,
        error: 'Replay attack blocked - prescription already dispensed. Fraud alert created.',
      };
    }

    // Verify nonce hasn't expired
    if (new Date(nonceRecord.expiresAt) < new Date()) {
      await db.insert(fraudAlerts).values({
        alertType: 'expired_nonce',
        severity: 'medium',
        prescriptionId: prescription.id,
        pharmacyId: null,
        pharmacistId: null,
        description: `Prescription nonce expired at ${nonceRecord.expiresAt}`,
        details: JSON.stringify({
          nonce: data.nonce,
          expiresAt: nonceRecord.expiresAt,
          currentTime: new Date(),
        }),
      } as any);

      return {
        success: false,
        error: 'Prescription nonce expired',
      };
    }

    return {
      success: true,
      prescription: serializePrescription(prescription),
      verified,
      prescriptionId: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
    };
  } catch (error) {
    console.error('[ScanQR] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scan prescription',
    };
  }
}

/**
 * Dispense prescription (record pharmacy delivery)
 * Called when pharmacist confirms dispensation
 *
 * Returns: { success, dispensation }
 */
export async function dispenseAction(
  prescriptionId: string,
  items: Array<{
    prescriptionItemId: string;
    quantity: number;
  }>,
): Promise<
  | { success: true; dispensation: any; dispensationId: string }
  | { success: false; error: string }
> {
  try {
    // Verify user is pharmacist
    const currentUser = await requireAuth('pharmacist');

    if (!currentUser.establishmentId) {
      return { success: false, error: 'Pharmacist not associated with pharmacy' };
    }

    // 1. Fetch complete prescription (with prescriber details)
    const prescriptionRepo = new PrescriptionRepositoryPostgres();
    const prescription = await prescriptionRepo.getComplete(prescriptionId);

    if (!prescription) {
      return { success: false, error: 'Prescription not found' };
    }

    // 2. Create dispensation record with real signature verification
    // Re-verify signature for dispensation record
    const crypto = getCryptoAdapter();
    let signatureVerified = false;

    try {
      signatureVerified = crypto.verifySignature(
        prescription.signature,
        prescription.payloadHash,
        prescription.prescriber.publicKeyEcdsa,
      );
    } catch (error) {
      console.error('[Dispense] Signature verification error:', error);
      signatureVerified = false;
    }

    const dispensationRepo = new DispensationRepositoryPostgres();
    const dispensation = await dispensationRepo.create({
      prescriptionId: prescriptionId,
      pharmacyId: currentUser.establishmentId,
      pharmacistId: currentUser.id,
      dispensationType: 'full', // MVP: Always full dispensation
      signatureVerified: signatureVerified, // Real verification
      nonceVerified: true, // Already verified in scanQRAction
      verificationMode: 'online',
      dispensedAt: new Date(),
    });

    // 3. Create dispensation items
    const dispensationItems = await dispensationRepo.createItems(
      items.map(item => ({
        dispensationId: dispensation.id,
        prescriptionItemId: item.prescriptionItemId,
        quantityDispensed: item.quantity,
        substituted: false,
        substitutionReason: null,
      })),
    );

    // 4. Update prescription status
    const updatedPrescription = await prescriptionRepo.updateStatus(
      prescriptionId,
      'fully_dispensed',
    );

    // 5. Mark nonce as used (anti-replay)
    const [nonceRecord] = await db
      .select()
      .from(nonceRecords)
      .where(eq(nonceRecords.nonce, prescription.nonce))
      .limit(1);

    if (nonceRecord) {
      await db
        .update(nonceRecords)
        .set({ usedAt: new Date() })
        .where(eq(nonceRecords.id, nonceRecord.id));
    }

    return {
      success: true,
      dispensation,
      dispensationId: dispensation.id,
    };
  } catch (error) {
    console.error('[Dispense] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to dispense prescription',
    };
  }
}
