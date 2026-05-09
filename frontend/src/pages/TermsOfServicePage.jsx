import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export function TermsOfServicePage() {
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

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10 text-sm">Last updated: March 4, 2026</p>

        <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using IntervuAI (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Service. We reserve the right to modify these Terms at any time, and your continued use of the Service constitutes acceptance of any changes.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Description of Service</h2>
            <p>
              IntervuAI is an AI-powered technical interview practice platform that provides simulated interview experiences using artificial intelligence. The Service includes live voice-based mock interviews, automated feedback and scoring, and interview preparation tools. The Service is intended for educational and practice purposes only and does not guarantee employment outcomes.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. User Accounts</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 16 years of age to use the Service.</li>
              <li>One person may not maintain more than one free account.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Credits &amp; Payments</h2>

            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-2">4.1 Credits System</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Interviews are conducted using a credits-based system. Different interview configurations consume different amounts of credits.</li>
              <li>Free accounts receive a limited number of starter credits.</li>
              <li>Additional credits can be purchased through our paid plans (Starter, Growth, Pro).</li>
              <li>Credits are non-transferable between accounts.</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-2">4.2 Payment Terms and No-Refund Policy</h3>
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4 rounded">
              <p className="font-bold text-red-900 dark:text-red-200 mb-2">
                ALL PURCHASES ARE FINAL AND NON-REFUNDABLE
              </p>
              <p className="text-red-800 dark:text-red-300 text-sm">
                By purchasing credits or subscribing to any plan, you explicitly acknowledge
                and agree that all sales are final. We do not offer refunds under any circumstances.
              </p>
            </div>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>No Refunds:</strong> We do not offer refunds, returns, or credits for unused
                credits, subscription time, service dissatisfaction, change of mind, technical issues,
                duplicate purchases, or any other reason.
              </li>
              <li>
                <strong>Payment Processing:</strong> All payments are processed securely through Razorpay
                and are charged immediately. Transactions cannot be cancelled once initiated.
              </li>
              <li>
                <strong>Chargeback Prohibition:</strong> Initiating a chargeback or payment dispute instead
                of contacting us directly will result in immediate account termination and may result in
                legal action to recover costs and damages.
              </li>
              <li>
                <strong>Account Termination:</strong> Termination, suspension, or deletion of your account
                for any reason, including violation of these Terms, does not entitle you to refunds or credits.
              </li>
              <li>
                <strong>Price Changes:</strong> We reserve the right to modify pricing at any time.
                Existing purchased credits will not be affected by price changes.
              </li>
              <li>
                <strong>Legal Waiver:</strong> You explicitly waive any right to claim refunds under consumer
                protection laws to the maximum extent permitted by law.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Acceptable Use</h2>
            <p className="mb-3">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws.</li>
              <li>Attempt to reverse-engineer, decompile, or exploit the AI models or infrastructure.</li>
              <li>Share, resell, or redistribute your account access or credits.</li>
              <li>Upload malicious, offensive, or harmful content through the resume or job description fields.</li>
              <li>Attempt to overwhelm, disrupt, or abuse the Service through automated scripts or bots.</li>
              <li>Use the Service to generate content that is defamatory, harassing, or violates the rights of others.</li>
              <li>Misrepresent your identity or impersonate another person.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Intellectual Property</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>The Service, including its design, code, AI models, branding, and content, is owned by IntervuAI and protected by intellectual property laws.</li>
              <li>You retain ownership of any personal content you provide (resume text, job descriptions, interview responses).</li>
              <li>By using the Service, you grant us a limited, non-exclusive license to process your content solely to deliver the interview experience and generate feedback.</li>
              <li>AI-generated interview questions and feedback are provided for your personal use and may not be commercially redistributed.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. AI-Generated Content Disclaimer</h2>
            <p>
              The interview questions, feedback, scores, and recommendations provided by IntervuAI are generated by artificial intelligence and are intended for practice and educational purposes only. AI responses may occasionally be inaccurate, incomplete, or contextually inappropriate. We do not guarantee the accuracy, reliability, or suitability of any AI-generated content. The Service should not be considered a substitute for professional career coaching or mentorship.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Service Availability</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>We strive to maintain high availability but do not guarantee uninterrupted access to the Service.</li>
              <li>The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.</li>
              <li>We reserve the right to modify, suspend, or discontinue any feature of the Service at any time.</li>
              <li>If a technical failure consumes credits without delivering an interview, please contact support for resolution.</li>
            </ul>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, IntervuAI and its affiliates, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the Service. Our total liability for any claim arising from the Service shall not exceed the amount you paid to us in the 12 months preceding the claim.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Termination</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>You may delete your account at any time by contacting support.</li>
              <li>We reserve the right to suspend or terminate your account if you violate these Terms, with or without notice.</li>
              <li>Upon termination, your right to use the Service ceases immediately. Any unused credits will be forfeited.</li>
              <li>Provisions that by their nature should survive termination (e.g., liability limitations, intellectual property) will remain in effect.</li>
            </ul>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in India. If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">12. Contact Us</h2>
            <p>
              If you have questions or concerns about these Terms of Service, please contact us at:
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
