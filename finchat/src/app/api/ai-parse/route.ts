import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Categories ────────────────────────────────────────────────────────────────
const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Healthcare', 'Housing', 'Utilities', 'Education', 'Travel',
  'Personal Care', 'Insurance', 'Investments', 'Other',
];

const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Business', 'Investment Returns', 'Rental Income', 'Other Income',
];

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'Digital Wallet', 'Check'];

// ── System prompt — Human Understanding Mode ──────────────────────────────────
function buildSystemPrompt(): string {
  const today = new Date().toISOString().split('T')[0];

  return `You are FinChat AI, a highly intelligent financial reasoning system.

Your job is NOT just to extract numbers. You understand the FULL SITUATION like a human financial advisor.
You read the user's message as a complete story, understand what actually happened financially, then convert it into structured records.

## HOW YOU THINK

Step 1 — Read as a story. Understand the real-life situation fully.
Step 2 — Identify every financial event: money spent, received, transferred, or split.
Step 3 — For each event, decide if it is income or expense.
Step 4 — Extract the amount the user personally pays or receives (not what others pay).
Step 5 — Assign the most contextually appropriate category and description.
Step 6 — Output ALL events as separate entries.

You never treat sentences separately in isolation — you understand the full context.
You never ask questions, never return text, never merge unrelated events.

## OUTPUT FORMAT

Return ONLY a JSON array. No markdown. No explanation. No extra text.

[
  {
    "type": "income" | "expense",
    "amount": <number — what the user personally pays or receives>,
    "category": <string — from allowed list below>,
    "merchant": <string — who they paid or received from>,
    "description": <string — natural 1-sentence summary>,
    "date": "<YYYY-MM-DD — today is ${today} unless context says otherwise>",
    "paymentMethod": "Credit Card" | "Debit Card" | "Cash" | "Bank Transfer" | "Digital Wallet" | "Check",
    "split": <boolean>,
    "participants": <number — ONLY if split=true>,
    "perPersonAmount": <number — ONLY if split=true>,
    "confidence": <0.0–1.0>
  }
]

## ALLOWED CATEGORIES

EXPENSE: ${EXPENSE_CATEGORIES.join(', ')}
INCOME: ${INCOME_CATEGORIES.join(', ')}

## SPLIT BILL LOGIC

- "bill was 500 split among 5" → amount=100 (user's share), split=true, participants=5, perPersonAmount=100
- "we split the bill" with no count → amount=total (assume user paid full), split=false
- If no split mentioned → split=false, omit participants and perPersonAmount

## CONTEXTUAL REASONING EXAMPLES

Story: "I went to grocery store with 600 rupees, bought items for 500, later I received my salary of 70000"
Events: expense 500 (Food & Dining) + income 70000 (Salary)
Note: The 600 they had is NOT a transaction. Only the 500 spent and 70000 received are events.

Story: "Had lunch with friends, total bill was 1200, split equally among 4 of us"
Events: expense 300 (Food & Dining, split=true, participants=4, perPersonAmount=300)

Story: "Client paid me 15000 for the website design, then I paid my internet bill of 2000"
Events: income 15000 (Freelance) + expense 2000 (Utilities)

Story: "Bought shoes for 3500 and a bag for 1200 at the mall"
Events: expense 3500 (Shopping) + expense 1200 (Shopping) — two separate items

Story: "Got 5000 pocket money from my dad and spent 800 on food and 200 on transport"
Events: income 5000 (Other Income) + expense 800 (Food & Dining) + expense 200 (Transportation)

## IMPORTANT RULES

1. Return an ARRAY even for a single transaction
2. Ignore context-only details (e.g. "I had 600 rupees with me" is not a transaction)
3. Never merge separate financial events into one
4. If amount is ambiguous, use your best judgment and set confidence < 0.7
5. Always use today's date (${today}) unless the user specifies a date
6. For recurring events ("I pay 5000 rent monthly"), treat it as one entry for now`;
}

// ── Sanitize for Firestore ────────────────────────────────────────────────────
function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  );
}

