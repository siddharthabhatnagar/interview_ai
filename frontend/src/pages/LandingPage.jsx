import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CheckCircle, Mic, Brain, BarChart3, Zap, Shield, Users, BookOpen } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-blue-600">IntervuAI</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/docs')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span>Docs</span>
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Pricing
              </button>
              {token ? (
                <Button onClick={() => navigate('/dashboard')}>Dashboard</Button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Sign In
                  </button>
                  <Button onClick={() => navigate('/register')}>Get Started Free</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Technical Interview Practice
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
              Ace Your Next
              <span className="text-blue-600 block">Tech Interview</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Practice with an AI interviewer that asks real technical questions, listens to your voice answers,
              and gives instant, detailed feedback. Just like a real interview — but on your schedule.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate(token ? '/dashboard' : '/register')}
                size="lg"
                className="text-lg px-8 py-4"
              >
                {token ? 'Go to Dashboard →' : 'Start Free Interview →'}
              </Button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 text-lg font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                See How It Works
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">No credit card required • 3 free interviews</p>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to interview-ready confidence</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: <Brain className="w-8 h-8 text-blue-600" />,
                title: 'Choose Your Interview',
                description: 'Select your role — Frontend, Backend, Full Stack, DevOps, AI/ML, Gen AI, MLOps, Data Engineer, or Data Scientist — and your difficulty level.',
              },
              {
                step: '2',
                icon: <Mic className="w-8 h-8 text-blue-600" />,
                title: 'Speak Your Answers',
                description: 'Our AI asks real interview questions. Record your voice answers just like a real interview.',
              },
              {
                step: '3',
                icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
                title: 'Get Instant Feedback',
                description: 'Receive detailed scoring, feedback, and follow-up questions. Track your improvement.',
              },
            ].map((item) => (
              <Card key={item.step} className="text-center p-8 hover:shadow-lg transition">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why IntervuAI?</h2>
            <p className="text-xl text-gray-600">Everything you need to prepare for technical interviews</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: 'AI-Powered Questions',
                description: 'Dynamic questions generated by advanced AI, tailored to your skill level and tech stack.',
              },
              {
                icon: <Mic className="w-6 h-6" />,
                title: 'Voice-Based Answers',
                description: 'Practice speaking your answers naturally, just like in a real interview setting.',
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: 'Detailed Scoring',
                description: 'Get scored on each answer with specific feedback on what to improve.',
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Adaptive Follow-ups',
                description: 'AI generates contextual follow-up questions based on your answers.',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'Multiple Tech Stacks',
                description: 'Frontend, Backend, Full Stack, DevOps, and Data Science interview tracks.',
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Track Progress',
                description: 'Review your interview history and watch your scores improve over time.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4 p-6 rounded-xl hover:bg-gray-50 transition">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-12">Trusted by Developers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { stat: '10,000+', label: 'Practice Interviews' },
              { stat: '95%', label: 'User Satisfaction' },
              { stat: '3x', label: 'Better Interview Performance' },
            ].map((item, idx) => (
              <div key={idx}>
                <p className="text-5xl font-extrabold text-white mb-2">{item.stat}</p>
                <p className="text-blue-200 text-lg">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Crush Your Next Interview?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Start practicing today with your free interview. No credit card required.
          </p>
          <Button
            onClick={() => navigate(token ? '/dashboard' : '/register')}
            size="lg"
            className="text-lg px-10 py-4"
          >
            {token ? 'Go to Dashboard →' : 'Get Started Free →'}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">IntervuAI</h3>
              <p className="text-sm">AI-powered technical interview practice platform for developers.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate('/pricing')} className="hover:text-white transition">Pricing</button></li>
                <li><button onClick={() => navigate('/docs')} className="hover:text-white transition">Documentation</button></li>
                <li><button onClick={() => navigate('/register')} className="hover:text-white transition">Sign Up</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Interview Types</h4>
              <ul className="space-y-2 text-sm">
                <li>Frontend</li>
                <li>Backend</li>
                <li>Full Stack</li>
                <li>DevOps</li>
                <li>AI/ML Engineer</li>
                <li>Gen AI Engineer</li>
                <li>MLOps Engineer</li>
                <li>Data Engineer</li>
                <li>Data Scientist</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white transition">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-white transition">Terms of Service</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} IntervuAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
