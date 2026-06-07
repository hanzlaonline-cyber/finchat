export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  currency: string;
  createdAt?: Date | string; // Firestore returns string; Firebase Auth uses Date
}

export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  merchant: string;
  date: string;
  paymentMethod: string;
  notes?: string;
  description?: string;
  // Split bill fields
  split?: boolean;
  participants?: number;
  perPersonAmount?: number;
  createdAt?: string;
}

export interface Budget {
  id?: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  month: string; // YYYY-MM
}

export interface Goal {
  id?: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  notes?: string;
  createdAt?: string;
}

export interface Notification {
  id?: string;
  userId: string;
  type: 'budget_exceeded' | 'budget_warning' | 'large_transaction' | 'goal_completed' | 'monthly_summary';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type DateFilterType = 'today' | '7days' | '30days' | 'thisMonth' | 'custom';

export interface DateFilter {
  type: DateFilterType;
  startDate?: Date;
  endDate?: Date;
}

export interface KPIData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  remainingBudget: number;
  healthScore: number;
  previousBalance: number;
  previousIncome: number;
  previousExpenses: number;
}

export interface ChartDataPoint {
  date: string;
  income: number;
  expenses: number;
}

export interface ParsedTransaction {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  merchant: string;
  description: string;
  date: string;
  paymentMethod: string;
  split: boolean;
  participants?: number;
  perPersonAmount?: number;
  confidence: number;
  rawInput: string;
}