// ── Validate and normalise a single parsed entry ──────────────────────────────
function validateEntry(p: Record<string, unknown>, index: number): { valid: boolean; error?: string } {
  if (!p.type || !['income', 'expense'].includes(p.type as string)) {
    return { valid: false, error: `Entry ${index}: invalid type "${p.type}"` };
  }

  // Coerce amount
  if (typeof p.amount === 'string') p.amount = parseFloat(p.amount as string);
  if (typeof p.amount !== 'number' || isNaN(p.amount as number) || (p.amount as number) <= 0) {
    return { valid: false, error: `Entry ${index}: invalid amount "${p.amount}"` };
  }

  // Normalise category — find closest match if not exact
  if (!p.category || !ALL_CATEGORIES.includes(p.category as string)) {
    const cat = p.category as string || '';
    const match = ALL_CATEGORIES.find(
      (c) => c.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(c.toLowerCase().split(' ')[0])
    );
    p.category = match || (p.type === 'income' ? 'Other Income' : 'Other');
  }

  // Normalise date
  if (!p.date || !/^\d{4}-\d{2}-\d{2}$/.test(p.date as string)) {
    p.date = new Date().toISOString().split('T')[0];
  }

  // Normalise payment method
  if (!p.paymentMethod || !PAYMENT_METHODS.includes(p.paymentMethod as string)) {
    p.paymentMethod = 'Cash';
  }

  // Normalise merchant
  if (!p.merchant || (p.merchant as string).trim() === '') {
    p.merchant = 'Unknown';
  }

  // Normalise description
  if (!p.description || (p.description as string).trim() === '') {
    p.description = `${p.type === 'income' ? 'Received' : 'Paid'} ${p.amount} — ${p.category}`;
  }

  // Normalise split
  if (typeof p.split !== 'boolean') p.split = false;
  if (p.split === true) {
    const participants = Number(p.participants);
    if (!participants || participants < 2) {
      p.split = false;
      delete p.participants;
      delete p.perPersonAmount;
    } else {
      p.participants = participants;
      p.perPersonAmount = Number(p.amount);
    }
  } else {
    delete p.participants;
    delete p.perPersonAmount;
  }

  // Normalise confidence
  if (typeof p.confidence !== 'number' || p.confidence < 0 || p.confidence > 1) {
    p.confidence = 0.8;
  }

  return { valid: true };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.input?.trim()) {
      return NextResponse.json({ error: 'Input is required', transactions: [] }, { status: 400 });
    }

    const userInput = String(body.input).trim();

    // ── Call Groq ──────────────────────────────────────────────────────────
    let raw = '';
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: userInput },
        ],
        temperature: 0.15,
        max_tokens: 1000,
      });
      raw = completion.choices[0]?.message?.content?.trim() || '';
    } catch (groqErr: unknown) {
      const msg = groqErr instanceof Error ? groqErr.message : 'Groq API error';
      console.error('Groq error:', msg);
      return NextResponse.json({ error: `AI service error: ${msg}`, transactions: [] }, { status: 502 });
    }

    // ── Parse JSON array ───────────────────────────────────────────────────
    let entries: Record<string, unknown>[];
    try {
      // Strip markdown fences if model included them
      const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
      const parsed = JSON.parse(cleaned);
      // Handle both array and single object responses
      entries = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Try to extract JSON array from the response
      const arrMatch = raw.match(/\[[\s\S]*\]/);
      const objMatch = raw.match(/\{[\s\S]*\}/);
      if (arrMatch) {
        try { entries = JSON.parse(arrMatch[0]); }
        catch { return NextResponse.json({ error: 'AI returned invalid JSON. Please try again.', transactions: [] }, { status: 422 }); }
      } else if (objMatch) {
        try { entries = [JSON.parse(objMatch[0])]; }
        catch { return NextResponse.json({ error: 'AI could not parse the situation. Please rephrase.', transactions: [] }, { status: 422 }); }
      } else {
        return NextResponse.json({ error: 'AI did not return structured data. Please rephrase.', transactions: [] }, { status: 422 });
      }
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: 'No financial events found in your message.', transactions: [] }, { status: 422 });
    }

    // ── Validate and clean each entry ──────────────────────────────────────
    const valid: Record<string, unknown>[] = [];
    const errors: string[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (typeof entry !== 'object' || entry === null) continue;
      const result = validateEntry(entry, i + 1);
      if (result.valid) {
        valid.push(sanitize(entry));
      } else if (result.error) {
        errors.push(result.error);
      }
    }

    if (valid.length === 0) {
      return NextResponse.json({
        error: `Could not extract valid transactions. ${errors.join('; ')}`,
        transactions: [],
      }, { status: 422 });
    }

    return NextResponse.json({ transactions: valid, error: null });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown server error';
    console.error('ai-parse route error:', msg);
    return NextResponse.json({ error: `Server error: ${msg}`, transactions: [] }, { status: 500 });
  }
}
