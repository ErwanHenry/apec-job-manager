/**
 * QRCodeDisplay Component
 *
 * Displays generated QR code using qrcode library
 * Shows base64 payload for testing/debugging
 */

'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  payload: string;
  prescriptionNumber?: string;
}

export function QRCodeDisplay({ payload, prescriptionNumber }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (payload && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, payload, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
    }
  }, [payload]);

  return (
    <div className="flex flex-col items-center space-y-6 p-6 bg-white border-2 border-green-200 rounded-lg">
      {/* Success Message */}
      <div className="text-center">
        <div className="text-5xl mb-2">✓</div>
        <h3 className="text-xl font-bold text-green-900">Prescription Created Successfully</h3>
        {prescriptionNumber && (
          <p className="text-sm text-green-700 mt-2">
            Prescription #: <span className="font-mono font-bold">{prescriptionNumber}</span>
          </p>
        )}
      </div>

      {/* QR Code Canvas */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
        <canvas ref={canvasRef} className="block" />
      </div>

      {/* Instructions */}
      <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-2">Instructions for Pharmacist:</p>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Open the pharmacist dashboard on another browser/device</li>
          <li>Login with pharmacist credentials</li>
          <li>Copy the payload below</li>
          <li>Paste it in the QR Scanner field</li>
          <li>Verify and dispense the prescription</li>
        </ol>
      </div>

      {/* QR Payload (for testing) */}
      <div className="w-full">
        <p className="text-xs font-medium text-gray-600 mb-2">QR Payload (for testing):</p>
        <div className="relative bg-gray-100 rounded p-3 border border-gray-300">
          <code className="text-xs text-gray-700 break-all whitespace-pre-wrap block max-h-24 overflow-y-auto">
            {payload}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(payload);
              alert('Copied to clipboard!');
            }}
            className="absolute top-2 right-2 px-2 py-1 bg-gray-300 hover:bg-gray-400 text-gray-900 text-xs rounded"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Warning (MVP Crypto) */}
      <div className="w-full text-center text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
        ⚠️ <strong>MVP TESTING:</strong> This QR uses mock crypto (base64 JSON). Not for production use.
      </div>
    </div>
  );
}
