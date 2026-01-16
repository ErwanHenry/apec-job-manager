import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  date,
  pgEnum,
  uniqueIndex,
  index,
  foreignKey,
  decimal,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Enum Types
 */
export const userRoleEnum = pgEnum('user_role', [
  'prescriber',
  'pharmacist',
  'admin',
]);

export const insTypeEnum = pgEnum('ins_type', ['NIR', 'NIA']);

export const sexEnum = pgEnum('sex', ['M', 'F']);

export const prescriptionStatusEnum = pgEnum('prescription_status', [
  'active',
  'partially_dispensed',
  'fully_dispensed',
  'expired',
  'cancelled',
]);

export const dispensationTypeEnum = pgEnum('dispensation_type', [
  'full',
  'partial',
]);

export const verificationModeEnum = pgEnum('verification_mode', [
  'online',
  'offline_cached',
  'offline_degraded',
]);

export const fraudSeverityEnum = pgEnum('fraud_severity', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const fraudAlertStatusEnum = pgEnum('fraud_alert_status', [
  'open',
  'investigating',
  'resolved',
  'false_positive',
]);

/**
 * Table: establishments (Medical offices, pharmacies)
 */
export const establishments = pgTable(
  'establishments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    finesseCode: varchar('finesse_code', { length: 9 }).notNull().unique(),
    siretCode: varchar('siret_code', { length: 14 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'cabinet', 'pharmacy'
    address: text('address').notNull(),
    zipCode: varchar('zip_code', { length: 5 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    // For pharmacies: ECIES public key (33 bytes compressed)
    publicKeyEcies: varchar('public_key_ecies'),
    publicKeyFingerprint: varchar('public_key_fingerprint', { length: 16 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    finesseIdx: index('idx_establishments_finesse').on(table.finesseCode),
    siretIdx: index('idx_establishments_siret').on(table.siretCode),
    typeIdx: index('idx_establishments_type').on(table.type),
  }),
);

/**
 * Table: users (Prescribers, pharmacists, admins)
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rppsNumber: varchar('rpps_number', { length: 11 }).notNull().unique(),
    adeliNumber: varchar('adeli_number', { length: 9 }),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: userRoleEnum('role').notNull(), // 'prescriber', 'pharmacist', 'admin'
    establishmentId: uuid('establishment_id').notNull(),
    // ECDSA P-256 private key (encrypted at rest - stored as BYTEA)
    publicKeyEcdsa: varchar('public_key_ecdsa').notNull(), // 33 bytes compressed
    publicKeyFingerprint: varchar('public_key_fingerprint', { length: 16 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    rppsIdx: uniqueIndex('idx_users_rpps').on(table.rppsNumber),
    emailIdx: index('idx_users_email').on(table.email),
    roleIdx: index('idx_users_role').on(table.role),
    establishmentIdIdx: index('idx_users_establishment_id').on(
      table.establishmentId,
    ),
    fkEstablishment: foreignKey({
      columns: [table.establishmentId],
      foreignColumns: [establishments.id],
    }),
  }),
);

/**
 * Table: patients (With INS identification)
 */
export const patients = pgTable(
  'patients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // INS: 13 digits (NIR) or special format (NIA)
    insNumber: varchar('ins_number', { length: 22 }).notNull().unique(),
    insType: insTypeEnum('ins_type').notNull(), // 'NIR' or 'NIA'
    birthLastName: varchar('birth_last_name', { length: 100 }),
    usedLastName: varchar('used_last_name', { length: 100 }),
    firstNames: varchar('first_names', { length: 255 }), // All first names
    birthDate: date('birth_date'),
    sex: sexEnum('sex'), // 'M' or 'F'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    insNumberIdx: uniqueIndex('idx_patients_ins_number').on(table.insNumber),
    birthDateIdx: index('idx_patients_birth_date').on(table.birthDate),
  }),
);

/**
 * Table: prescriptions (Medical orders)
 */
export const prescriptions = pgTable(
  'prescriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Format: FR-RPPS-YYYYMMDD-SEQ-CHK
    // Max length: FR- (3) + RPPS (11) + - (1) + YYYYMMDD (8) + - (1) + SEQ (4) + - (1) + XX (2) = 31
    prescriptionNumber: varchar('prescription_number', { length: 50 })
      .notNull()
      .unique(),
    prescriberId: uuid('prescriber_id').notNull(),
    patientId: uuid('patient_id').notNull(),
    status: prescriptionStatusEnum('status').notNull().default('active'),
    validUntil: date('valid_until').notNull(),
    // Anti-replay nonce (32 bytes)
    nonce: varchar('nonce').notNull().unique(),
    // ECDSA signature (64 bytes)
    signature: varchar('signature').notNull(),
    // Encrypted payload backup (optional, for offline verification)
    encryptedPayload: varchar('encrypted_payload'),
    // SHA-256 hash of payload (64 hex chars = 32 bytes)
    payloadHash: varchar('payload_hash', { length: 64 }).notNull(),
    // Optional: target pharmacy (if specific)
    targetPharmacyId: uuid('target_pharmacy_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    prescriptionNumberIdx: uniqueIndex('idx_prescriptions_number').on(
      table.prescriptionNumber,
    ),
    prescriberIdIdx: index('idx_prescriptions_prescriber_id').on(
      table.prescriberId,
    ),
    patientIdIdx: index('idx_prescriptions_patient_id').on(table.patientId),
    statusIdx: index('idx_prescriptions_status').on(table.status),
    validUntilIdx: index('idx_prescriptions_valid_until').on(
      table.validUntil,
    ),
    nonceIdx: uniqueIndex('idx_prescriptions_nonce').on(table.nonce),
    fkPrescriber: foreignKey({
      columns: [table.prescriberId],
      foreignColumns: [users.id],
    }),
    fkPatient: foreignKey({
      columns: [table.patientId],
      foreignColumns: [patients.id],
    }),
    fkTargetPharmacy: foreignKey({
      columns: [table.targetPharmacyId],
      foreignColumns: [establishments.id],
    }),
  }),
);

/**
 * Table: prescription_items (Medications per prescription)
 */
export const prescriptionItems = pgTable(
  'prescription_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    prescriptionId: uuid('prescription_id').notNull(),
    // CIS code (BDPM) - 8 digits
    ciscode: varchar('ciscode', { length: 8 }).notNull(),
    // DCI (Dénomination Commune Internationale)
    dci: varchar('dci', { length: 255 }).notNull(),
    // Commercial name
    commercialName: varchar('commercial_name', { length: 255 }),
    // Dosage (e.g., "500 mg")
    dosage: varchar('dosage', { length: 100 }).notNull(),
    // Pharmaceutical form (e.g., "comprimé pelliculé")
    pharmaceuticalForm: varchar('pharmaceutical_form', { length: 100 }).notNull(),
    // Administration route (e.g., "orale")
    administrationRoute: varchar('administration_route', { length: 100 }).notNull(),
    // Posology instructions (free text)
    posology: text('posology').notNull(),
    // Duration in days
    durationDays: integer('duration_days').notNull(),
    // Quantity to dispense
    quantity: integer('quantity').notNull(),
    // Number of renewals allowed (0 if non-renewable)
    renewalsAllowed: integer('renewals_allowed').default(0).notNull(),
    // Non-substituable flag
    nonSubstituable: boolean('non_substituable').default(false).notNull(),
    nonSubstituableReason: varchar('non_substituable_reason', { length: 50 }), // 'MTE', 'EFG', 'CIF'
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    prescriptionIdIdx: index('idx_prescription_items_prescription_id').on(
      table.prescriptionId,
    ),
    ciscodeIdx: index('idx_prescription_items_ciscode').on(table.ciscode),
    fkPrescription: foreignKey({
      columns: [table.prescriptionId],
      foreignColumns: [prescriptions.id],
    }),
  }),
);

