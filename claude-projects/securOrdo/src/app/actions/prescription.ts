/**
 * Prescription Server Actions
 *
 * 'use server' - Runs on server only
 * Handles prescription creation and retrieval
 * Uses real ECDSA P-256 signatures and cryptographic nonces
 */

'use server';

import { requireAuth } from '@/lib/auth';
import { PrescriptionRepositoryPostgres } from '@/infrastructure/databases/postgres/prescription-repository-postgres';
import { PatientRepositoryPostgres } from '@/infrastructure/databases/postgres/patient-repository-postgres';
import { getCryptoAdapter } from '@/infrastructure/crypto/crypto-factory';
import { db } from '@/lib/db/client';
import { prescriptionItems, nonceRecords } from '@/lib/db/schema';
import fs from 'fs';
import path from 'path';

/**
 * Create prescription
 * Called by prescriber after selecting patient and medications
 *
 * Returns: { success, prescription, qrPayload, prescriptionNumber }
 */
export async function createPrescriptionAction(data: {
  patientId: string;
  patientInsNumber: string;
  items: Array<{
    ciscode: string;
    dci: string;
    commercialName: string;
    dosage: string;
    pharmaceuticalForm: string;
    administrationRoute: string;
    posology: string;
    quantity: number;
    durationDays: number;
  }>;
}): Promise<
  | { success: true; prescription: any; qrPayload: string; prescriptionNumber: string }
  | { success: false; error: string }
> {
  try {
    // 1. Verify user is prescriber
    const currentUser = await requireAuth('prescriber');

    // 2. Generate prescription number
    // Format: FR-RPPS-YYYYMMDD-SEQ-CHK
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    const prescriptionNumber = `FR-${currentUser.rppsNumber}-${dateStr}-${seq}-XX`;

    // 3. Get crypto adapter (real or mock based on feature flag)
    const crypto = getCryptoAdapter();
    const nonce = crypto.generateNonce();

    // Load prescriber private key from test keys file
    let prescriberPrivateKey = '';
    try {
      const keysPath = path.join(process.cwd(), '.keys.test.json');
      const keysContent = fs.readFileSync(keysPath, 'utf-8');
      const keysData = JSON.parse(keysContent);

      // Find prescriber by RPPS number
      let found = false;
      for (const prescriberName in keysData.prescribers) {
        const prescriberEntry = keysData.prescribers[prescriberName];
        if (prescriberEntry.rppsNumber === currentUser.rppsNumber) {
          prescriberPrivateKey = prescriberEntry.privateKey;
          found = true;
          break;
        }
      }

      if (!found) {
        return {
          success: false,
          error: `Prescriber keys not found for RPPS: ${currentUser.rppsNumber}`,
        };
      }

      if (!prescriberPrivateKey) {
        return {
          success: false,
          error: 'Prescriber private key is empty',
        };
      }
    } catch (error) {
      console.error('[CreatePrescription] Failed to load prescriber keys:', error);
      return {
        success: false,
        error: 'Cryptographic keys not available. Run: npm run keys:generate',
      };
    }

    const payload = {
      prescriptionNumber,
      patientId: data.patientId,
      patientInsNumber: data.patientInsNumber,
      items: data.items,
      nonce,
      timestamp: Date.now(),
    };

    // Sign with real ECDSA P-256 (deterministic, RFC 6979)
    const payloadHash = crypto.hashPayload(payload);
    const signature = crypto.signPrescription(payload, prescriberPrivateKey);

    // 4. Calculate valid until (1 year from now)
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    // 5. Create prescription in database
    const prescriptionRepo = new PrescriptionRepositoryPostgres();
    const prescription = await prescriptionRepo.create({
      prescriptionNumber,
      prescriberId: currentUser.id,
      patientId: data.patientId,
      status: 'active',
      validUntil: validUntil.toISOString().split('T')[0], // DATE format
      nonce,
      signature,
      payloadHash,
    });

    // 6. Create prescription items
    for (const item of data.items) {
      await db.insert(prescriptionItems).values({
        prescriptionId: prescription.id,
        ciscode: item.ciscode,
        dci: item.dci,
        commercialName: item.commercialName,
        dosage: item.dosage,
        pharmaceuticalForm: item.pharmaceuticalForm,
        administrationRoute: item.administrationRoute,
        posology: item.posology,
        quantity: item.quantity,
        durationDays: item.durationDays,
        renewalsAllowed: 0,
        nonSubstituable: false,
      });
    }

    // 7. Store nonce in nonce_records (anti-replay protection)
    // Nonce expires after 24 hours (configurable)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await db.insert(nonceRecords).values({
      nonce: nonce,
      prescriptionId: prescription.id,
      expiresAt: expiresAt,
      usedAt: null,
      verificationMode: 'online',
    });

    // 8. Generate QR code payload (broadcast mode: base64-encoded JSON with signature)
    // Broadcast mode allows any pharmacy to scan and verify signature
    // Targeted mode (Phase 3b): Will use ECIES encryption for specific pharmacy
    const qrData = {
      prescriptionId: prescription.id,
      prescriptionNumber,
      patientInsNumber: data.patientInsNumber,
      signature, // Real ECDSA signature for verification
      nonce, // Anti-replay protection
      timestamp: payload.timestamp,
    };

    // Encode as base64 for QR code (not encrypted for broadcast mode)
    const qrPayload = Buffer.from(JSON.stringify(qrData)).toString('base64');

    return {
      success: true,
      prescription,
      qrPayload,
      prescriptionNumber,
    };
  } catch (error) {
    console.error('[CreatePrescription] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create prescription',
    };
  }
}

/**
 * Get prescriber's prescriptions (last 50)
 */
export async function getPrescriberPrescriptionsAction(): Promise<
  | { success: true; prescriptions: any[] }
  | { success: false; error: string }
> {
  try {
    const currentUser = await requireAuth('prescriber');

    const prescriptionRepo = new PrescriptionRepositoryPostgres();
    const prescriptions = await prescriptionRepo.getPrescriberPrescriptions(currentUser.id, {
      limit: 50,
    });

    return {
      success: true,
      prescriptions,
    };
  } catch (error) {
    console.error('[GetPrescriberPrescriptions] Error:', error);
    return {
      success: false,
      error: 'Failed to fetch prescriptions',
    };
  }
}

/**
 * Get single prescription (for editing)
 */
export async function getPrescriptionAction(
  prescriptionId: string,
): Promise<
  | { success: true; prescription: any }
  | { success: false; error: string }
> {
  try {
    await requireAuth();

    const prescriptionRepo = new PrescriptionRepositoryPostgres();
    const prescription = await prescriptionRepo.findById(prescriptionId);

    if (!prescription) {
      return {
        success: false,
        error: 'Prescription not found',
      };
    }

    return {
      success: true,
      prescription,
    };
  } catch (error) {
    console.error('[GetPrescription] Error:', error);
    return {
      success: false,
      error: 'Failed to fetch prescription',
    };
  }
}
