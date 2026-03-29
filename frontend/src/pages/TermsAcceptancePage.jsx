import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';

export function TermsAcceptancePage() {
  const navigate = useNavigate();
  const { currentUser, acceptTerms, loading, error } = useAuthStore();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleAcceptTerms = async () => {
    if (!termsAccepted) {
      setLocalError('You must accept the Terms of Service to continue');
      return;
    }

    setLocalError('');
    try {
      await acceptTerms(true, '1.0');
      navigate('/dashboard');
    } catch (err) {
      console.error('Accept terms error:', err);
      setLocalError(err.response?.data?.message || 'Failed to accept terms');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to IntervuAI!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Before you can start using IntervuAI, please review and accept our Terms of Service and Privacy Policy.
              </p>
            </div>

            {(localError || error) && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-200 text-sm font-medium">{localError || error}</p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-8 rounded">
              <p className="text-blue-900 dark:text-blue-200 text-sm">
                <strong>Important:</strong> By accepting these terms, you acknowledge our <strong>non-refund policy</strong> for all credits and subscriptions. All purchases are final.
              </p>
            </div>

            <div className="space-y-3 mb-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📋 Please Review:</h3>
              <div className="flex items-center justify-between">
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline font-semibold text-sm"
                >
                  📄 Terms of Service
                </a>
                <span className="text-xs text-gray-500 dark:text-gray-400">(new tab)</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-300 dark:border-gray-600 pt-3">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline font-semibold text-sm"
                >
                  📄 Privacy Policy
                </a>
                <span className="text-xs text-gray-500 dark:text-gray-400">(new tab)</span>
              </div>
            </div>

            {/* Checkbox */}
            <div className="mb-8">
              <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    setLocalError('');
                  }}
                  className="mt-1 h-5 w-5 text-blue-600 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm block">
                    I accept the Terms of Service and Privacy Policy
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Including the non-refund policy for all purchases, credits, and subscriptions
                  </p>
                </div>
              </label>
            </div>

            {/* Accept Button */}
            <Button
              onClick={handleAcceptTerms}
              disabled={loading || !termsAccepted}
              className="w-full py-3 font-semibold"
            >
              {loading ? 'Accepting Terms...' : '✓ Accept and Continue'}
            </Button>

            <p className="text-center text-gray-600 dark:text-gray-400 text-xs mt-6 px-4">
              You must accept these terms to continue using IntervuAI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
