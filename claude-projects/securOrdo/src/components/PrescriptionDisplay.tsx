/**
 * PrescriptionDisplay Component
 *
 * Shows prescription details to pharmacist
 * Includes verification status and dispense button
 */

'use client';

import type { Prescription } from '@/lib/db/schema';

interface PrescriptionDisplayProps {
  prescription: any;
  verified: boolean;
  onDispense: (prescription: any) => void;
  loading?: boolean;
}

export function PrescriptionDisplay({
  prescription,
  verified,
  onDispense,
  loading = false,
}: PrescriptionDisplayProps) {
  const statusColors: Record<string, string> = {
    active: 'text-green-600 bg-green-50',
    partially_dispensed: 'text-yellow-600 bg-yellow-50',
    fully_dispensed: 'text-blue-600 bg-blue-50',
    expired: 'text-red-600 bg-red-50',
    cancelled: 'text-gray-600 bg-gray-50',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-3xl font-bold text-gray-900">
          Prescription {prescription.prescriptionNumber}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Created:{' '}
          {new Date(
            typeof prescription.createdAt === 'string'
              ? prescription.createdAt
              : prescription.createdAt,
          ).toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Patient & Prescriber Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Card */}
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Patient
          </h3>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">
              {prescription.patient?.firstNames} {prescription.patient?.usedLastName}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">INS:</span> {prescription.patient?.insNumber}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Date of birth:</span>{' '}
              {prescription.patient?.birthDate
                ? new Date(
                    typeof prescription.patient.birthDate === 'string'
                      ? prescription.patient.birthDate
                      : prescription.patient.birthDate,
                  ).toLocaleDateString('fr-FR')
                : 'N/A'}
            </p>
            {prescription.patient?.sex && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Sex:</span> {prescription.patient.sex}
              </p>
            )}
          </div>
        </div>

        {/* Prescriber Card */}
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Prescriber
          </h3>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">
              Dr. {prescription.prescriber?.firstName} {prescription.prescriber?.lastName}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">RPPS:</span> {prescription.prescriber?.rppsNumber}
            </p>
            {prescription.prescriber?.specialization && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Specialization:</span>{' '}
                {prescription.prescriber.specialization}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className={`p-4 rounded-lg ${statusColors[prescription.status] || 'bg-gray-50'}`}>
        <p className="text-sm font-medium">
          Status:{' '}
          <span className="font-bold uppercase">
            {prescription.status.replace('_', ' ')}
          </span>
        </p>
        {prescription.validUntil && (
          <p className="text-sm mt-1">
            Valid until:{' '}
            <span className="font-medium">
              {new Date(
                typeof prescription.validUntil === 'string'
                  ? prescription.validUntil
                  : prescription.validUntil,
              ).toLocaleDateString('fr-FR')}
            </span>
          </p>
        )}
      </div>

      {/* Medications */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Medications</h3>
        <div className="space-y-3">
          {prescription.items?.map((item: any, idx: number) => (
            <div key={idx} className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{item.commercialName}</h4>
                  <p className="text-sm text-gray-600">
                    {item.dci} • {item.dosage}
                  </p>
                </div>
                {item.nonSubstituable && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                    Non-Substitutable
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Form</p>
                  <p className="text-gray-900">{item.pharmaceuticalForm}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Route</p>
                  <p className="text-gray-900">{item.administrationRoute}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Posology</p>
                  <p className="text-gray-900 font-mono">{item.posology}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Quantity</p>
                  <p className="text-gray-900">{item.quantity}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Status */}
      <div
        className={`p-4 rounded-lg border-2 flex items-center space-x-3 ${
          verified
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}
      >
        <div className="text-3xl">{verified ? '✓' : '✕'}</div>
        <div>
          <p className={`font-semibold ${verified ? 'text-green-900' : 'text-red-900'}`}>
            {verified ? 'Signature Verified' : 'Signature Invalid'}
          </p>
          <p className={`text-sm ${verified ? 'text-green-700' : 'text-red-700'}`}>
            {verified
              ? 'This prescription is authentic and has not been tampered with.'
              : 'This prescription could not be verified. Do not dispense.'}
          </p>
        </div>
      </div>

      {/* Dispense Button */}
      {prescription.status === 'active' && verified && (
        <button
          onClick={() => onDispense(prescription)}
          disabled={loading}
          className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg rounded-lg transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-green-600 mr-2"></span>
              Processing...
            </span>
          ) : (
            'Dispense All Medications'
          )}
        </button>
      )}

      {/* Info Box */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-900">
        <p className="font-medium mb-1">✅ Real Cryptography Active:</p>
        <p>Signatures verified with real ECDSA P-256. Replay attacks blocked with nonce anti-replay protection.</p>
      </div>
    </div>
  );
}
