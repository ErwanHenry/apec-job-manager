/**
 * DispensationRepository PostgreSQL Implementation
 *
 * Implements the DispensationRepository interface from domain layer
 * Handles pharmacy dispensation records and items
 */

import { db } from '@/lib/db/client';
import { dispensations, dispensationItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { DispensationRepository } from '@/domain/repositories/dispensation-repository';
import type {
  Dispensation,
  NewDispensation,
  DispensationItem,
  NewDispensationItem,
} from '@/lib/db/schema';

// MVP: Simplified implementation - full interface compliance deferred to Phase 2
export class DispensationRepositoryPostgres {
  /**
   * Find dispensation by UUID ID
   */
  async findById(id: string): Promise<Dispensation | null> {
    const [dispensation] = await db
      .select()
      .from(dispensations)
      .where(eq(dispensations.id, id))
      .limit(1);

    return dispensation || null;
  }

  /**
   * Find all dispensations for a prescription
   * Usually 0 or 1, but can be multiple for partial dispensations
   */
  async findByPrescriptionId(prescriptionId: string): Promise<Dispensation[]> {
    return await db
      .select()
      .from(dispensations)
      .where(eq(dispensations.prescriptionId, prescriptionId));
  }

  /**
   * Find all dispensations by pharmacist
   */
  async findByPharmacistId(pharmacistId: string): Promise<Dispensation[]> {
    return await db
      .select()
      .from(dispensations)
      .where(eq(dispensations.pharmacistId, pharmacistId));
  }

  /**
   * Find all dispensations by pharmacy
   */
  async findByPharmacyId(pharmacyId: string): Promise<Dispensation[]> {
    return await db
      .select()
      .from(dispensations)
      .where(eq(dispensations.pharmacyId, pharmacyId));
  }

  /**
   * Create new dispensation record
   */
  async create(data: NewDispensation): Promise<Dispensation> {
    const [dispensation] = await db.insert(dispensations).values(data).returning();

    return dispensation;
  }

  /**
   * Get dispensation items (what was dispensed)
   */
  async getItems(dispensationId: string): Promise<DispensationItem[]> {
    return await db
      .select()
      .from(dispensationItems)
      .where(eq(dispensationItems.dispensationId, dispensationId));
  }

  /**
   * Create dispensation items (medications dispensed)
   * Usually called right after creating the dispensation record
   */
  async createItems(items: NewDispensationItem[]): Promise<DispensationItem[]> {
    const created = await db
      .insert(dispensationItems)
      .values(items)
      .returning();

    return created;
  }

  /**
   * Update dispensation
   */
  async update(id: string, data: Partial<Dispensation>): Promise<Dispensation> {
    const [dispensation] = await db
      .update(dispensations)
      .set(data as any)
      .where(eq(dispensations.id, id))
      .returning();

    return dispensation;
  }

  /**
   * Get all dispensations (paginated, rarely used)
   */
  async getAll(options?: { limit?: number; offset?: number }): Promise<Dispensation[]> {
    return await db
      .select()
      .from(dispensations)
      .limit(options?.limit || 100);
  }
}
