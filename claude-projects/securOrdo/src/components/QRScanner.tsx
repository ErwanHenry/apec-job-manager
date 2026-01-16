/**
 * QRScanner Component
 *
 * MVP: Text input to paste QR payload
 * Phase 2: Add html5-qrcode camera integration
 */

'use client';

import { useState } from 'react';
import { scanQRAction } from '@/app/actions/dispensation';

interface QRScannerProps {
  onScan: (data: {
    prescription: any;
    verified: boolean;
    prescriptionId: string;
    prescriptionNumber: string;
  }) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [qrInput, setQrInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleScan() {
    if (!qrInput.trim()) {
      setError('Please paste QR code payload');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await scanQRAction(qrInput);

      if (!result.success) {
        setError(result.error);
      } else {
        // Reset form on success
        setQrInput('');
        // Call parent callback with prescription data
        onScan({
          prescription: result.prescription,
          verified: result.verified,
          prescriptionId: result.prescriptionId,
          prescriptionNumber: result.prescriptionNumber,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to scan prescription',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !loading) {
      handleScan();
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Input Field */}
      <div>
        <label htmlFor="qr-input" className="block text-sm font-medium text-gray-700 mb-2">
          Prescription QR Code Payload
        </label>
        <textarea
          id="qr-input"
          value={qrInput}
          onChange={e => setQrInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Paste the base64 QR code payload here..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Scan Button */}
      <button
        onClick={handleScan}
        disabled={loading || !qrInput.trim()}
        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-blue-600 mr-2"></span>
            Scanning...
          </span>
        ) : (
          'Scan Prescription'
        )}
      </button>

      {/* Information Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm font-medium text-blue-900 mb-2">How to test:</p>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Open prescriber dashboard in another browser window</li>
          <li>Create a prescription and generate QR code</li>
          <li>Copy the QR payload (button under the QR code)</li>
          <li>Paste it above and click "Scan Prescription"</li>
        </ol>
      </div>

      {/* Phase 2 Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-xs font-medium text-amber-900">
          📱 <strong>Phase 2:</strong> Camera-based QR code scanning will be added with
          html5-qrcode library. MVP uses text input for testing.
        </p>
      </div>
    </div>
  );
}
