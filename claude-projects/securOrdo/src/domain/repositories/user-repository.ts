/**
 * UserRepository Interface
 * Domain port for user (healthcare professional) data access
 */

import type { User, NewUser } from '@/lib/db/schema';

export interface UserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by RPPS number (professional identifier)
   */
  findByRppsNumber(rppsNumber: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by public key fingerprint (for crypto operations)
   */
  findByPublicKeyFingerprint(
    fingerprint: string,
  ): Promise<User | null>;

  /**
   * Get all users of a specific role
   */
  getByRole(role: string): Promise<User[]>;

  /**
   * Get all users from an establishment
   */
  getByEstablishment(establishmentId: string): Promise<User[]>;

  /**
   * Create a new user
   */
  create(data: NewUser): Promise<User>;

  /**
   * Update user information
   */
  update(id: string, data: Partial<NewUser>): Promise<User>;

  /**
   * Deactivate a user (soft delete)
   */
  deactivate(id: string): Promise<User>;

  /**
   * Activate a user
   */
  activate(id: string): Promise<User>;

  /**
   * Verify user password
   */
  verifyPassword(userId: string, password: string): Promise<boolean>;

  /**
   * Update user password
   */
  updatePassword(userId: string, newPassword: string): Promise<void>;

  /**
   * Check if user is active and has valid credentials
   */
  isValidAndActive(userId: string): Promise<boolean>;
}
