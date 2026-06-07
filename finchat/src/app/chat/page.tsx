'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { useFilterStore } from '@/store/filterStore';
import { getTransactions, getBudgets, getGoals, addTransaction } from '@/lib/firestore';
import { formatCurrency } from '@/lib/utils';
import type { ChatMessage, Transaction, Budget, Goal, ParsedTransaction } from '@/types';
import { Send, Loader2, Sparkles, Bot, User, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const SUGGESTED_QUESTIONS = [
  'How much did I spend this month?',
  'Where is most of my money going?',
  'How can I save more money?',
  'Am I on track with my budgets?',
  'What are my biggest expenses?',
  'Summarize my finances for this period',
  'Predict my spending next month',
  'Which category am I overspending on?',
];

export default function ChatPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuthStore();
  const { dateFilter, getDateRange } = useFilterStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [context, setContext] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const buildContext = useCallback(async () => {
    if (!user) return;
    setContextLoading(true);
    try {
      const { start, end } = getDateRange();
      const [txs, buds, gls] = await Promise.all([
        getTransactions(user.uid, start, end),
        getBudgets(user.uid),
        getGoals(user.uid),
      ]);

      const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const categoryBreakdown = txs
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as Record<string, number>);

      // Today's spending
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todaySpend = txs.filter((t) => t.type === 'expense' && t.date === todayStr)
        .reduce((s, t) => s + t.amount, 0);

      // Split bills
      const splitTxs = txs.filter((t) => t.split);

      const ctx = `
User: ${userProfile?.displayName || 'User'} | Currency: ${userProfile?.currency || 'USD'}
Selected Date Range: ${start.toDateString()} to ${end.toDateString()} (filter: ${dateFilter.type})
Today's Date: ${format(new Date(), 'MMMM d, yyyy')}

FINANCIAL SUMMARY:
- Total Income: ${formatCurrency(income)}
- Total Expenses: ${formatCurrency(expenses)}
- Net Savings: ${formatCurrency(income - expenses)}
- Savings Rate: ${income > 0 ? (((income - expenses) / income) * 100).toFixed(1) : 0}%
- Today's Spending: ${formatCurrency(todaySpend)}
- Transaction Count: ${txs.length}
- Split Bills: ${splitTxs.length} transactions

TOP SPENDING CATEGORIES:
${Object.entries(categoryBreakdown)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8)
  .map(([cat, amt]) => `- ${cat}: ${formatCurrency(amt)} (${income > 0 ? ((amt / expenses) * 100).toFixed(1) : 0}% of expenses)`)
  .join('\n')}

RECENT TRANSACTIONS (last 15):
${txs.slice(0, 15).map((t) => `- ${t.date} | ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)} | ${t.category} | ${t.merchant}${t.split ? ` [SPLIT: ${t.participants} people, ${formatCurrency(t.perPersonAmount || t.amount)} each]` : ''}`).join('\n')}

BUDGETS STATUS:
${buds.map((b) => `- ${b.category}: ${formatCurrency(b.spent)} / ${formatCurrency(b.limit)} (${b.limit > 0 ? ((b.spent / b.limit) * 100).toFixed(0) : 0}% used) — ${b.spent > b.limit ? 'OVER BUDGET' : b.spent / b.limit >= 0.8 ? 'NEAR LIMIT' : 'On track'}`).join('\n') || 'No budgets set'}

SAVINGS GOALS:
${gls.map((g) => `- ${g.goalName}: ${formatCurrency(g.currentAmount)} / ${formatCurrency(g.targetAmount)} (${g.targetAmount > 0 ? ((g.currentAmount / g.targetAmount) * 100).toFixed(0) : 0}%) — Due ${g.deadline}`).join('\n') || 'No goals set'}
`;
      setContext(ctx);
    } finally {
      setContextLoading(false);
    }
  }, [user, userProfile, getDateRange, dateFilter]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      buildContext();
      setMessages([{
        id: '0',
        role: 'assistant',
        content: `Hello ${userProfile?.displayName?.split(' ')[0] || 'there'}! I am your FinChat AI assistant. I have full access to your financial data for the selected date range and can help you understand spending patterns, compare periods, find savings opportunities, and more. What would you like to know?`,
        timestamp: new Date(),
      }]);
    }
  }, [user, buildContext, userProfile]);

  // Rebuild context when date filter changes
  useEffect(() => {
    if (user && context) buildContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setMessages((m) => [...m, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
      });
      const data = await res.json();
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'I could not generate a response.',
        timestamp: new Date(),
      };
      setMessages((m) => [...m, aiMessage]);
    } catch {
      setMessages((m) => [...m, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error. Please check your API configuration and try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Chat cleared. How can I help you with your finances?',
      timestamp: new Date(),
    }]);
  };

  return (
    <AppLayout title="AI Assistant" subtitle="Ask anything about your finances">
      <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] flex flex-col">
        <div className="flex-1 rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/30 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">FinChat AI</p>
                <p className="text-xs text-slate-400">
                  {contextLoading ? 'Refreshing financial data...' : 'Financial data loaded'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={buildContext}
                disabled={contextLoading}
                title="Refresh financial context"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-all disabled:opacity-40"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', contextLoading && 'animate-spin')} />
              </button>
              <button
                onClick={clearChat}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-white/60"
              >
                Clear chat
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-sm'
                    : 'bg-white border border-white/60 shadow-sm text-slate-700 rounded-bl-sm'
                )}>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  <p className={cn('text-xs mt-1', msg.role === 'user' ? 'text-white/60' : 'text-slate-400')}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-white/60 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions — show until 2nd user message */}
          {messages.filter((m) => m.role === 'user').length === 0 && (
            <div className="px-5 pb-3">
              <p className="text-xs text-slate-400 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-2.5 py-1.5 rounded-full text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-white/30">
            <div className="flex gap-2 items-end">
              <Textarea
                placeholder="Ask about your finances, spending trends, savings advice..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="flex-1 resize-none"
                disabled={loading || contextLoading}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading || contextLoading}
                className="h-10 w-10 p-0 rounded-xl flex-shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 text-center">
              Enter to send · Shift+Enter for new line · Date filter applies to context
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
