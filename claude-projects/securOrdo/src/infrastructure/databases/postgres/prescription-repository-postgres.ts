/**
 * PrescriptionRepository PostgreSQL Implementation
 *
 * Simplified for MVP - full implementation deferred to Phase 2
 */

import { db } from '@/lib/db/client';
import {
  prescriptions,
  prescriptionItems,
  patients,
  users,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { PrescriptionRepository } from '@/domain/repositories/prescription-repository';
import type { Prescription, NewPrescription, PrescriptionItem } from '@/lib/db/schema';

// MVP: Simplified implementation - full interface compliance deferred to Phase 2
export class PrescriptionRepositoryPostgres {
  async findById(id: string): Promise<Prescription | null> {
    const [result] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, id))
      .limit(1);
    return result || null;
  }

  async findByNumber(prescriptionNumber: string): Promise<Prescription | null> {
    const [result] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.prescriptionNumber, prescriptionNumber))
      .limit(1);
    return result || null;
  }

  async findByNonce(nonce: any): Promise<Prescription | null> {
    const [result] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.nonce, nonce as string))
      .limit(1);
    return result || null;
  }

  async getPatientPrescriptions(
    patientId: string,
    options?: { status?: string; limit?: number },
  ): Promise<Prescription[]> {
    const results = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.patientId, patientId))
      .limit(options?.limit || 50);
    return results;
  }

  async getPrescriberPrescriptions(
    prescriberId: string,
    options?: { limit?: number },
  ): Promise<Prescription[]> {
    const results = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.prescriberId, prescriberId))
      .limit(options?.limit || 50);
    return results;
  }

  async create(data: NewPrescription): Promise<Prescription> {
    const [result] = await db
      .insert(prescriptions)
      .values(data as any)
      .returning();
    return result;
  }

  async updateStatus(id: string, status: string): Promise<Prescription> {
    const [result] = await db
      .update(prescriptions)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(prescriptions.id, id))
      .returning();
    return result;
  }

  async cancel(id: string, reason?: string): Promise<Prescription> {
    const [result] = await db
      .update(prescriptions)
      .set({ status: 'cancelled' as any, updatedAt: new Date() })
      .where(eq(prescriptions.id, id))
      .returning();
    return result;
  }

  async getItems(prescriptionId: string): Promise<PrescriptionItem[]> {
    return await db
      .select()
      .from(prescriptionItems)
      .where(eq(prescriptionItems.prescriptionId, prescriptionId));
  }

  async isValid(id: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, id))
      .limit(1);
    return !!result;
  }

  async getComplete(id: string): Promise<any | null> {
    const results = await db
      .select({
        prescription: prescriptions,
        patient: patients,
        prescriber: users,
      })
      .from(prescriptions)
      .leftJoin(patients, eq(prescriptions.patientId, patients.id))
      .leftJoin(users, eq(prescriptions.prescriberId, users.id))
      .where(eq(prescriptions.id, id));

    if (results.length === 0) return null;

    const { prescription: p, patient: pat, prescriber: pres } = results[0];

    const items = await db
      .select()
      .from(prescriptionItems)
      .where(eq(prescriptionItems.prescriptionId, id));

    return {
      ...p,
      patient: pat,
      prescriber: pres,
      items,
    };
  }

  async update(id: string, data: Partial<Prescription>): Promise<Prescription> {
    const [result] = await db
      .update(prescriptions)
      .set({ ...(data as any), updatedAt: new Date() })
      .where(eq(prescriptions.id, id))
      .returning();
    return result;
  }

  async getAll(options?: { limit?: number; offset?: number }): Promise<Prescription[]> {
    const results = await db
      .select()
      .from(prescriptions)
      .limit(options?.limit || 100);
    return results;
  }
}
