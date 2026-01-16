/**
 * PrescriptionForm Component
 *
 * Most complex component - handles prescription creation workflow
 * 1. Patient selection
 * 2. Medication selection and configuration
 * 3. Prescription generation
 * 4. QR code display
 */

'use client';

import { useState } from 'react';
import type { Patient, Medication } from '@/lib/db/schema';
import { createPrescriptionAction } from '@/app/actions/prescription';
import { QRCodeDisplay } from './QRCodeDisplay';

interface PrescriptionFormProps {
  patients: Patient[];
  medications: Medication[];
}

interface FormItem {
  ciscode: string;
  dci: string;
  commercialName: string;
  dosage: string;
  pharmaceuticalForm: string;
  administrationRoute: string;
  posology: string;
  quantity: number;
  durationDays: number;
}

export function PrescriptionForm({ patients, medications }: PrescriptionFormProps) {
  // Form state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Result state
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [prescriptionNumber, setPrescriptionNumber] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Handle medication selection
  function addMedication(medication: Medication) {
    setItems([
      ...items,
      {
        ciscode: medication.ciscode,
        dci: medication.dci,
        commercialName: medication.commercialName,
        dosage: medication.dosage,
        pharmaceuticalForm: medication.pharmaceuticalForm,
        administrationRoute: medication.administrationRoute,
        posology: '',
        quantity: 1,
        durationDays: 30,
      },
    ]);
  }

  // Handle item updates
  function updateItem(index: number, field: keyof FormItem, value: any) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  // Remove item
  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  // Submit prescription
  async function handleSubmit() {
    setError('');

    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one medication');
      return;
    }

    // Validate items
    for (const item of items) {
      if (!item.posology) {
        setError('Please enter posology for all medications');
        return;
      }
      if (item.quantity <= 0) {
        setError('Quantity must be greater than 0');
        return;
      }
    }

    setLoading(true);

    try {
      const result = await createPrescriptionAction({
        patientId: selectedPatient.id,
        patientInsNumber: selectedPatient.insNumber,
        items,
      });

      if (result.success) {
        setQrPayload(result.qrPayload);
        setPrescriptionNumber(result.prescriptionNumber);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create prescription',
      );
    } finally {
      setLoading(false);
    }
  }

  // Show QR code after successful creation
  if (qrPayload && prescriptionNumber) {
    return (
      <div className="space-y-6">
        <QRCodeDisplay
          payload={qrPayload}
          prescriptionNumber={prescriptionNumber}
        />

        <button
          onClick={() => {
            // Reset form
            setQrPayload(null);
            setPrescriptionNumber(null);
            setSelectedPatient(null);
            setItems([]);
            setError('');
          }}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
        >
          Create Another Prescription
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Patient Selection */}
      <div className="p-6 border rounded-lg bg-white">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          1. Select Patient
        </label>
        <select
          value={selectedPatient?.id || ''}
          onChange={e => {
            const patient = patients.find(p => p.id === e.target.value) || null;
            setSelectedPatient(patient);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Select a patient --</option>
          {patients.map(patient => (
            <option key={patient.id} value={patient.id}>
              {patient.firstNames} {patient.usedLastName} (INS: {patient.insNumber})
            </option>
          ))}
        </select>

        {selectedPatient && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm">
              <span className="font-medium">DOB:</span>{' '}
              {selectedPatient.birthDate
                ? new Date(selectedPatient.birthDate).toLocaleDateString('fr-FR')
                : 'Not specified'}
            </p>
            <p className="text-sm">
              <span className="font-medium">INS:</span>{' '}
              {selectedPatient.insNumber}
            </p>
          </div>
        )}
      </div>

      {/* Medication Selection */}
      <div className="p-6 border rounded-lg bg-white">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          2. Select Medications
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-3 border rounded bg-gray-50">
          {medications.length > 0 ? (
            medications.map(med => (
              <button
                key={med.id}
                onClick={() => addMedication(med)}
                className="p-3 text-left text-sm bg-white hover:bg-blue-50 rounded border border-gray-300 hover:border-blue-400 transition-colors"
              >
                <div className="font-semibold text-gray-900">
                  {med.commercialName}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {med.dosage} • {med.dci}
                </div>
              </button>
            ))
          ) : (
            <p className="col-span-2 text-center text-gray-500 py-4">
              No medications available
            </p>
          )}
        </div>
      </div>

      {/* Selected Items */}
      {items.length > 0 && (
        <div className="p-6 border rounded-lg bg-white">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            3. Configure Medications ({items.length} selected)
          </h3>
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {item.commercialName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {item.dosage} • {item.dci}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Posology */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Posology *
                    </label>
                    <input
                      type="text"
                      value={item.posology}
                      onChange={e =>
                        updateItem(idx, 'posology', e.target.value)
                      }
                      placeholder="e.g., 1 comprimé 3 fois/jour"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e =>
                        updateItem(idx, 'quantity', parseInt(e.target.value))
                      }
                      min="1"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Duration (days) *
                    </label>
                    <input
                      type="number"
                      value={item.durationDays}
                      onChange={e =>
                        updateItem(idx, 'durationDays', parseInt(e.target.value))
                      }
                      min="1"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Form */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Form
                    </label>
                    <input
                      type="text"
                      value={item.pharmaceuticalForm}
                      disabled
                      className="w-full px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded text-gray-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !selectedPatient || items.length === 0}
        className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg rounded-lg transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-green-600 mr-2"></span>
            Generating Prescription...
          </span>
        ) : (
          '4. Generate Prescription & QR Code'
        )}
      </button>

      {/* Info */}
      {items.length === 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
          💡 Select a patient and at least one medication to proceed.
        </div>
      )}
    </div>
  );
}