/**
 * Table: dispensations (Pharmacy deliveries)
 */
export const dispensations = pgTable(
  'dispensations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    prescriptionId: uuid('prescription_id').notNull(),
    pharmacyId: uuid('pharmacy_id').notNull(),
    pharmacistId: uuid('pharmacist_id').notNull(),
    dispensationType: dispensationTypeEnum('dispensation_type').notNull(), // 'full' or 'partial'
    signatureVerified: boolean('signature_verified').notNull(),
    nonceVerified: boolean('nonce_verified').notNull(),
    verificationMode: verificationModeEnum('verification_mode').notNull().default('online'),
    // Pharmacist notes (optional)
    notes: text('notes'),
    dispensedAt: timestamp('dispensed_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    prescriptionIdIdx: index('idx_dispensations_prescription_id').on(
      table.prescriptionId,
    ),
    pharmacyIdIdx: index('idx_dispensations_pharmacy_id').on(table.pharmacyId),
    pharmacistIdIdx: index('idx_dispensations_pharmacist_id').on(
      table.pharmacistId,
    ),
    fkPrescription: foreignKey({
      columns: [table.prescriptionId],
      foreignColumns: [prescriptions.id],
    }),
    fkPharmacy: foreignKey({
      columns: [table.pharmacyId],
      foreignColumns: [establishments.id],
    }),
    fkPharmacist: foreignKey({
      columns: [table.pharmacistId],
      foreignColumns: [users.id],
    }),
  }),
);

