"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

export default function ImportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview([]);
      setError('');
      setSuccess('');
      setStep(1);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please select a CSV file first');
      return;
    }

    setError('');
    setPreviewLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/csv/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPreview(data.transactions);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse CSV file');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    setImporting(true);
    setError('');

    try {
      const { data } = await api.post('/csv/import', {
        transactions: preview
      });

      setSuccess(`✅ Successfully imported ${data.count} transactions!`);
      setStep(3);
      setPreview([]);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import transactions');
    } finally {
      setImporting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Import Bank Statement 📂
            </h1>
            <p className="text-gray-400 text-sm">
              Upload your bank CSV to import UPI transactions
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm"
          >
            ← Dashboard
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {['Upload File', 'Preview', 'Done'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step > i + 1
                  ? 'bg-green-500 text-white'
                  : step === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-500'
              }`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${
                step === i + 1 ? 'text-white' : 'text-gray-500'
              }`}>
                {s}
              </span>
              {i < 2 && <div className="w-8 h-px bg-gray-700 mx-1" />}
            </div>
          ))}
        </div>

        {/* How to download statement */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
          <p className="text-blue-400 font-medium text-sm mb-2">
            📱 How to download bank statement CSV:
          </p>
          <div className="text-gray-400 text-xs flex flex-col gap-1">
            <p>• <strong className="text-gray-300">HDFC:</strong> NetBanking → Accounts → Download Statement → CSV</p>
            <p>• <strong className="text-gray-300">SBI:</strong> YONO App → Account Statement → Download → CSV</p>
            <p>• <strong className="text-gray-300">ICICI:</strong> iMobile → Accounts → Statement → Export CSV</p>
            <p>• <strong className="text-gray-300">Axis:</strong> Mobile Banking → Statement → Download CSV</p>
          </div>
        </div>

        {/* Step 1 — Upload */}
        {step === 1 && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-white font-bold mb-4">
              Step 1 — Select CSV File
            </h2>

            {/* Drop zone */}
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">📂</span>
                <p className="text-gray-400 text-sm">
                  Click to select CSV file
                </p>
                <p className="text-gray-600 text-xs">
                  Max size: 5MB
                </p>
                {file && (
                  <p className="text-blue-400 text-sm font-medium">
                    ✅ {file.name}
                  </p>
                )}
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2 mt-3">
                {error}
              </p>
            )}

            <button
              onClick={handlePreview}
              disabled={!file || previewLoading}
              className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {previewLoading ? 'Parsing CSV...' : 'Preview Transactions →'}
            </button>
          </div>
        )}

        {/* Step 2 — Preview */}
        {step === 2 && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold">
                Step 2 — Preview ({preview.length} transactions found)
              </h2>
              <button
                onClick={() => setStep(1)}
                className="text-gray-400 text-sm hover:text-white"
              >
                ← Back
              </button>
            </div>

            {preview.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No valid transactions found in CSV
              </p>
            ) : (
              <>
                {/* Preview table */}
                <div className="flex flex-col gap-2 max-h-96 overflow-y-auto mb-4">
                  {preview.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-800 border border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          t.type === 'income' ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <div>
                          <p className="text-white text-sm">
                            {t.description?.slice(0, 35)}
                            {t.description?.length > 35 ? '...' : ''}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {t.category} • {t.paymentMode} • {new Date(t.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${
                        t.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2 mb-3">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {importing
                    ? 'Importing...'
                    : `✅ Import All ${preview.length} Transactions`
                  }
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-white font-bold text-xl mb-2">
              Import Successful!
            </h2>
            <p className="text-green-400 mb-6">{success}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setStep(1);
                  setSuccess('');
                  setFile(null);
                }}
                className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium"
              >
                Import Another
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
              >
                View Dashboard →
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}