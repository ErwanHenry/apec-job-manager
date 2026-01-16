/**
 * PatientRepository Interface
 * Domain port for patient data access (hexagonal architecture)
 * Implementations will handle PostgreSQL queries via Drizzle ORM
 */

import type { Patient, NewPatient } from '@/lib/db/schema';

export interface PatientRepository {
  /**
   * Find patient by INS number (unique identifier)
   */
  findByInsNumber(insNumber: string): Promise<Patient | null>;

  /**
   * Find patient by ID
   */
  findById(id: string): Promise<Patient | null>;

  /**
   * Search patients by name and date of birth
   */
  search(options: {
    firstName?: string;
    lastName?: string;
    birthDate?: Date;
  }): Promise<Patient[]>;

  /**
   * Create a new patient
   */
  create(data: NewPatient): Promise<Patient>;

  /**
   * Update patient information
   */
  update(id: string, data: Partial<NewPatient>): Promise<Patient>;

  /**
   * Get all prescriptions for a patient
   */
  getPrescriptions(patientId: string): Promise<any[]>;

  /**
   * Check if patient exists by INS
   */
  existsByInsNumber(insNumber: string): Promise<boolean>;
}
