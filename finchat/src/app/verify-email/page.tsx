'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification, reload, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2, Mail, CheckCircle, RefreshCw, LogOut } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [checking,    setChecking]    = useState(false);
  const [resending,   setResending]   = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message,     setMessage]     = useState('');
  const [error,       setError]       = useState('');

  const user = auth.currentUser;

  // Redirect if not logged in
  useEffect(() => {
    if (!auth.currentUser) router.push('/login');
  }, [router]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Auto-check verification every 4 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const u = auth.currentUser;
      if (!u) return;
      await reload(u);
      if (u.emailVerified) {
        clearInterval(interval);
        router.push('/dashboard');
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [router]);

  const handleCheckNow = useCallback(async () => {
    if (!user) return;
    setChecking(true);
    setError('');
    setMessage('');
    try {
      await reload(user);
      if (user.emailVerified) {
        router.push('/dashboard');
      } else {
        setMessage('Email not verified yet. Please check your inbox and click the link.');
      }
    } catch {
      setError('Could not check status. Please try again.');
    } finally {
      setChecking(false);
    }
  }, [user, router]);

  const handleResend = async () => {
    if (!user || resendCooldown > 0) return;
    setResending(true);
    setError('');
    setMessage('');
    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent. Check your inbox.');
      setResendCooldown(60);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/too-many-requests') {
        setError('Too many requests. Wait a moment before trying again.');
        setResendCooldown(60);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to resend. Try again.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/10 p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Verify your email</h1>
            <p className="text-sm text-slate-500 mt-1 text-center">
              One more step to activate your FinChat account
            </p>
          </div>

          {/* Email display */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-500 font-medium">Verification sent to</p>
              <p className="text-sm font-semibold text-blue-800 truncate">{user.email}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3 mb-6">
            {[
              'Open the email we just sent you',
              'Click the verification link inside',
              'Come back here — we\'ll detect it automatically',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-slate-600">{step}</p>
              </div>
            ))}
          </div>

          {/* Auto-checking indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 mb-5">
            <div className="flex gap-1 flex-shrink-0">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500">Checking automatically every few seconds...</p>
          </div>

          {/* Feedback messages */}
          {message && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5">
            <Button onClick={handleCheckNow} className="w-full gap-2" disabled={checking}>
              {checking
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</>
                : <><CheckCircle className="w-4 h-4" /> I've verified — continue</>}
            </Button>

            <Button
              variant="outline"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="w-full gap-2"
            >
              {resending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : resendCooldown > 0 ? (
                <><RefreshCw className="w-4 h-4" /> Resend in {resendCooldown}s</>
              ) : (
                <><RefreshCw className="w-4 h-4" /> Resend verification email</>
              )}
            </Button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Use a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
