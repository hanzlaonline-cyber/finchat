'use client';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onAddIncome?: () => void;
  onAddExpense?: () => void;
}

export function AppLayout({ children, title, subtitle, onAddIncome, onAddExpense }: AppLayoutProps) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <Sidebar />
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'ml-[68px]' : 'ml-64'
        )}
      >
        <TopBar
          title={title}
          subtitle={subtitle}
          onAddIncome={onAddIncome}
          onAddExpense={onAddExpense}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
