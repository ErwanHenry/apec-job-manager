/**
 * Pharmacist Dashboard Page
 *
 * Client component - manages QR scanning and dispensation workflow
 */

'use client';

import { useState } from 'react';
import { QRScanner } from '@/components/QRScanner';
import { PrescriptionDisplay } from '@/components/PrescriptionDisplay';
import { dispenseAction } from '@/app/actions/dispensation';
import { logoutAction } from '@/app/actions/auth';

type WorkflowState = 'scanning' | 'displaying' | 'dispensing' | 'success';

export default function PharmacistPage() {
  const [workflowState, setWorkflowState] = useState<WorkflowState>('scanning');
  const [prescription, setPrescription] = useState<any>(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle QR code scanned
  function handleScan(data: {
    prescription: any;
    verified: boolean;
    prescriptionId: string;
    prescriptionNumber: string;
  }) {
    setPrescription(data.prescription);
    setVerified(data.verified);
    setWorkflowState('displaying');
  }

  // Handle dispensation
  async function handleDispense(prescription: any) {
    setLoading(true);

    try {
      // Prepare items for dispensation
      const items = prescription.items.map((item: any) => ({
        prescriptionItemId: item.id,
        quantity: item.quantity,
      }));

      // Call server action
      const result = await dispenseAction(prescription.id, items);

      if (result.success) {
        // Show success message
        setWorkflowState('success');

        // Reset after 3 seconds
        setTimeout(() => {
          setPrescription(null);
          setWorkflowState('scanning');
        }, 3000);
      } else {
        alert('Dispensation failed: ' + result.error);
      }
    } catch (err) {
      alert(
        'Error: ' + (err instanceof Error ? err.message : 'Unknown error'),
      );
    } finally {
      setLoading(false);
    }
  }

  // Reset workflow
  function handleReset() {
    setPrescription(null);
    setVerified(false);
    setWorkflowState('scanning');
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Verify & Dispense</h1>
            <p className="text-gray-600 mt-1">Pharmacist Dashboard</p>
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
        <div className="bg-white rounded-lg shadow-lg p-8">
          {workflowState === 'success' ? (
            // Success State
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="text-7xl">✓</div>
              <h2 className="text-3xl font-bold text-green-900">
                Dispensation Recorded
              </h2>
              <p className="text-green-700">
                Prescription has been successfully dispensed and logged.
              </p>
              <div className="text-sm text-gray-600 mt-4">
                Returning to scanner in 3 seconds...
              </div>
            </div>
          ) : workflowState === 'displaying' && prescription ? (
            // Prescription Display State
            <div className="space-y-6">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-md"
              >
                ← Back to Scanner
              </button>

              <PrescriptionDisplay
                prescription={prescription}
                verified={verified}
                onDispense={handleDispense}
                loading={loading}
              />
            </div>
          ) : (
            // QR Scanner State
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <h2 className="font-semibold text-green-900 mb-2">
                  ✓ Workflow Guide
                </h2>
                <ol className="text-green-800 space-y-1 list-decimal list-inside text-sm">
                  <li>Receive prescription from patient</li>
                  <li>Scan the QR code or paste the payload below</li>
                  <li>Verify prescription details and signature</li>
                  <li>Confirm dispensation of medications</li>
                  <li>Recording is completed automatically</li>
                </ol>
              </div>

              <QRScanner onScan={handleScan} />
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            📱 Testing Instructions
          </h3>
          <ol className="text-blue-800 space-y-2 list-decimal list-inside text-sm">
            <li>Open <code className="bg-white px-1 rounded">prescriber</code> dashboard</li>
            <li>Create a prescription and note the prescription number</li>
            <li>Copy the QR payload (shown below the QR code)</li>
            <li>
              Open this page in a private/incognito window (or different device)
            </li>
            <li>Login as pharmacist</li>
            <li>Paste the QR payload above and scan</li>
            <li>Verify the prescription details match</li>
            <li>Click "Dispense All Medications"</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
