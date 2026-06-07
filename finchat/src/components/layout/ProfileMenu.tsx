'use client';
import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { Settings, LogOut, User, ChevronDown } from 'lucide-react';
import Image from 'next/image';

/* ── helpers ──────────────────────────────────────────────────────────── */

/** Returns first name only: "Muhammad Ali" → "Muhammad" */
function getFirstName(displayName?: string, email?: string): string {
  if (displayName?.trim()) {
    return displayName.trim().split(/\s+/)[0];
  }
  // Fallback: email username before the @
  if (email) return email.split('@')[0];
  return 'User';
}

/** Returns uppercase first letter of first name */
function getInitial(displayName?: string, email?: string): string {
  return getFirstName(displayName, email)[0]?.toUpperCase() || 'U';
}

/* ── Avatar sub-component ─────────────────────────────────────────────── */
interface AvatarProps {
  photoURL?: string | null;
  displayName?: string;
  email?: string;
  size?: 'sm' | 'md';
}

export function Avatar({ photoURL, displayName, email, size = 'md' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initial = getInitial(displayName, email);

  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';

  if (photoURL && !imgError) {
    return (
      <div className={cn('relative rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/60 shadow-md', dim)}>
        <Image
          src={photoURL}
          alt={displayName || 'Profile'}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Gradient based on initial for visual variety
  const gradients: Record<string, string> = {
    A: 'from-rose-400 to-pink-500',
    B: 'from-amber-400 to-orange-500',
    C: 'from-emerald-400 to-teal-500',
    D: 'from-sky-400 to-blue-500',
    E: 'from-violet-400 to-purple-500',
    F: 'from-fuchsia-400 to-pink-500',
    G: 'from-lime-400 to-green-500',
    H: 'from-blue-500 to-indigo-600',
    I: 'from-cyan-400 to-blue-500',
    J: 'from-amber-500 to-yellow-400',
    K: 'from-emerald-500 to-green-600',
    L: 'from-indigo-400 to-blue-500',
    M: 'from-violet-500 to-purple-600',
    N: 'from-teal-400 to-cyan-500',
    O: 'from-orange-400 to-amber-500',
    P: 'from-pink-400 to-rose-500',
    Q: 'from-purple-400 to-violet-500',
    R: 'from-red-400 to-rose-500',
    S: 'from-sky-500 to-blue-600',
    T: 'from-teal-500 to-emerald-600',
    U: 'from-blue-500 to-purple-600',
    V: 'from-violet-500 to-indigo-600',
    W: 'from-amber-400 to-yellow-500',
    X: 'from-slate-500 to-gray-600',
    Y: 'from-yellow-400 to-amber-500',
    Z: 'from-zinc-500 to-slate-600',
  };
  const gradient = gradients[initial] || 'from-blue-500 to-purple-600';

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0',
        'bg-gradient-to-br ring-2 ring-white/60 shadow-md font-bold text-white select-none',
        gradient,
        dim
      )}
    >
      {initial}
    </div>
  );
}

/* ── ProfileMenu ──────────────────────────────────────────────────────── */
export function ProfileMenu() {
  const { user, userProfile } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Derive display values
  const photoURL = user?.photoURL || userProfile?.photoURL || null;
  const displayName = userProfile?.displayName || user?.displayName || '';
  const email = user?.email || userProfile?.email || '';
  const firstName = getFirstName(displayName, email);
  const fullName = displayName || email;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut(auth);
    router.push('/');
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 h-9 pl-1 pr-3 rounded-full transition-all duration-200',
          'bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm',
          'hover:bg-white/80 hover:shadow-md hover:border-white/70',
          open && 'bg-white/90 shadow-md border-blue-200/60'
        )}
      >
        <Avatar photoURL={photoURL} displayName={displayName} email={email} size="sm" />
        <span className="text-sm font-semibold text-slate-700 max-w-[80px] truncate hidden sm:block">
          {firstName}
        </span>
        <ChevronDown
          className={cn(
            'w-3 h-3 text-slate-400 transition-transform duration-200 hidden sm:block',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* ── Dropdown menu ── */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-60 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl shadow-black/10 overflow-hidden">
          {/* User info header */}
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-3">
            <Avatar photoURL={photoURL} displayName={displayName} email={email} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{fullName || 'User'}</p>
              {email && (
                <p className="text-[11px] text-slate-400 truncate">{email}</p>
              )}
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <MenuItem
              icon={<User className="w-3.5 h-3.5" />}
              label="View Profile"
              onClick={() => { setOpen(false); router.push('/settings'); }}
            />
            <MenuItem
              icon={<Settings className="w-3.5 h-3.5" />}
              label="Settings"
              onClick={() => { setOpen(false); router.push('/settings'); }}
            />
          </div>

          <div className="p-1.5 border-t border-slate-100">
            <MenuItem
              icon={<LogOut className="w-3.5 h-3.5" />}
              label="Sign Out"
              onClick={handleSignOut}
              danger
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MenuItem sub-component ───────────────────────────────────────────── */
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, onClick, danger }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
        danger
          ? 'text-red-500 hover:bg-red-50 hover:text-red-600'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      )}
    >
      <span className={cn(danger ? 'text-red-400' : 'text-slate-400')}>{icon}</span>
      {label}
    </button>
  );
}
