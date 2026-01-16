/**
 * DispensationRepository Interface
 * Domain port for dispensation (pharmacy delivery) data access
 */

import type {
  Dispensation,
  NewDispensation,
  DispensationItem,
} from '@/lib/db/schema';

export interface DispensationRepository {
  /**
   * Find dispensation by ID
   */
  findById(id: string): Promise<Dispensation | null>;

  /**
   * Get all dispensations for a prescription
   */
  getPrescriptionDispensations(prescriptionId: string): Promise<Dispensation[]>;

  /**
   * Get all dispensations for a pharmacy
   */
  getPharmacyDispensations(
    pharmacyId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Dispensation[]>;

  /**
   * Get all dispensations by pharmacist
   */
  getPharmacistDispensations(
    pharmacistId: string,
    options?: { limit?: number },
  ): Promise<Dispensation[]>;

  /**
   * Create a new dispensation record
   */
  create(data: NewDispensation): Promise<Dispensation>;

  /**
   * Get dispensation items
   */
  getItems(dispensationId: string): Promise<DispensationItem[]>;

  /**
   * Get dispensations for a date range
   */
  getByDateRange(startDate: Date, endDate: Date): Promise<Dispensation[]>;

  /**
   * Get dispensations for a patient across all pharmacies
   */
  getPatientDispensations(patientId: string): Promise<Dispensation[]>;

  /**
   * Get dispensation with complete details
   */
  getComplete(id: string): Promise<any | null>;

  /**
   * Check if prescription has been dispensed at this pharmacy
   */
  hasBeenDispensedAt(
    prescriptionId: string,
    pharmacyId: string,
  ): Promise<boolean>;
}
