'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { getNotifications, markNotificationRead } from '@/lib/firestore';
import type { Notification } from '@/types';
import { Bell, CheckCircle, AlertTriangle, Target, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  budget_exceeded: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  budget_warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  large_transaction: { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
  goal_completed: { icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  monthly_summary: { icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-50' },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const notifs = await getNotifications(user.uid);
    setNotifications(notifs);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <AppLayout title="Notifications" subtitle="Alerts and updates">
      <div className="max-w-2xl mx-auto">
        {unread > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{unread} unread notification{unread > 1 ? 's' : ''}</p>
            <button
              onClick={async () => {
                for (const n of notifications.filter((n) => !n.read)) {
                  if (n.id) await markNotificationRead(n.id);
                }
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all as read
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-12 text-center text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs mt-1">You are all caught up</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const config = typeConfig[notif.type] || typeConfig.monthly_summary;
              const Icon = config.icon;
              return (
                <div
                  key={notif.id}
                  className={cn(
                    'rounded-xl border flex items-start gap-4 p-4 cursor-pointer transition-all',
                    notif.read
                      ? 'bg-white/50 border-white/30 opacity-60'
                      : 'bg-white/80 backdrop-blur-md border-white/40 shadow-lg'
                  )}
                  onClick={() => notif.id && !notif.read && handleMarkRead(notif.id)}
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', config.bg)}>
                    <Icon className={cn('w-4 h-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', notif.read ? 'text-slate-500' : 'text-slate-800 font-medium')}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(notif.createdAt)}</p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
