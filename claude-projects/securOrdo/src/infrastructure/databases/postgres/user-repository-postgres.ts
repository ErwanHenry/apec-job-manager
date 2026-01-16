/**
 * UserRepository PostgreSQL Implementation
 *
 * Implements the UserRepository interface from domain layer
 * Direct Drizzle ORM queries (MVP - can refactor to DTOs/mappers in Phase 2)
 */

import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { UserRepository } from '@/domain/repositories/user-repository';
import type { User, NewUser } from '@/lib/db/schema';

// MVP: Simplified implementation - full interface compliance deferred to Phase 2
export class UserRepositoryPostgres {
  /**
   * Find user by UUID ID
   */
  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    return user || null;
  }

  /**
   * Find user by email address
   */
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    return user || null;
  }

  /**
   * Find user by RPPS number (healthcare professional identifier)
   */
  async findByRppsNumber(rppsNumber: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.rppsNumber, rppsNumber)).limit(1);

    return user || null;
  }

  /**
   * Find user by ADELI number (pharmacist identifier)
   */
  async findByAdeliNumber(adeliNumber: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.adeliNumber, adeliNumber))
      .limit(1);

    return user || null;
  }

  /**
   * Verify user password (simple SHA-256 for MVP)
   * Phase 2: Use bcrypt comparison
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) {
      return false;
    }

    // MVP: Direct hash comparison
    // Phase 2: Use bcrypt.compare()
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(password).digest('hex');

    return user.passwordHash === hash;
  }

  /**
   * Create new user
   */
  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();

    return user;
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return user;
  }

  /**
   * Get all users (paginated)
   */
  async getAll(options?: { limit?: number; offset?: number }): Promise<User[]> {
    return await db.select().from(users).limit(options?.limit || 100);
  }

  /**
   * Get users by role
   */
  async getByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  /**
   * Get users by establishment
   */
  async getByEstablishment(establishmentId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.establishmentId, establishmentId));
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    return !!user;
  }

  /**
   * Check if RPPS number exists
   */
  async rppsNumberExists(rppsNumber: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.rppsNumber, rppsNumber))
      .limit(1);

    return !!user;
  }

  /**
   * Delete user (soft delete would be better)
   */
  async delete(id: string): Promise<void> {
    // Note: In production, use soft delete (add deletedAt field)
    // For MVP, we'll just leave it for now
  }
}
