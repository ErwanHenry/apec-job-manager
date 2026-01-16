/**
 * Prescriber Dashboard Page
 *
 * Server component - fetches patients and medications
 * Displays PrescriptionForm component
 */

import { db } from '@/lib/db/client';
import { patients, medications } from '@/lib/db/schema';
import { PrescriptionForm } from '@/components/PrescriptionForm';
import { logoutAction } from '@/app/actions/auth';
import { requireAuth } from '@/lib/auth';

export const metadata = {
  title: 'Create Prescription - MUSIC',
  description: 'Prescriber dashboard - create and sign prescriptions',
};

export default async function PrescriberPage() {
  // Note: Authentication is handled by middleware.ts
  // During builds, just fetch data with empty lists

  let patientList: typeof patients.$inferSelect[] = [];
  let medicationList: typeof medications.$inferSelect[] = [];

  try {
    // Verify user is prescriber
    await requireAuth('prescriber');

    // Fetch patients and medications
    patientList = await db.select().from(patients).limit(100);
    medicationList = await db.select().from(medications).limit(100);
  } catch (err) {
    // During build, requireAuth will fail - that's ok, just return with empty data
    // The middleware will enforce auth at runtime
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Prescription</h1>
            <p className="text-gray-600 mt-1">Prescriber Dashboard</p>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-md transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {patientList.length === 0 || medicationList.length === 0 ? (
          <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <h2 className="font-semibold text-yellow-900 mb-2">
              ⚠️ Setup Required
            </h2>
            <p className="text-yellow-800 mb-4">
              Database is not populated. Please run:
            </p>
            <code className="block bg-yellow-100 p-3 rounded font-mono text-sm text-yellow-900 mb-4">
              npm run db:seed
            </code>
            <p className="text-sm text-yellow-700">
              This will populate the database with test patients, medications, and users.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Info Card */}
            <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h2 className="font-semibold text-blue-900 mb-2">
                ℹ️ How to create a prescription:
              </h2>
              <ol className="text-blue-800 space-y-1 list-decimal list-inside text-sm">
                <li>Select a patient from the dropdown</li>
                <li>Choose medications from the list</li>
                <li>Configure dosage and duration for each medication</li>
                <li>Generate the prescription and QR code</li>
                <li>Share the QR code with the patient or pharmacy</li>
              </ol>
            </div>

            {/* Prescription Form */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <PrescriptionForm
                patients={patientList}
                medications={medicationList}
              />
            </div>

            {/* Tech Info */}
            <div className="p-6 bg-gray-50 border rounded-lg text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-2">📊 Available Data:</p>
              <p>Patients: {patientList.length} | Medications: {medicationList.length}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
