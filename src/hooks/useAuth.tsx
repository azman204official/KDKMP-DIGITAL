import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../lib/localDb';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin_koperasi' | 'bendahara' | 'anggota';
  koperasiId: string | null;
  status: 'active' | 'inactive';
  nik?: string;
  photoURL?: string;
  koperasiName?: string;
  location?: {
    province: string;
    regency: string;
    district: string;
    village: string;
  };
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  koperasi: any | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  const profile = useLiveQuery(
    () => (user ? db.users.get(user.uid) : Promise.resolve(null)),
    [user]
  );

  const koperasiId = profile?.koperasiId;

  const koperasi = useLiveQuery(
    () => (koperasiId ? db.koperasi.get(koperasiId) : Promise.resolve(null)),
    [koperasiId]
  );

  const loading = authLoading || (user !== null && profile === undefined);

  const logout = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, profile: profile as unknown as UserProfile | null, koperasi, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