/**
 * Table: dispensation_items (Items delivered per dispensation)
 */
export const dispensationItems = pgTable(
  'dispensation_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    dispensationId: uuid('dispensation_id').notNull(),
    prescriptionItemId: uuid('prescription_item_id').notNull(),
    // Quantity actually dispensed
    quantityDispensed: integer('quantity_dispensed').notNull(),
    // Substitution flag
    substituted: boolean('substituted').default(false).notNull(),
    // Substitute CIS code (if substituted)
    substituteCiscode: varchar('substitute_ciscode', { length: 8 }),
    // Substitution reason (free text, optional)
    substitutionReason: text('substitution_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    dispensationIdIdx: index('idx_dispensation_items_dispensation_id').on(
      table.dispensationId,
    ),
    fkDispensation: foreignKey({
      columns: [table.dispensationId],
      foreignColumns: [dispensations.id],
    }),
    fkPrescriptionItem: foreignKey({
      columns: [table.prescriptionItemId],
      foreignColumns: [prescriptionItems.id],
    }),
  }),
);

/**
 * Table: audit_logs (Complete audit trail)
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    action: varchar('action', { length: 100 }).notNull(), // e.g., 'CREATE_PRESCRIPTION', 'DISPENSE'
    entityType: varchar('entity_type', { length: 50 }).notNull(), // e.g., 'prescription', 'dispensation'
    entityId: uuid('entity_id').notNull(),
    changes: jsonb('changes'), // JSONB of what changed
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_audit_logs_user_id').on(table.userId),
    entityIdIdx: index('idx_audit_logs_entity_id').on(table.entityId),
    actionIdx: index('idx_audit_logs_action').on(table.action),
    createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
    fkUser: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
  }),
);

/**
 * Table: fraud_alerts (Anti-fraud detection)
 */
export const fraudAlerts = pgTable(
  'fraud_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id'),
    prescriberId: uuid('prescriber_id'),
    pharmacyId: uuid('pharmacy_id'),
    alertType: varchar('alert_type', { length: 50 }).notNull(), // e.g., 'doctor_shopping', 'replay_attempt'
    severity: fraudSeverityEnum('severity').notNull(), // 'low', 'medium', 'high', 'critical'
    status: fraudAlertStatusEnum('status').notNull().default('open'),
    description: text('description').notNull(),
    relatedPrescriptions: uuid('related_prescriptions').array(),
    investigationNotes: text('investigation_notes'),
    resolvedBy: uuid('resolved_by'),
    resolvedAt: timestamp('resolved_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    patientIdIdx: index('idx_fraud_alerts_patient_id').on(table.patientId),
    prescriberIdIdx: index('idx_fraud_alerts_prescriber_id').on(
      table.prescriberId,
    ),
    pharmacyIdIdx: index('idx_fraud_alerts_pharmacy_id').on(table.pharmacyId),
    statusIdx: index('idx_fraud_alerts_status').on(table.status),
    severityIdx: index('idx_fraud_alerts_severity').on(table.severity),
    fkPatient: foreignKey({
      columns: [table.patientId],
      foreignColumns: [patients.id],
    }),
    fkPrescriber: foreignKey({
      columns: [table.prescriberId],
      foreignColumns: [users.id],
    }),
    fkPharmacy: foreignKey({
      columns: [table.pharmacyId],
      foreignColumns: [establishments.id],
    }),
    fkResolvedBy: foreignKey({
      columns: [table.resolvedBy],
      foreignColumns: [users.id],
    }),
  }),
);

