import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';

export function AccountDeletionPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="mb-10">
          <h1 className="mb-3 text-4xl font-bold text-gray-900 dark:text-white">Account Deletion Information</h1>
          <p className="text-gray-600 dark:text-gray-400">
            IntervuAI lets you permanently delete your account from inside the app. This page explains how deletion works and what data is removed.
          </p>
        </div>

        <div className="space-y-8 text-gray-700 dark:text-gray-300">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">How to delete your account</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Sign in to your IntervuAI account.</li>
              <li>Open your dashboard.</li>
              <li>Find the Delete Account section.</li>
              <li>Type DELETE to confirm.</li>
              <li>If your account uses password login, enter your current password.</li>
              <li>Confirm deletion.</li>
            </ol>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">Data deleted from IntervuAI</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Your account profile, including name and email.</li>
              <li>Your interview history.</li>
              <li>Your saved interview results, scores, transcripts, and feedback.</li>
              <li>Your payment records stored in our database.</li>
              <li>Related verification records, such as OTP records.</li>
            </ul>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">Important notes</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Account deletion is permanent and cannot be undone.</li>
              <li>You will lose access to all saved interviews, scores, feedback, and remaining credits.</li>
              <li>Deleting your account does not create a refund or credit entitlement.</li>
              <li>Payment processing data handled by Razorpay may remain with Razorpay according to their legal and compliance requirements.</li>
            </ul>
          </section>

          <section className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">Need help?</h2>
            <p className="mb-5">
              If you cannot access your account or need help with deletion, contact us at{' '}
              <span className="font-semibold text-blue-700 dark:text-blue-300">buildifydevelopers@gmail.com</span>.
            </p>
            <Button onClick={() => navigate(token ? '/dashboard' : '/login')}>
              {token ? 'Go to Dashboard' : 'Sign In to Delete Account'}
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
