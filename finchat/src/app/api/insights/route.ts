import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { transactions, budgets, goals, dateRange } = await req.json();

    const totalExpenses = transactions
      .filter((t: { type: string }) => t.type === 'expense')
      .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter((t: { type: string }) => t.type === 'income')
      .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);

    const context = `
Transactions (${dateRange}):
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net Savings: $${(totalIncome - totalExpenses).toFixed(2)}
- Transaction count: ${transactions.length}

Top spending categories:
${JSON.stringify(
  transactions
    .filter((t: { type: string }) => t.type === 'expense')
    .reduce((acc: Record<string, number>, t: { category: string; amount: number }) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {}),
  null,
  2
)}

Active budgets: ${JSON.stringify(budgets.map((b: { category: string; limit: number; spent: number }) => ({ category: b.category, limit: b.limit, spent: b.spent, remaining: b.limit - b.spent })))}

Savings goals: ${JSON.stringify(goals.map((g: { goalName: string; targetAmount: number; currentAmount: number }) => ({ name: g.goalName, target: g.targetAmount, current: g.currentAmount, progress: ((g.currentAmount / g.targetAmount) * 100).toFixed(1) + '%' })))}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a financial insights engine. Generate 3-4 concise, actionable financial insights based on the user\'s data. Each insight should be 1-2 sentences. Focus on spending patterns, budget status, savings opportunities, and anomalies. No emojis. Return as a JSON array of objects with "title" and "description" fields.',
        },
        { role: 'user', content: context },
      ],
      temperature: 0.6,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content || '[]';
    
    // Extract JSON from response
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Insights error:', error);
    return NextResponse.json({ insights: [] }, { status: 200 });
  }
}
