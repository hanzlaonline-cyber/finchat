import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Healthcare', 'Housing', 'Utilities', 'Education', 'Travel',
  'Personal Care', 'Insurance', 'Investments', 'Other',
];

const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Business', 'Investment Returns', 'Rental Income', 'Other Income',
];

export async function POST(req: NextRequest) {
  try {
    const { description, type = 'expense' } = await req.json();
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a financial transaction categorizer. Given a transaction description, return ONLY the most appropriate category from this list: ${categories.join(', ')}. Return only the category name, nothing else.`,
        },
        {
          role: 'user',
          content: `Categorize this ${type} transaction: "${description}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 20,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    const category = categories.find((c) => raw.toLowerCase().includes(c.toLowerCase())) || categories[categories.length - 1];

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Categorize error:', error);
    return NextResponse.json({ category: 'Other' }, { status: 200 });
  }
}
