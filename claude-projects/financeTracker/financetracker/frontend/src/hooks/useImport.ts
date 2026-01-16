import { useState, useCallback } from 'react';
import { ImportResult } from '../api/types';
import { importApi } from '../api/import';

interface UseImportReturn {
  importing: boolean;
  error: Error | null;
  result: ImportResult | null;
  uploadFile: (file: File, accountId: string, autoCategorize?: boolean) => Promise<void>;
  reset: () => void;
}

export function useImport(): UseImportReturn {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const uploadFile = useCallback(
    async (file: File, accountId: string, autoCategorize: boolean = true) => {
      try {
        setImporting(true);
        setError(null);
        setResult(null);

        // Validate file
        if (!file) {
          throw new Error('No file selected');
        }
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
          throw new Error('Please select a CSV file');
        }

        const importResult = await importApi.uploadCSV(file, accountId, autoCategorize);
        setResult(importResult);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Import failed'));
        throw err;
      } finally {
        setImporting(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setImporting(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    importing,
    error,
    result,
    uploadFile,
    reset,
  };
}
