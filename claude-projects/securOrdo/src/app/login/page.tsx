/**
 * Login Page
 *
 * Entry point for prescribers and pharmacists
 * Shows test credentials for MVP
 */

import { LoginForm } from '@/components/LoginForm';
import { getTestCredentials } from '@/lib/auth';

export const metadata = {
  title: 'Login - MUSIC',
  description: 'Medical Universal Secure Identification Code',
};

export default function LoginPage() {
  const testCredentials = getTestCredentials();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            MUSIC
          </h1>
          <p className="text-gray-600 mt-2">
            Medical Universal Secure Identification Code
          </p>
          <p className="text-sm text-gray-500 mt-1">MVP - Proof of Concept</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Login</h2>
          <LoginForm />
        </div>

        {/* Test Credentials */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">
            🧪 Test Credentials (MVP)
          </h3>

          <div className="space-y-4">
            <div>
              <p className="font-medium text-blue-900 text-sm mb-2">
                Prescriber:
              </p>
              <div className="bg-white rounded p-2 text-sm font-mono text-gray-700 space-y-1">
                <p>
                  Email: <span className="text-blue-600">jean.martin@cabinet-cardio.fr</span>
                </p>
                <p>
                  Password: <span className="text-blue-600">prescriber1</span>
                </p>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                (Or: marie.dupont@cabinet-cardio.fr / prescriber2)
              </p>
            </div>

            <div className="border-t border-blue-200"></div>

            <div>
              <p className="font-medium text-blue-900 text-sm mb-2">
                Pharmacist:
              </p>
              <div className="bg-white rounded p-2 text-sm font-mono text-gray-700 space-y-1">
                <p>
                  Email: <span className="text-blue-600">pierre.bernard@pharmacie-marais.fr</span>
                </p>
                <p>
                  Password: <span className="text-blue-600">pharmacist1</span>
                </p>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                (Or: sophie.lefebvre@pharmacie-marais.fr / pharmacist2)
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
            ⚠️ <strong>MVP:</strong> These credentials are for testing only. Phase 2
            will integrate with Pro Santé Connect (French healthcare SSO).
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            📖 Quick Start Guide
          </h3>

          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p className="font-medium text-gray-900">1. Login as Prescriber</p>
              <p className="text-xs text-gray-600">
                Create a prescription with patient + medications
              </p>
            </div>

            <div>
              <p className="font-medium text-gray-900">2. Generate QR Code</p>
              <p className="text-xs text-gray-600">
                Copy the QR payload to clipboard
              </p>
            </div>

            <div>
              <p className="font-medium text-gray-900">3. Login as Pharmacist</p>
              <p className="text-xs text-gray-600">
                Open in private/incognito window for separate session
              </p>
            </div>

            <div>
              <p className="font-medium text-gray-900">4. Scan & Dispense</p>
              <p className="text-xs text-gray-600">
                Paste QR payload and record dispensation
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600">
          <p>Version: MVP | Build: 2026-01-15</p>
          <p className="mt-1">
            Database: PostgreSQL | ORM: Drizzle | Framework: Next.js
          </p>
        </div>
      </div>
    </main>
  );
}
