import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CheckCircle, X, BookOpen, Zap } from 'lucide-react';
import apiClient from '../services/apiClient';

const plans = [
  {
    id: 'free',
    name: 'Free Trial',
    priceINR: 0,
    priceUSD: 0,
    description: 'Get started with IntervuAI',
    credits: 3,
    perCredit: 0,
    interviews: '1-2',
    features: [
      { text: '1-2 practice interviews', included: true },
      { text: 'All 9 interview types', included: true },
      { text: 'Basic feedback & scoring', included: true },
      { text: 'Standard & Quick interviews only', included: true },
      { text: 'Community support', included: true },
      { text: 'Detailed analysis', included: false },
      { text: 'Deep dive interviews (25 min)', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    popular: false,
    badge: null,
  },
  {
    id: 'basic',
    name: 'Basic',
    priceINR: 299,
    priceUSD: 3.59,
    description: 'For regular practice',
    credits: 8,
    perCredit: 37,
    interviews: '4-5',
    features: [
      { text: '4-5 practice interviews', included: true },
      { text: 'All 9 interview types', included: true },
      { text: 'Basic + Standard feedback', included: true },
      { text: 'Quick, Standard, & Deep Dive', included: true },
      { text: 'Detailed analysis (+1 credit/use)', included: true },
      { text: 'Priority support (24h response)', included: true },
      { text: 'Download performance reports', included: true },
      { text: 'VIP email support', included: false },
    ],
    cta: 'Buy 8 Credits',
    popular: false,
    badge: null,
  },
  {
    id: 'growth',
    name: 'Growth',
    priceINR: 799,
    priceUSD: 9.59,
    description: 'Best value for serious prep',
    credits: 30,
    perCredit: 27,
    interviews: '15+',
    features: [
      { text: '15+ practice interviews', included: true },
      { text: 'All 9 interview types', included: true },
      { text: 'All feedback & scoring tiers', included: true },
      { text: 'All interview durations', included: true },
      { text: 'Unlimited detailed analysis', included: true },
      { text: 'Premium analysis reports', included: true },
      { text: 'Weekly progress tracking', included: true },
      { text: 'Priority email & chat support', included: true },
    ],
    cta: 'Buy 30 Credits',
    popular: true,
    badge: '29% savings',
  },
  {
    id: 'pro',
    name: 'Pro',
    priceINR: 1999,
    priceUSD: 23.99,
    description: 'Maximum preparation power',
    credits: 100,
    perCredit: 20,
    interviews: '50+',
    features: [
      { text: '50+ practice interviews', included: true },
      { text: 'All 9 interview types', included: true },
      { text: 'All feedback & scoring tiers', included: true },
      { text: 'All interview durations', included: true },
      { text: 'Unlimited analysis & reports', included: true },
      { text: 'Advanced AI insights', included: true },
      { text: 'Progress analytics dashboard', included: true },
      { text: '24/7 VIP support & career guidance', included: true },
    ],
    cta: 'Buy 100 Credits',
    popular: false,
    badge: '47% savings',
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
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
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span className="hidden sm:inline">Docs</span>
              </button>
              {token ? (
                <Button onClick={() => navigate('/dashboard')} variant="secondary">
                  Dashboard
                </Button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium hidden sm:block"
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
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-4 py-1 rounded-full text-sm font-semibold">PRICING</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Transparent, Simple Pricing
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Start free and upgrade anytime. Scale your interview prep to match your goals.
            </p>

            {/* Currency Toggle */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={`text-sm font-medium transition-colors ${currency === 'INR' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>₹ INR</span>
              <button
                onClick={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                  currency === 'USD' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={currency === 'USD'}
              >
                <span className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  currency === 'USD' ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
              <span className={`text-sm font-medium transition-colors ${currency === 'USD' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>$ USD</span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {plans.map((plan) => (
              <div key={plan.id} className="relative">
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <Card
                  className={`relative p-6 md:p-8 flex flex-col h-full transition-all duration-300 ${
                    plan.popular
                      ? 'border-2 border-blue-600 shadow-2xl md:scale-105 bg-blue-50 dark:bg-blue-900/30'
                      : 'border border-gray-200 dark:border-gray-700 hover:shadow-lg'
                  } bg-white dark:bg-gray-800`}
                >
                  {plan.badge && plan.popular && (
                    <div className="absolute top-8 right-4">
                      <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 text-xs font-bold px-3 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{plan.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">
                        {getPrice(plan) === 0 ? 'Free' : `${currencySymbol}${getPrice(plan)}`}
                      </span>
                      {getPrice(plan) > 0 && <span className="text-gray-600 dark:text-gray-400 text-sm">/one-time</span>}
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">{plan.credits} credits</p>
                    {getPrice(plan) > 0 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {currencySymbol}{plan.perCredit}/credit
                      </p>
                    )}
                  </div>

                  {/* Interview Count */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Practice Interviews</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{plan.interviews}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'text-gray-700 dark:text-gray-300 text-sm' : 'text-gray-400 dark:text-gray-600 text-sm'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    variant={plan.popular ? 'primary' : 'secondary'}
                    size="lg"
                    className="w-full font-semibold"
                    disabled={processing === plan.id}
                  >
                    {processing === plan.id
                      ? 'Processing...'
                      : plan.cta}
                  </Button>
                </Card>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">What's Included in Each Plan</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-8 py-4 font-semibold text-gray-900 dark:text-white">Feature</th>
                      {plans.map(plan => (
                        <th key={plan.id} className="text-center px-6 py-4 font-semibold text-gray-900 dark:text-white text-sm">{plan.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Credits', values: plans.map(p => p.credits) },
                      { label: 'Practice Interviews', values: plans.map(p => p.interviews) },
                      { label: 'Interview Types', values: ['9 types', '9 types', '9 types', '9 types'] },
                      { label: 'Interview Durations', values: ['Quick, Standard', 'Quick, Standard, Deep', 'All durations', 'All durations'] },
                      { label: 'Analysis Feedback', values: ['Basic', 'Standard+', 'Premium', 'Premium+'] },
                      { label: 'Performance Reports', values: ['Basic', 'Standard', 'Advanced', 'Advanced+'] },
                      { label: 'Support', values: ['Community', 'Email 24h', 'Chat & Email', '24/7 VIP'] },
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="px-8 py-4 font-medium text-gray-900 dark:text-white">{row.label}</td>
                        {row.values.map((value, i) => (
                          <td key={i} className="text-center px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Can I upgrade or downgrade anytime?',
                  a: 'Yes! You can purchase credits anytime. Just select your plan from the pricing page. Unused credits never expire.',
                },
                {
                  q: 'How do credits work?',
                  a: 'Each interview costs credits based on duration (Quick ~8 min: 1 credit, Standard ~15 min: 2 credits, Deep Dive ~25 min: 3 credits) plus optional analysis (Detailed: +1, Premium: +2).',
                },
                {
                  q: 'Can I get a refund?',
                  a: 'Credits are non-refundable once purchased. However, unused credits never expire, so use them when you\'re ready.',
                },
                {
                  q: 'What if I run out of credits?',
                  a: 'You can purchase more credits anytime from your dashboard. Upgrade to any plan and credits are instantly added to your account.',
                },
                {
                  q: 'Do you offer team or enterprise pricing?',
                  a: 'Yes! For teams and organizations, contact our sales team at buildifydevelopers@gmail.com for custom pricing.',
                },
              ].map((faq, idx) => (
                <div key={idx}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>© {new Date().getFullYear()} IntervuAI. All rights reserved. | Non-refundable purchases</p>
        </div>
      </footer>
    </div>
  );
}
