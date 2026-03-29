import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CheckCircle, X, BookOpen } from 'lucide-react';
import apiClient from '../services/apiClient';

const plans = [
  {
    id: 'free',
    name: 'Free',
    priceINR: 0,
    priceUSD: 0,
    description: 'Try IntervuAI with free credits',
    credits: 3,
    features: [
      { text: '3 credits included', included: true },
      { text: 'All 9 interview types', included: true },
      { text: 'Basic feedback & scoring', included: true },
      { text: 'Detailed analysis', included: false },
      { text: 'Deep dive interviews', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    priceINR: 499,
    priceUSD: 5.99,
    description: 'Great for focused preparation',
    credits: 15,
    features: [
      { text: '15 credits', included: true },
      { text: 'All 9 interview types', included: true },
      { text: 'Standard & Quick interviews', included: true },
      { text: 'Detailed analysis available', included: true },
      { text: 'Deep dive interviews', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Buy 15 Credits',
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    priceINR: 999,
    priceUSD: 11.99,
    description: 'Best value for serious prep',
    credits: 35,
    features: [
      { text: '35 credits', included: true },
      { text: 'All 9 interview types', included: true },
      { text: 'All interview durations', included: true },
      { text: 'All analysis tiers', included: true },
      { text: 'Deep dive interviews', included: true },
      { text: 'Priority support', included: false },
    ],
    cta: 'Buy 35 Credits',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    priceINR: 1999,
    priceUSD: 23.99,
    description: 'Maximum preparation power',
    credits: 80,
    features: [
      { text: '80 credits', included: true },
      { text: 'All 9 interview types', included: true },
      { text: 'All interview durations', included: true },
      { text: 'All analysis tiers', included: true },
      { text: 'Deep dive interviews', included: true },
      { text: 'Priority support', included: true },
    ],
    cta: 'Buy 80 Credits',
    popular: false,
  },
];

export function PricingPage() {
  const navigate = useNavigate();
  const { token, currentUser, getMe } = useAuthStore();
  const [processing, setProcessing] = useState(null);
  const [currency, setCurrency] = useState('INR');

  const getPrice = (plan) => currency === 'USD' ? plan.priceUSD : plan.priceINR;
  const currencySymbol = currency === 'USD' ? '$' : '₹';

  const handleSelectPlan = async (planId) => {
    if (planId === 'free') {
      navigate(token ? '/dashboard' : '/register');
      return;
    }

    if (!token) {
      navigate('/register');
      return;
    }

    setProcessing(planId);
    try {
      const response = await apiClient.post('/payment/create-order', { plan: planId, currency });
      const { orderId, amount, currency: orderCurrency, keyId } = response.data.data;

      // Load Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency: orderCurrency,
        name: 'IntervuAI',
        description: `${plans.find(p => p.id === planId).name} Plan`,
        order_id: orderId,
        handler: async function (razorpayResponse) {
          try {
            await apiClient.post('/payment/verify', {
              razorpayOrderId: razorpayResponse.razorpay_order_id,
              razorpayPaymentId: razorpayResponse.razorpay_payment_id,
              razorpaySignature: razorpayResponse.razorpay_signature,
            });
            await getMe();
            alert('Payment successful! Credits added to your account.');
            navigate('/dashboard');
          } catch (err) {
            console.error('Payment verify error:', err);
            const msg = err.response?.data?.message || 'Payment verification failed. Please contact support.';
            alert(msg);
          }
        },
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || '',
        },
        theme: {
          color: '#2563eb',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Create order error:', error?.response?.data || error.message || error);
      const msg = error.response?.data?.message || error.message || 'Failed to create order. Check console for details.';
      alert(msg);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1
              onClick={() => navigate('/')}
              className="text-2xl font-bold text-blue-600 cursor-pointer"
            >
              IntervuAI
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/docs')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span>Docs</span>
              </button>
              {token ? (
                <Button onClick={() => navigate('/dashboard')} variant="secondary">
                  Dashboard
                </Button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Sign In
                  </button>
                  <Button onClick={() => navigate('/register')}>Get Started</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your interview preparation needs. Start free and upgrade anytime.
            </p>

            {/* Currency Toggle */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className={`text-sm font-medium transition-colors ${currency === 'INR' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>₹ INR</span>
              <button
                onClick={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  currency === 'USD' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={currency === 'USD'}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  currency === 'USD' ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <span className={`text-sm font-medium transition-colors ${currency === 'USD' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>$ USD</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative p-8 flex flex-col ${
                  plan.popular ? 'border-2 border-blue-600 shadow-xl scale-105' : 'border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-sm font-bold px-4 py-1 rounded-full">
                      Best Value
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-extrabold text-gray-900">
                      {getPrice(plan) === 0 ? 'Free' : `${currencySymbol}${getPrice(plan)}`}
                    </span>
                  </div>
                  <p className="text-blue-600 font-semibold mt-2">{plan.credits} credits</p>
                  {getPrice(plan) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{currencySymbol}{(getPrice(plan) / plan.credits).toFixed(currency === 'USD' ? 2 : 0)}/credit</p>
                  )}
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      {feature.included ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={plan.popular ? 'primary' : 'secondary'}
                  size="lg"
                  className="w-full"
                  disabled={processing === plan.id || (currentUser?.subscriptionPlan === plan.id)}
                >
                  {processing === plan.id
                    ? 'Processing...'
                    : currentUser?.subscriptionPlan === plan.id
                    ? 'Current Plan'
                    : plan.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I try IntervuAI for free?',
                a: 'Yes! Every new account gets 3 free credits. A standard interview costs 2 credits, so you can try at least one full interview for free.',
              },
              {
                q: 'How do credits work?',
                a: 'Each interview costs credits based on duration (Quick ~8 min: 1 credit, Standard ~15 min: 2 credits, Deep Dive ~25 min: 3 credits) plus optional analysis upgrades (Detailed: +1, Premium: +2). You choose your combination before each interview.',
              },
              {
                q: 'What types of interviews are available?',
                a: 'We cover Frontend, Backend, Full Stack, DevOps, AI/ML Engineer, Gen AI Engineer, MLOps Engineer, Data Engineer, and Data Scientist interviews at beginner, intermediate, and advanced levels.',
              },
              {
                q: 'Do credits expire?',
                a: 'No! Your credits never expire. Buy them once and use them whenever you\'re ready to practice.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit/debit cards, UPI, Net Banking (India), and international cards via Razorpay. Toggle between INR and USD pricing on this page.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>© {new Date().getFullYear()} IntervuAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
