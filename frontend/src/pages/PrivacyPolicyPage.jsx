import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-6 inline-flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10 text-sm">Last updated: March 4, 2026</p>

        <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to IntervuAI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it when you use our AI-powered interview practice platform at <span className="text-blue-600 dark:text-blue-400">intervuai.com</span> (the &quot;Service&quot;).
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Account Information:</strong> Name, email address, and password when you create an account, or profile data from Google Sign-In.</li>
              <li><strong>Interview Content:</strong> Audio recordings, transcripts, and text responses generated during practice interviews.</li>
              <li><strong>Resume &amp; Job Description:</strong> Optionally uploaded resume text and target job descriptions used to personalize interviews. These are not stored permanently — they are passed to the AI agent for the duration of the session only.</li>
              <li><strong>Payment Information:</strong> Payment details are processed securely through Razorpay. We do not store your credit card or bank details on our servers.</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Usage Data:</strong> Interview history, scores, selected preferences (interview type, difficulty, duration).</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers for analytics and troubleshooting.</li>
              <li><strong>Cookies:</strong> We use essential cookies for authentication (JWT tokens) and optional analytics cookies.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>To provide and improve the AI interview practice experience.</li>
              <li>To personalize interviews using your resume and job description (when provided).</li>
              <li>To generate performance analytics, scores, and feedback.</li>
              <li>To process payments and manage your subscription/credits.</li>
              <li>To communicate with you about your account, updates, or support requests.</li>
              <li>To monitor and prevent fraud, abuse, or unauthorized access.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. AI Processing &amp; Third-Party Services</h2>
            <p className="mb-3">
              Our Service uses the following third-party AI and infrastructure providers to deliver the interview experience:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Cerebras:</strong> Large Language Model (LLM) for generating interview questions and responses.</li>
              <li><strong>Deepgram:</strong> Speech-to-text (STT) and text-to-speech (TTS) processing for live voice interviews.</li>
              <li><strong>LiveKit:</strong> Real-time audio/video infrastructure for live interview sessions.</li>
              <li><strong>Razorpay:</strong> Payment processing for subscription and credit purchases.</li>
            </ul>
            <p className="mt-3">
              Audio and text data may be processed by these providers during your interview session. We recommend reviewing their respective privacy policies. We do not sell your data to any third party.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Data Retention</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Account Data:</strong> Retained as long as your account is active. You may delete your account from the dashboard at any time.</li>
              <li><strong>Interview Transcripts &amp; Results:</strong> Stored to provide your interview history and analytics. These are deleted when you delete your account.</li>
              <li><strong>Resume &amp; Job Description Text:</strong> Used only during the active interview session and not stored permanently in our database.</li>
              <li><strong>Audio Recordings:</strong> Processed in real-time and not stored after the session ends.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Data Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS encryption in transit, secure password hashing (bcrypt), JWT-based authentication, and access controls. While no method of transmission over the internet is 100% secure, we strive to protect your personal information using commercially acceptable means.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Access and receive a copy of the personal data we hold about you.</li>
              <li>Rectify inaccurate or incomplete data.</li>
              <li>Request deletion of your personal data.</li>
              <li>Withdraw consent for data processing at any time.</li>
              <li>Lodge a complaint with your local data protection authority.</li>
            </ul>
            <p className="mt-3">
              You can delete your account from the dashboard. For other privacy requests, contact us at <span className="text-blue-600 dark:text-blue-400">buildifydevelopers@gmail.com</span>.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Children&apos;s Privacy</h2>
            <p>
              Our Service is not intended for individuals under the age of 16. We do not knowingly collect personal information from children. If we discover that a child under 16 has provided us with personal information, we will delete it promptly.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this page periodically.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm">
              <p className="font-semibold text-gray-900 dark:text-white">IntervuAI</p>
              <p>Email: <span className="text-blue-600 dark:text-blue-400">buildifydevelopers@gmail.com</span></p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-16 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} IntervuAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
