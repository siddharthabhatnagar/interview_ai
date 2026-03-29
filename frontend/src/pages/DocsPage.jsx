import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

const INTERVIEW_TYPES = [
  { name: 'Frontend', desc: 'React, Vue, Angular, CSS architecture, performance optimization, accessibility' },
  { name: 'Backend', desc: 'APIs, databases, authentication, server architecture, security best practices' },
  { name: 'Full Stack', desc: 'End-to-end application development, system design, deployment pipelines' },
  { name: 'DevOps', desc: 'CI/CD, Docker, Kubernetes, monitoring, infrastructure as code, cloud services' },
  { name: 'AI/ML Engineer', desc: 'Machine learning models, neural networks, model deployment, MLOps basics' },
  { name: 'Gen AI Engineer', desc: 'LLMs, prompt engineering, RAG, fine-tuning, AI application architecture' },
  { name: 'MLOps Engineer', desc: 'ML pipelines, model serving, monitoring, feature stores, experiment tracking' },
  { name: 'Data Engineer', desc: 'ETL pipelines, data warehousing, Spark, Kafka, data modeling, SQL optimization' },
  { name: 'Data Scientist', desc: 'Statistical analysis, A/B testing, ML algorithms, data visualization, business insight' },
];

const TIER_FEATURES = [
  {
    feature: 'Per-Question Feedback',
    basic: '2–3 sentence overview',
    detailed: '3–4 sentences + 5 category scores',
    premium: '5–7 sentences + improvement tips + estimated level',
  },
  {
    feature: 'Summary Report',
    basic: '3–4 paragraph overview',
    detailed: '5-section detailed breakdown',
    premium: '6-section report with learning roadmap & market comparison',
  },
  {
    feature: '5-Dimension Scoring',
    basic: '✅ Radar chart + score bars',
    detailed: '✅ + strengths & focus areas',
    premium: '✅ + per-question mini bars',
  },
  {
    feature: 'Improvement Tips',
    basic: '—',
    detailed: '—',
    premium: '✅ Per-question actionable tips',
  },
  {
    feature: 'Estimated Level',
    basic: '—',
    detailed: '—',
    premium: '✅ Junior / Mid / Senior estimate',
  },
  {
    feature: 'Learning Roadmap',
    basic: '—',
    detailed: '—',
    premium: '✅ Personalized with resources',
  },
  {
    feature: 'Market Comparison',
    basic: '—',
    detailed: '—',
    premium: '✅ How you compare to average candidates',
  },
];

const CREDIT_TABLE = [
  { label: 'Quick (~5 min, 4 Qs)', duration: 1, basic: 1, detailed: 2, premium: 3 },
  { label: 'Standard (~10 min, 6 Qs)', duration: 2, basic: 2, detailed: 3, premium: 4 },
  { label: 'Deep Dive (~15 min, 8 Qs)', duration: 3, basic: 3, detailed: 4, premium: 5 },
];

const PLANS = [
  { name: 'Free Trial', price: '₹0', credits: 3, best: '1-2 interviews', color: 'gray' },
  { name: 'Basic', price: '₹299 / $3.59', credits: 8, best: '4-5 interviews', color: 'blue' },
  { name: 'Growth', price: '₹799 / $9.59', credits: 30, best: '15+ interviews', color: 'indigo' },
  { name: 'Pro', price: '₹1999 / $23.99', credits: 100, best: '50+ interviews', color: 'purple' },
];

const DIMENSIONS = [
  { name: 'Technical Accuracy', desc: 'Correctness of concepts, syntax, and technical knowledge demonstrated in answers' },
  { name: 'Communication Clarity', desc: 'How well ideas are articulated — structured thinking, clear explanations, no rambling' },
  { name: 'Problem Solving', desc: 'Approach to breaking down problems, considering edge cases, and thinking through solutions' },
  { name: 'Depth of Knowledge', desc: 'Going beyond surface-level answers — understanding trade-offs, internals, and "why"' },
  { name: 'Practical Experience', desc: 'Real-world application — referencing actual projects, production issues, and hands-on work' },
];

