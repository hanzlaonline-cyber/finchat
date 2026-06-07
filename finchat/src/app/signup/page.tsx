'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, seedSampleData } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Loader2, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  const getPasswordStrength = (p: string) => {
    if (p.length === 0) return null;
    if (p.length < 6)   return { label: 'Too short',  color: 'bg-red-400',    w: 'w-1/4' };
    if (p.length < 8)   return { label: 'Weak',       color: 'bg-orange-400', w: 'w-2/4' };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p))
                        return { label: 'Strong',      color: 'bg-emerald-500',w: 'w-full' };
    return              { label: 'Fair',               color: 'bg-blue-400',   w: 'w-3/4' };
  };
  const strength = getPasswordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      // 1. Create account
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Set display name
      await updateProfile(cred.user, { displayName: name });

      // 3. Create Firestore profile
      await createUserProfile(cred.user.uid, {
        uid: cred.user.uid,
        email,
        displayName: name,
        currency: 'PKR',
      });

      // 4. Seed sample data
      await seedSampleData(cred.user.uid);

      // 5. Send verification email
      await sendEmailVerification(cred.user);

      // 6. Go to verify page (NOT dashboard — account must be verified first)
      router.push('/verify-email');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email':        'Please enter a valid email address.',
        'auth/weak-password':        'Password is too weak. Use at least 6 characters.',
      };
      setError(messages[code || ''] || (err instanceof Error ? err.message : 'Signup failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/10 p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Create your account</h1>
            <p className="text-sm text-slate-500 mt-1">Start your financial journey with FinChat</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full name */}
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {/* Password with show/hide + strength meter */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {strength && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.w}`} />
                  </div>
                  <p className={`text-[11px] font-medium ${
                    strength.label === 'Strong' ? 'text-emerald-600' :
                    strength.label === 'Fair'   ? 'text-blue-500' :
                    strength.label === 'Weak'   ? 'text-orange-500' : 'text-red-500'
                  }`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
          </form>

          {/* Verification notice */}
          <div className="mt-4 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-xs text-blue-600 text-center">
              A verification email will be sent to confirm your address before accessing the app.
            </p>
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
