'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  TrendingUp,
  Shield,
  MessageSquare,
  Target,
  PieChart,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const features = [
  {
    icon: TrendingUp,
    title: 'Smart Expense Tracking',
    description: 'Track every transaction with AI-powered categorization. Get instant insights into your spending habits.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: MessageSquare,
    title: 'AI Finance Assistant',
    description: 'Ask your finances anything. Get real-time answers about spending patterns, budget status, and savings advice.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Target,
    title: 'Goals & Budgets',
    description: 'Set financial goals and monthly budgets. Get alerts when you are close to exceeding limits.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: PieChart,
    title: 'Visual Analytics',
    description: 'Beautiful charts and reports that make your financial data easy to understand at a glance.',
    color: 'from-orange-500 to-amber-500',
  },
];

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '$2B+', label: 'Tracked' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9/5', label: 'Rating' },
];

const benefits = [
  'AI-powered expense categorization',
  'Real-time budget alerts',
  'Savings goal tracking',
  'Monthly financial reports',
  'Secure Firebase backend',
  'Export to PDF and CSV',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
              FinChat
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#benefits" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Benefits</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-8">
          <Shield className="w-3.5 h-3.5" />
          Powered by Groq AI
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
          Your AI-Powered
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-500 bg-clip-text text-transparent">
            Finance Assistant
          </span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          Track expenses, manage budgets, and get intelligent financial insights.
          FinChat understands your money so you can make smarter decisions.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="gap-2 px-8">
              Start for Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Sign In to Dashboard</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-5">
              <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything you need to manage your finances</h2>
          <p className="text-slate-500 max-w-xl mx-auto">A complete financial platform built for modern users who want clarity and control.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg mb-4`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="max-w-6xl mx-auto px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[100px]" />
          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Built for serious financial clarity</h2>
              <p className="text-white/80 mb-8 leading-relaxed">
                FinChat combines the power of Firebase and Groq AI to deliver a real fintech experience.
                No spreadsheets, no guesswork — just clear financial intelligence.
              </p>
              <Link href="/signup">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl gap-2">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <CheckCircle className="w-4 h-4 text-teal-300 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/90">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-slate-400 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-slate-700">FinChat</span>
        </div>
        <p>The AI-powered personal finance platform.</p>
      </footer>
    </div>
  );
}
