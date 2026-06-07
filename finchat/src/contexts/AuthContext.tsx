'use client';
import React, { createContext, useContext, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import { useTransactionStore } from '@/store/transactionStore';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, setUser, setUserProfile, setLoading } = useAuthStore();
  const { startListener, stopListener } = useTransactionStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Load Firestore profile
        const profile = await getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
        // Only start the live transaction listener for verified users
        if (firebaseUser.emailVerified) {
          startListener(firebaseUser.uid);
        }
      } else {
        setUserProfile(null);
        // Stop listener and clear data when user signs out
        stopListener();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setUserProfile, setLoading, startListener, stopListener]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
