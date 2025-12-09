import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose }) => {
  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    };

    const scanner = new Html5QrcodeScanner(
      "barcode-reader",
      config,
      false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
        onClose();
      },
      (error) => {
        // Ignore
      }
    );

    return () => {
      scanner.clear().catch(err => console.error('Scanner clear error:', err));
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <Camera className="w-6 h-6" />
            Barcode Skaner
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div id="barcode-reader" className="mb-4"></div>

        <div className="p-3 text-sm text-blue-800 border border-blue-200 rounded-lg bg-blue-50">
          <p>📱 Barcode yoki QR kodni kameraga yaqinlashtiring</p>
          <p className="mt-1 text-xs">Format: EAN, UPC, Code 39, Code 128, QR</p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;