const FAQS = [
  { q: 'How does the AI interviewer work?', a: 'Our AI interviewer uses a domain-specific persona for each field (e.g., a Senior Frontend Architect for frontend interviews). It conducts a real-time voice conversation using speech-to-text and text-to-speech, adapts question difficulty based on your answers, and evaluates you across 5 skill dimensions.' },
  { q: 'What model powers the evaluations?', a: 'We use Cerebras GPT-OSS-120B for both the live interview agent and post-interview evaluations. This provides fast, high-quality responses at minimal cost.' },
  { q: 'How are scores calculated?', a: 'Each answer is independently scored across 5 dimensions (Technical Accuracy, Communication, Problem Solving, Depth, Experience) on a 0–100 scale. Your overall score is the average across all questions.' },
  { q: 'Can I upload my resume?', a: 'Yes! You can paste your resume text and/or a target job description before starting. The AI will personalize questions based on your experience and the role you\'re targeting.' },
  { q: 'What\'s the difference between Basic, Detailed, and Premium?', a: 'Basic gives concise feedback. Detailed adds multi-section breakdowns. Premium gives the full package: improvement tips per question, estimated seniority level, a personalized learning roadmap, and how you compare to the market.' },
  { q: 'How many interviews can I do per plan?', a: 'It depends on your settings. A Quick + Basic interview costs 1 credit, while a Deep Dive + Premium costs 5 credits. Free Trial (3 credits) gets 1-2 interviews, Basic (8 credits) gets 4-5, Growth (30 credits) gets 15+, and Pro (100 credits) gets 50+ depending on your chosen settings.' },
  { q: 'Is my data secure?', a: 'Yes. Audio is processed in real-time and not stored. Interview transcripts are stored securely in MongoDB Atlas with encryption. We never share your data with third parties.' },
  { q: 'What difficulty levels are available?', a: 'Beginner (0–1 year experience), Intermediate (2–4 years), and Advanced (5+ years). The AI adapts difficulty dynamically within the session based on your performance.' },
];

