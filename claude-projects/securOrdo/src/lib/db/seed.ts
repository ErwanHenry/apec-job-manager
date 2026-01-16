import { db, client } from './client';
import {
  establishments,
  users,
  patients,
  medications,
  userRoleEnum,
  insTypeEnum,
  sexEnum,
  type NewUser,
  type NewPatient,
  type NewMedication,
} from './schema';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Seed data for development and testing
 * This script populates the database with realistic test data
 */

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (for development only)
    console.log('🗑️  Clearing existing data...');
    await db.delete(medications);
    await db.delete(patients);
    await db.delete(users);
    await db.delete(establishments);

    /**
     * 1. Create establishments (2: 1 cabinet, 1 pharmacy)
     */
    console.log('🏥 Creating establishments...');
    const establishmentData = [
      {
        finesseCode: '750100097',
        siretCode: '34882179100025',
        name: 'Cabinet de Cardiologie - Dr. Martin',
        type: 'cabinet',
        address: '123 Avenue des Champs-Élysées',
        zipCode: '75008',
        city: 'Paris',
        phone: '01 23 45 67 89',
        email: 'contact@cabinet-cardio.fr',
      },
      {
        finesseCode: '750100098',
        siretCode: '34882179100026',
        name: 'Pharmacie du Marais',
        type: 'pharmacy',
        address: '45 Rue de Turenne',
        zipCode: '75003',
        city: 'Paris',
        phone: '01 98 76 54 32',
        email: 'contact@pharmacie-marais.fr',
        publicKeyFingerprint: 'ABCD1234EFGH5678',
      },
    ];

    const [cabinet, pharmacy] = await db
      .insert(establishments)
      .values(establishmentData)
      .returning();

    console.log(`✅ Created ${cabinet.id} (Cabinet) and ${pharmacy.id} (Pharmacy)`);

    /**
     * 2. Create users (2 prescribers, 2 pharmacists, 1 admin)
     */
    console.log('👥 Creating users...');
    const userData: NewUser[] = [
      {
        rppsNumber: '10003294726',
        adeliNumber: '750003294',
        firstName: 'Jean',
        lastName: 'Martin',
        email: 'jean.martin@cabinet-cardio.fr',
        passwordHash: hashPassword('prescriber1'),
        role: 'prescriber',
        establishmentId: cabinet.id,
        publicKeyEcdsa: Buffer.from(
          '0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798',
          'hex',
        ).toString('base64'),
        publicKeyFingerprint: 'PRES0001',
      },
      {
        rppsNumber: '10003294727',
        adeliNumber: '750003295',
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie.dupont@cabinet-cardio.fr',
        passwordHash: hashPassword('prescriber2'),
        role: 'prescriber',
        establishmentId: cabinet.id,
        publicKeyEcdsa: Buffer.from(
          '02C6047F9441ED7D6D3045406E95C07CD85C778E4B8CEF3CA7D91D92E47816A7B8',
          'hex',
        ).toString('base64'),
        publicKeyFingerprint: 'PRES0002',
      },
      {
        rppsNumber: '10003294728',
        adeliNumber: '750003296',
        firstName: 'Pierre',
        lastName: 'Bernard',
        email: 'pierre.bernard@pharmacie-marais.fr',
        passwordHash: hashPassword('pharmacist1'),
        role: 'pharmacist',
        establishmentId: pharmacy.id,
        publicKeyEcdsa: Buffer.from(
          '02F9308A019258C31049344F85F89D5229B531C845836F99B08601F113BCE036F9',
          'hex',
        ).toString('base64'),
        publicKeyFingerprint: 'PHARM0001',
      },
      {
        rppsNumber: '10003294729',
        adeliNumber: '750003297',
        firstName: 'Sophie',
        lastName: 'Lefebvre',
        email: 'sophie.lefebvre@pharmacie-marais.fr',
        passwordHash: hashPassword('pharmacist2'),
        role: 'pharmacist',
        establishmentId: pharmacy.id,
        publicKeyEcdsa: Buffer.from(
          '02E493DBF1C10D80F3D4FF4F59FF319CEFEFB992541BFDF9A0108E1D19B0DCAA7',
          'hex',
        ).toString('base64'),
        publicKeyFingerprint: 'PHARM0002',
      },
      {
        rppsNumber: '10003294730',
        adeliNumber: '750003298',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@music.local',
        passwordHash: hashPassword('admin123'),
        role: 'admin',
        establishmentId: cabinet.id,
        publicKeyEcdsa: Buffer.from(
          '0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798',
          'hex',
        ).toString('base64'),
        publicKeyFingerprint: 'ADMIN0001',
      },
    ];

    const [prescriber1, prescriber2, pharmacist1, pharmacist2, admin] = await db
      .insert(users)
      .values(userData)
      .returning();

    console.log(
      `✅ Created 5 users: 2 prescribers, 2 pharmacists, 1 admin`,
    );

    /**
     * 3. Create patients (10 test patients with valid NIR format)
     */
    console.log('🧑‍🤝‍🧑 Creating test patients...');
    const testPatients: NewPatient[] = [
      {
        insNumber: '1800101123456',
        insType: 'NIR',
        birthLastName: 'Dupont',
        usedLastName: 'Dupont',
        firstNames: 'Jean Claude',
        birthDate: '1980-01-01',
        sex: 'M',
      },
      {
        insNumber: '2800215654321',
        insType: 'NIR',
        birthLastName: 'Martin',
        usedLastName: 'Martin-Durand',
        firstNames: 'Marie Anne',
        birthDate: '1988-02-15',
        sex: 'F',
      },
      {
        insNumber: '1850325987654',
        insType: 'NIR',
        birthLastName: 'Bernard',
        usedLastName: 'Bernard',
        firstNames: 'Pierre',
        birthDate: '1985-03-25',
        sex: 'M',
      },
      {
        insNumber: '2870501123789',
        insType: 'NIR',
        birthLastName: 'Leclerc',
        usedLastName: 'Leclerc',
        firstNames: 'Sophie Isabelle',
        birthDate: '1987-05-01',
        sex: 'F',
      },
      {
        insNumber: '1920410456123',
        insType: 'NIR',
        birthLastName: 'Petit',
        usedLastName: 'Petit',
        firstNames: 'Michel',
        birthDate: '1992-04-10',
        sex: 'M',
      },
      {
        insNumber: '2950630789456',
        insType: 'NIR',
        birthLastName: 'Rousseau',
        usedLastName: 'Rousseau',
        firstNames: 'Catherine',
        birthDate: '1995-06-30',
        sex: 'F',
      },
      {
        insNumber: '1760812321654',
        insType: 'NIR',
        birthLastName: 'Girard',
        usedLastName: 'Girard',
        firstNames: 'Philippe',
        birthDate: '1976-08-12',
        sex: 'M',
      },
      {
        insNumber: '2810910654789',
        insType: 'NIR',
        birthLastName: 'Laurent',
        usedLastName: 'Laurent',
        firstNames: 'Nathalie Joëlle',
        birthDate: '1981-09-10',
        sex: 'F',
      },
      {
        insNumber: '1900715987321',
        insType: 'NIR',
        birthLastName: 'Fournier',
        usedLastName: 'Fournier',
        firstNames: 'David',
        birthDate: '1990-07-15',
        sex: 'M',
      },
      {
        insNumber: '2841201456789',
        insType: 'NIR',
        birthLastName: 'Mercier',
        usedLastName: 'Mercier',
        firstNames: 'Valérie',
        birthDate: '1984-12-01',
        sex: 'F',
      },
    ];

    const createdPatients = await db
      .insert(patients)
      .values(testPatients)
      .returning();

    console.log(`✅ Created ${createdPatients.length} test patients`);

    /**
     * 4. Create medications (10 common medications from BDPM)
     */
    console.log('💊 Creating medications...');
    const medicationsList: NewMedication[] = [
      {
        ciscode: '66680551',
        dci: 'Paracétamol',
        commercialName: 'Doliprane',
        pharmaceuticalForm: 'comprimé pelliculé',
        dosage: '500 mg',
        administrationRoute: 'orale',
        marketingStatus: 'active',
        hasGeneric: true,
        holder: 'Sanofi-Aventis',
      },
      {
        ciscode: '60138014',
        dci: 'Ibuprofène',
        commercialName: 'Nurofen',
        pharmaceuticalForm: 'comprimé enrobé',
        dosage: '200 mg',
        administrationRoute: 'orale',
        marketingStatus: 'active',
        hasGeneric: true,
        holder: 'Reckitt Benckiser',
      },
      {
        ciscode: '62236407',
        dci: 'Amoxicilline',
        commercialName: 'Amoxicilline',
        pharmaceuticalForm: 'gélule',
        dosage: '500 mg',
        administrationRoute: 'orale',
        marketingStatus: 'active',
        hasGeneric: true,
        holder: 'GlaxoSmithKline',
      },
      {
        ciscode: '67188189',
        dci: 'Metformine',
        commercialName: 'Glucophage',
        pharmaceuticalForm: 'comprimé',
        dosage: '850 mg',
        administrationRoute: 'orale',
        marketingStatus: 'active',
        hasGeneric: true,
        holder: 'Merck Serono',
      },
      {
        ciscode: '65484814',
        dci: 'Atorvastatine',
        commercialName: 'Tahor',
        pharmaceuticalForm: 'comprimé',
        dosage: '20 mg',
        administrationRoute: 'orale',
        marketingStatus: 'active',
        hasGeneric: true,
        holder: 'Pfizer',
      },
      {
        ciscode: '68083695',
        dci: 'Lisinopril',
        commercialName: 'Prinivil',
        pharmaceuticalForm: 'comprimé',
        dosage: '10 mg',
        administrationRoute: 'orale',
        marketingStatus: 'active',
        hasGeneric: true,
        holder: 'AstraZeneca',
      },
      {
        ciscode: '62519146',
        dci: 'Amlodipine',
        commercialName: 'Amlor',
        pharmaceuticalForm: 'comprimé',
        dosage: '5 mg',
        administrationRoute: 'orale',
        marketingStatus: 'active',
        hasGeneric: true,
        holder: 'Besins Healthcare',
      },
      {
        ciscode: '66640537',
        dci: 'Oméprazole',
        commercialName: 'Mopral',
        pharmaceuticalForm: 'gélule gastrorésistante',
        dosage: '20 mg',
        administrationRoute: 'orale',
        marketingStatus: 'active',
        hasGeneric: true,
        holder: 'Astellas Pharma',
      },
      {
        ciscode: '65530325',
        dci: 'Sertraline',
        commercialName: 'Zoloft',
        pharmaceuticalForm: 'comprimé',
        dosage: '50 mg',
        administrationRoute: 'orale',
        marketingStatus: 'active',
        hasGeneric: true,
        holder: 'Pfizer',
      },
      {
        ciscode: '69211811',
        dci: 'Levothyroxine',
        commercialName: 'Lévothyrox',
        pharmaceuticalForm: 'comprimé',
        dosage: '50 µg',
        administrationRoute: 'orale',
        marketingStatus: 'active',
        hasGeneric: true,
        holder: 'Merck Serono',
      },
    ];

    const createdMeds = await db
      .insert(medications)
      .values(medicationsList)
      .returning();

    console.log(`✅ Created ${createdMeds.length} medications`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\nTest credentials:');
    console.log('  Prescriber 1: jean.martin@cabinet-cardio.fr / prescriber1');
    console.log('  Prescriber 2: marie.dupont@cabinet-cardio.fr / prescriber2');
    console.log('  Pharmacist 1: pierre.bernard@pharmacie-marais.fr / pharmacist1');
    console.log('  Pharmacist 2: sophie.lefebvre@pharmacie-marais.fr / pharmacist2');
    console.log('  Admin:        admin@music.local / admin123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
    process.exit(0);
  }
}

/**
 * Simple password hashing for development (use bcrypt in production)
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Run the seed function
 */
seedDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
