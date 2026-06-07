'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/authStore';
import { updateUserProfile, getTransactions } from '@/lib/firestore';
import {
  updateProfile, deleteUser, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential,
} from 'firebase/auth';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2, User, Bell, Shield, Trash2, Download, Save, Check, CoinsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Currency catalogue ─────────────────────────────────────────────────── */
const CURRENCIES: { code: string; name: string; symbol: string; flag: string }[] = [
  { code: 'PKR', name: 'Pakistani Rupee',    symbol: '₨',  flag: '🇵🇰' },
  { code: 'USD', name: 'US Dollar',          symbol: '$',  flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',               symbol: '€',  flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',      symbol: '£',  flag: '🇬🇧' },
  { code: 'AED', name: 'UAE Dirham',         symbol: 'د.إ',flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal',        symbol: '﷼',  flag: '🇸🇦' },
  { code: 'CAD', name: 'Canadian Dollar',    symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar',  symbol: 'A$', flag: '🇦🇺' },
  { code: 'INR', name: 'Indian Rupee',       symbol: '₹',  flag: '🇮🇳' },
  { code: 'BDT', name: 'Bangladeshi Taka',   symbol: '৳',  flag: '🇧🇩' },
  { code: 'LKR', name: 'Sri Lankan Rupee',   symbol: 'Rs', flag: '🇱🇰' },
  { code: 'JPY', name: 'Japanese Yen',       symbol: '¥',  flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan',       symbol: '¥',  flag: '🇨🇳' },
  { code: 'CHF', name: 'Swiss Franc',        symbol: 'Fr', flag: '🇨🇭' },
  { code: 'MXN', name: 'Mexican Peso',       symbol: 'MX$',flag: '🇲🇽' },
  { code: 'BRL', name: 'Brazilian Real',     symbol: 'R$', flag: '🇧🇷' },
  { code: 'TRY', name: 'Turkish Lira',       symbol: '₺',  flag: '🇹🇷' },
  { code: 'KRW', name: 'South Korean Won',   symbol: '₩',  flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar',   symbol: 'S$', flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit',  symbol: 'RM', flag: '🇲🇾' },
];

/* ── Settings page ──────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, setUserProfile } = useAuthStore();

  const [profileForm, setProfileForm]   = useState({ displayName: '', currency: 'PKR' });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [notifications, setNotifications] = useState({
    budgetAlerts: true, largeTransactions: true, goalUpdates: true, monthlySummary: true,
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [exportLoading,   setExportLoading]   = useState(false);
  const [profileSuccess,  setProfileSuccess]  = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [error, setError] = useState('');
  const [currencySearch, setCurrencySearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        displayName: userProfile.displayName || '',
        currency: userProfile.currency || 'PKR',
      });
    }
  }, [userProfile]);

  const selectedCurrency = CURRENCIES.find((c) => c.code === profileForm.currency) || CURRENCIES[0];
  const filteredCurrencies = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  /* ── handlers ────────────────────────────────────────────────────────── */
  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    setError('');
    try {
      await updateProfile(user, { displayName: profileForm.displayName });
      await updateUserProfile(user.uid, {
        displayName: profileForm.displayName,
        currency: profileForm.currency,
      });
      // Immediately update Zustand store so useCurrency hook reflects the change
      // without needing a page reload
      setUserProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: profileForm.displayName,
        photoURL: userProfile?.photoURL,
        currency: profileForm.currency,
        createdAt: userProfile?.createdAt,
      });
      setProfileSuccess('Currency and profile saved. All amounts now show in ' + profileForm.currency + '.');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email || !passwordForm.current || !passwordForm.newPass) return;
    if (passwordForm.newPass !== passwordForm.confirm) { setError('Passwords do not match.'); return; }
    if (passwordForm.newPass.length < 6) { setError('New password must be at least 6 characters.'); return; }
    setPasswordLoading(true);
    setError('');
    try {
      const credential = EmailAuthProvider.credential(user.email, passwordForm.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordForm.newPass);
      setPasswordSuccess('Password changed successfully.');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setExportLoading(true);
    try {
      const txs = await getTransactions(user.uid);
      const rows = [
        ['Date', 'Type', 'Category', 'Merchant', 'Amount', 'Currency', 'Payment Method', 'Notes'],
        ...txs.map((t) => [t.date, t.type, t.category, t.merchant, t.amount.toString(), profileForm.currency, t.paymentMethod, t.notes || '']),
      ];
      const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `finchat-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmed = confirm('Are you sure? This is irreversible and all your data will be permanently deleted.');
    if (!confirmed) return;
    setDeleteLoading(true);
    try {
      await deleteUser(user);
      router.push('/');
    } catch {
      setError('Failed to delete account. You may need to re-login and try again.');
      setDeleteLoading(false);
    }
  };

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <AppLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-2xl mx-auto space-y-6">

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
        )}

        {/* ── Profile ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-800">Profile Settings</h3>
          </div>

          {profileSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-600 flex items-center gap-2">
              <Check className="w-4 h-4" />{profileSuccess}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="mt-1 opacity-60" />
            </div>
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={profileForm.displayName}
                onChange={(e) => setProfileForm((f) => ({ ...f, displayName: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* ── Currency selector ──────────────────────────────── */}
            <div>
              <Label className="flex items-center gap-1.5">
                <CoinsIcon className="w-3.5 h-3.5 text-slate-400" />
                Currency
              </Label>

              {/* Current selection preview */}
              <div className="mt-2 flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                <span className="text-2xl">{selectedCurrency.flag}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedCurrency.code}
                    <span className="ml-2 text-slate-400 font-normal text-xs">{selectedCurrency.name}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Preview: <span className="font-bold text-blue-700">
                      {formatCurrency(1000, selectedCurrency.code)}
                    </span>
                  </p>
                </div>
                <span className="text-lg font-bold text-slate-400">{selectedCurrency.symbol}</span>
              </div>

              {/* Search */}
              <div className="relative mt-2">
                <Input
                  placeholder="Search currency..."
                  value={currencySearch}
                  onChange={(e) => setCurrencySearch(e.target.value)}
                  className="text-sm h-9"
                />
              </div>

              {/* Grid of currency cards */}
              <div className="mt-2 grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                {filteredCurrencies.map((c) => {
                  const isSelected = profileForm.currency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { setProfileForm((f) => ({ ...f, currency: c.code })); setCurrencySearch(''); }}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-150',
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white shadow-lg shadow-blue-500/20'
                          : 'bg-white/60 border-slate-200/60 text-slate-700 hover:bg-white/90 hover:border-blue-200 hover:shadow-sm'
                      )}
                    >
                      <span className="text-lg flex-shrink-0">{c.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs font-bold leading-tight', isSelected ? 'text-white' : 'text-slate-800')}>
                          {c.code}
                        </p>
                        <p className={cn('text-[10px] leading-tight truncate', isSelected ? 'text-white/80' : 'text-slate-400')}>
                          {c.name}
                        </p>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Save reminder — only shown when currency differs from saved profile */}
              {profileForm.currency !== (userProfile?.currency || 'PKR') && (
                <p className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <Save className="w-3 h-3 flex-shrink-0" />
                  Click <strong>Save Profile</strong> below to apply this currency across the app.
                </p>
              )}
            </div>

            <Button onClick={handleSaveProfile} disabled={profileLoading} className="gap-2">
              {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </Button>
          </div>
        </div>

        {/* ── Password ────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-800">Change Password</h3>
          </div>

          {passwordSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-600 flex items-center gap-2">
              <Check className="w-4 h-4" />{passwordSuccess}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPass">Current Password</Label>
              <Input id="currentPass" type="password" placeholder="••••••••" value={passwordForm.current}
                onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="newPass">New Password</Label>
              <Input id="newPass" type="password" placeholder="At least 6 characters" value={passwordForm.newPass}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPass: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="confirmPass">Confirm New Password</Label>
              <Input id="confirmPass" type="password" placeholder="Re-enter new password" value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))} className="mt-1" />
            </div>
            <Button onClick={handleChangePassword} disabled={passwordLoading} variant="outline" className="gap-2">
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Update Password
            </Button>
          </div>
        </div>

        {/* ── Notifications ────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-800">Notification Preferences</h3>
          </div>
          <div className="space-y-4">
            {[
              { key: 'budgetAlerts',      label: 'Budget Alerts',       desc: 'Get notified when approaching budget limits' },
              { key: 'largeTransactions', label: 'Large Transactions',  desc: 'Alerts for unusually large transactions' },
              { key: 'goalUpdates',       label: 'Goal Updates',        desc: 'Progress updates on savings goals' },
              { key: 'monthlySummary',    label: 'Monthly Summary',     desc: 'Monthly financial summary report' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
                <Switch
                  checked={notifications[key as keyof typeof notifications]}
                  onCheckedChange={(v) => setNotifications((n) => ({ ...n, [key]: v }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Data export ──────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Download className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-800">Data Management</h3>
          </div>
          <Button variant="outline" onClick={handleExportData} disabled={exportLoading} className="gap-2 w-full justify-start">
            {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export All Data (CSV)
          </Button>
        </div>

        {/* ── Danger zone ──────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-red-50/70 backdrop-blur-md border border-red-100 shadow-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-4 h-4 text-red-500" />
            <h3 className="text-base font-semibold text-red-700">Danger Zone</h3>
          </div>
          <p className="text-sm text-red-500 mb-4">Deleting your account is permanent and cannot be undone.</p>
          <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading} className="gap-2">
            {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete Account
          </Button>
        </div>

      </div>
    </AppLayout>
  );
}
