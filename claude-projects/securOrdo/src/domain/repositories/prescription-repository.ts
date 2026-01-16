/**
 * PrescriptionRepository Interface
 * Domain port for prescription data access
 */

import type {
  Prescription,
  NewPrescription,
  PrescriptionItem,
} from '@/lib/db/schema';

export interface PrescriptionRepository {
  /**
   * Find prescription by ID
   */
  findById(id: string): Promise<Prescription | null>;

  /**
   * Find prescription by prescription number (unique)
   */
  findByNumber(prescriptionNumber: string): Promise<Prescription | null>;

  /**
   * Find prescription by nonce (for replay attack detection)
   */
  findByNonce(nonce: Uint8Array): Promise<Prescription | null>;

  /**
   * Get all prescriptions for a patient
   */
  getPatientPrescriptions(
    patientId: string,
    options?: { status?: string; limit?: number },
  ): Promise<Prescription[]>;

  /**
   * Get all prescriptions by prescriber
   */
  getPrescriberPrescriptions(
    prescriberId: string,
    options?: { limit?: number },
  ): Promise<Prescription[]>;

  /**
   * Create a new prescription
   */
  create(data: NewPrescription): Promise<Prescription>;

  /**
   * Update prescription status
   */
  updateStatus(id: string, status: string): Promise<Prescription>;

  /**
   * Cancel a prescription (set status to 'cancelled')
   */
  cancel(id: string, reason?: string): Promise<Prescription>;

  /**
   * Get prescription items (medications)
   */
  getItems(prescriptionId: string): Promise<PrescriptionItem[]>;

  /**
   * Check if prescription is valid (not expired, not cancelled)
   */
  isValid(id: string): Promise<boolean>;

  /**
   * Get prescription with all related data (items, patient, prescriber)
   */
  getComplete(id: string): Promise<any | null>;
}