/**
 * Table: medications (BDPM - Base de Données Publique des Médicaments)
 */
export const medications = pgTable(
  'medications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // CIS code (8 digits) - unique identifier from ANSM
    ciscode: varchar('ciscode', { length: 8 }).notNull().unique(),
    // DCI (Dénomination Commune Internationale)
    dci: varchar('dci', { length: 255 }).notNull(),
    // Commercial name
    commercialName: varchar('commercial_name', { length: 255 }).notNull(),
    // Pharmaceutical form
    pharmaceuticalForm: varchar('pharmaceutical_form', { length: 100 }).notNull(),
    // Dosage
    dosage: varchar('dosage', { length: 100 }).notNull(),
    // Administration route
    administrationRoute: varchar('administration_route', { length: 100 }).notNull(),
    // Marketing authorization status ('active', 'suspended', 'withdrawn')
    marketingStatus: varchar('marketing_status', { length: 50 }).notNull().default('active'),
    // Whether generic available
    hasGeneric: boolean('has_generic').default(false).notNull(),
    // Marketing authorization holder
    holder: varchar('holder', { length: 255 }),
    // Last update from BDPM
    lastUpdated: timestamp('last_updated').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    ciscodeIdx: uniqueIndex('idx_medications_ciscode').on(table.ciscode),
    dciIdx: index('idx_medications_dci').on(table.dci),
    commercialNameIdx: index('idx_medications_commercial_name').on(
      table.commercialName,
    ),
  }),
);

/**
 * Table: nonce_records (Anti-replay storage)
 */
export const nonceRecords = pgTable(
  'nonce_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Nonce value (32 bytes = 64 hex chars)
    nonce: varchar('nonce', { length: 64 }).notNull().unique(),
    prescriptionId: uuid('prescription_id').notNull(),
    // Used timestamp (null if not yet used)
    usedAt: timestamp('used_at'),
    // Expiration timestamp (validity + 1 year)
    expiresAt: timestamp('expires_at').notNull(),
    // Verification context (online/offline)
    verificationMode: verificationModeEnum('verification_mode').notNull().default('online'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    nonceIdx: uniqueIndex('idx_nonce_records_nonce').on(table.nonce),
    prescriptionIdIdx: index('idx_nonce_records_prescription_id').on(
      table.prescriptionId,
    ),
    expiresAtIdx: index('idx_nonce_records_expires_at').on(table.expiresAt),
    fkPrescription: foreignKey({
      columns: [table.prescriptionId],
      foreignColumns: [prescriptions.id],
    }),
  }),
);

/**
 * Type exports for application layer
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

export type Establishment = typeof establishments.$inferSelect;
export type NewEstablishment = typeof establishments.$inferInsert;

export type Prescription = typeof prescriptions.$inferSelect;
export type NewPrescription = typeof prescriptions.$inferInsert;

export type PrescriptionItem = typeof prescriptionItems.$inferSelect;
export type NewPrescriptionItem = typeof prescriptionItems.$inferInsert;

export type Dispensation = typeof dispensations.$inferSelect;
export type NewDispensation = typeof dispensations.$inferInsert;

export type DispensationItem = typeof dispensationItems.$inferSelect;
export type NewDispensationItem = typeof dispensationItems.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type FraudAlert = typeof fraudAlerts.$inferSelect;
export type NewFraudAlert = typeof fraudAlerts.$inferInsert;

export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;

export type NonceRecord = typeof nonceRecords.$inferSelect;
export type NewNonceRecord = typeof nonceRecords.$inferInsert;
