import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const systemPrompt = `You are FinChat, an expert AI-powered personal finance assistant. You help users understand their financial data, spending patterns, budgets, and savings goals.

## User Financial Context:
${context || 'No financial data available yet.'}

## Your Role:
- Analyze the user's financial data accurately
- Provide clear, actionable financial insights
- Answer questions about spending, income, budgets, and goals
- Detect spending anomalies and suggest improvements
- Predict future expenses based on trends
- Give personalized advice based on the user's actual data
- Be concise, professional, and supportive

## Rules:
- Always reference the actual numbers from the user's data when available
- Format currency values with $ symbol
- Be encouraging but honest about financial health
- Do not use emojis
- Provide specific, actionable recommendations
- If asked about predictions, base them on historical patterns

Respond in a helpful, professional tone. Keep responses focused and practical.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content || 'I could not generate a response.';
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Groq API error:', error);
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}
