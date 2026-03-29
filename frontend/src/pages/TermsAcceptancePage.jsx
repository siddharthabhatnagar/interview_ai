import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';

export function TermsAcceptancePage() {
  const navigate = useNavigate();
  const { currentUser, acceptTerms, loading, error } = useAuthStore();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    // Redirect if user already accepted terms or if not logged in
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.termsAccepted) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

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
      setLocalError(err.response?.data?.message || 'Failed to accept terms');
    }
  };

  if (!currentUser) {
    return null;
  }

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
                Before you can start using IntervuAI, we need you to review and accept our Terms of Service and Privacy Policy.
              </p>
            </div>

            {(localError || error) && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-200 text-sm font-medium">{localError || error}</p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-8 rounded">
              <p className="text-blue-900 dark:text-blue-200 text-sm">
                Please take a moment to read our Terms of Service and Privacy Policy. These documents outline your rights and responsibilities as an IntervuAI user, including important information about our <strong>non-refund policy</strong> for credits and subscriptions.
              </p>
            </div>

            <div className="space-y-3 mb-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Review Legal Documents:</h3>
              <div className="flex items-center gap-3">
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold"
                >
                  📄 Terms of Service
                  <span className="text-xs text-gray-500">(opens in new tab)</span>
                </a>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold"
                >
                  📄 Privacy Policy
                  <span className="text-xs text-gray-500">(opens in new tab)</span>
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 mb-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  setLocalError('');
                }}
                className="mt-1.5 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="acceptTerms" className="flex-1 cursor-pointer">
                <span className="font-semibold text-gray-900 dark:text-white">I accept the Terms of Service and Privacy Policy</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                  By checking this box, I acknowledge that I have read and agree to be bound by the Terms of Service and Privacy Policy, <strong>including the non-refund policy for all purchases and credits.</strong>
                </p>
              </label>
            </div>

            <Button
              onClick={handleAcceptTerms}
              disabled={loading || !termsAccepted}
              className="w-full py-3 text-base font-semibold"
            >
              {loading ? 'Accepting Terms...' : 'Accept and Continue to Dashboard'}
            </Button>

            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6">
              You must accept these terms to use IntervuAI and access all features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