export function DocsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            IntervuAI Documentation
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about our AI-powered interview practice platform — features, pricing, scoring, and more.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-12">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Interview Types', 'Analysis Tiers', 'Credit System', 'Pricing Plans', '5-Dimension Scoring', 'How It Works', 'FAQ'].map(section => (
              <a key={section} href={`#${section.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                → {section}
              </a>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <section id="how-it-works" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Choose Settings', desc: 'Select your field, difficulty level, interview duration, and analysis tier.', color: 'blue' },
              { step: '2', title: 'Live AI Interview', desc: 'A domain-expert AI conducts a real-time voice interview. It adapts difficulty based on your answers.', color: 'indigo' },
              { step: '3', title: 'AI Evaluation', desc: 'Each answer is evaluated across 5 dimensions. Your analysis tier determines feedback depth.', color: 'purple' },
              { step: '4', title: 'Review Results', desc: 'Get your radar chart, score bars, per-question breakdown, and (if premium) a learning roadmap.', color: 'green' },
            ].map(item => (
              <div key={item.step} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className={`w-8 h-8 bg-${item.color}-100 dark:bg-${item.color}-900/40 text-${item.color}-600 dark:text-${item.color}-400 rounded-lg flex items-center justify-center font-bold text-sm mb-3`}>
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Interview Types */}
        <section id="interview-types" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Interview Types</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Each interview type features a domain-specific AI persona — not a generic chatbot, but a specialist 
            who asks the kind of questions a real hiring manager in that field would ask.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {INTERVIEW_TYPES.map(type => (
              <div key={type.name} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{type.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{type.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Analysis Tiers Comparison */}
        <section id="analysis-tiers" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analysis Tiers Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Feature</th>
                  <th className="text-center py-3 px-4">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full font-bold text-xs">Basic (Free)</span>
                  </th>
                  <th className="text-center py-3 px-4">
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-bold text-xs">Detailed (+1 cr)</span>
                  </th>
                  <th className="text-center py-3 px-4">
                    <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full font-bold text-xs">Premium (+2 cr)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {TIER_FEATURES.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-100 dark:border-gray-800 ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.feature}</td>
                    <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{row.basic}</td>
                    <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{row.detailed}</td>
                    <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Credit System */}
        <section id="credit-system" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Credit System</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Credits = <span className="font-bold text-gray-900 dark:text-white">Duration cost</span> + <span className="font-bold text-gray-900 dark:text-white">Analysis cost</span>. 
            You choose both when starting an interview.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Duration Credits</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Quick (~5 min, 4 questions)</span><span className="font-bold text-gray-900 dark:text-white">1 credit</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Standard (~10 min, 6 questions)</span><span className="font-bold text-gray-900 dark:text-white">2 credits</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Deep Dive (~15 min, 8 questions)</span><span className="font-bold text-gray-900 dark:text-white">3 credits</span></div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Analysis Credits</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Basic</span><span className="font-bold text-green-600 dark:text-green-400">+0 (free)</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Detailed</span><span className="font-bold text-blue-600 dark:text-blue-400">+1 credit</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Premium</span><span className="font-bold text-purple-600 dark:text-purple-400">+2 credits</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Total Credit Examples</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Duration</th>
                    <th className="text-center py-2 px-3 text-gray-600 dark:text-gray-400">+ Basic</th>
                    <th className="text-center py-2 px-3 text-gray-600 dark:text-gray-400">+ Detailed</th>
                    <th className="text-center py-2 px-3 text-gray-600 dark:text-gray-400">+ Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {CREDIT_TABLE.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{row.label}</td>
                      <td className="py-2 px-3 text-center font-bold text-gray-900 dark:text-white">{row.basic} cr</td>
                      <td className="py-2 px-3 text-center font-bold text-blue-600 dark:text-blue-400">{row.detailed} cr</td>
                      <td className="py-2 px-3 text-center font-bold text-purple-600 dark:text-purple-400">{row.premium} cr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section id="pricing-plans" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pricing Plans</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {PLANS.map(plan => (
              <div key={plan.name} className={`bg-white dark:bg-gray-800 rounded-xl p-5 border-2 ${plan.color === 'purple' ? 'border-purple-400 dark:border-purple-500' : 'border-gray-200 dark:border-gray-700'} shadow-sm`}>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{plan.name}</h3>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">{plan.price}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.credits} credits</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Best for: {plan.best}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5-Dimension Scoring */}
        <section id="5-dimension-scoring" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">5-Dimension Scoring</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Every answer is evaluated across 5 independent dimensions on a 0–100 scale. This gives you a nuanced understanding of where you excel and where to focus.
          </p>
          <div className="space-y-4">
            {DIMENSIONS.map((dim, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 flex gap-4 items-start">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{dim.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{dim.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 group">
                <summary className="p-5 cursor-pointer font-semibold text-gray-900 dark:text-white flex justify-between items-center">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-10 text-white">
          <h2 className="text-3xl font-bold mb-3">Ready to Practice?</h2>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto">
            Start with 3 free credits — no card required. Pick your field, difficulty, and analysis tier, then practice with our AI interviewer.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/register')}
              className="bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition">
              Get Started Free
            </button>
            <button onClick={() => navigate('/pricing')}
              className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg hover:bg-white/10 transition">
              View Pricing
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} IntervuAI. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-3">
            <button onClick={() => navigate('/privacy')} className="hover:text-white transition">Privacy Policy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-white transition">Terms of Service</button>
            <button onClick={() => navigate('/pricing')} className="hover:text-white transition">Pricing</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
