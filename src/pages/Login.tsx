import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, Eye, EyeOff, KeyRound } from 'lucide-react';
import LandingBottomNav from '../components/LandingBottomNav';
import { signInWithEmailAndPassword, auth, sendPasswordResetEmail } from '../lib/firebase';
import db from '../lib/localDb';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const { profile, user, loading } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  React.useEffect(() => {
    if (!loading && user && !profile) {
      // Special case for Super Admin bootstrap email
      if (user.email === 'perkopdesmerahputih@gmail.com' || user.email === 'azman204official@gmail.com') {
        const createAdminProfile = async () => {
          try {
            await db.users.put({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'Super Admin',
              role: 'super_admin',
              status: 'active',
              koperasiId: null
            });
            // Profile created, useAuth will refresh profile
          } catch (error) {
            console.error('Error creating admin profile:', error);
            auth.signOut();
          }
        };
        createAdminProfile();
        return;
      }

      // Small delay to allow profile to load if it was just created or if there's a flicker
      const timer = setTimeout(() => {
        if (user && !profile) {
          toast.error('Akun Anda belum terdaftar secara lengkap. Silakan lakukan pendaftaran.');
          auth.signOut();
          navigate('/register-koperasi');
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, profile, loading, navigate]);

  React.useEffect(() => {
    if (!loading && profile && user) {
      // Override for Super Admin
      if (user.email === 'perkopdesmerahputih@gmail.com' || user.email === 'azman204official@gmail.com') {
        if (profile.role !== 'super_admin') {
          const makeSuperAdmin = async () => {
             await db.users.update(user.uid, { role: 'super_admin', status: 'active' });
          };
          makeSuperAdmin();
        }
        navigate('/super-admin');
        return;
      }

      if (profile.status === 'inactive') {
        auth.signOut();
        toast.error('Akun Anda sudah tidak aktif.');
        return;
      }
      if (profile.role === 'anggota') navigate('/member');
      else if (profile.role === 'super_admin') navigate('/super-admin');
      else navigate('/dashboard');
    }
  }, [profile, user, loading, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Silakan isi email dan password.');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Format email tidak valid.');
      return;
    }

    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Berhasil masuk');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Auto-create super admin if it doesn't exist
      if ((email === 'perkopdesmerahputih@gmail.com' || email === 'azman204official@gmail.com') && 
          (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials')) {
        try {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          await createUserWithEmailAndPassword(auth, email, password);
          toast.success('Akun Super Admin berhasil dibuat dan masuk');
          return;
        } catch (createError: any) {
          console.error("Auto create admin failed:", createError);
          if (createError.code === 'auth/email-already-in-use') {
             toast.error('Email atau password salah.');
             return;
          }
        }
      }

      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Gagal: Login Email/Password belum diaktifkan di Firebase Console.');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials' || error.code === 'auth/invalid-email') {
        toast.error('Email atau password salah.');
      } else {
        toast.error('Gagal masuk: ' + (error.message || 'Pastikan akun Anda sudah terdaftar.'));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Silakan isi email Anda terlebih dahulu.');
      return;
    }
    
    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Email pemulihan kata sandi telah dikirim. Silakan cek kotak masuk atau spam email Anda.');
      setIsResetting(false);
    } catch (error: any) {
      console.error('Reset password error:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error('Email tidak terdaftar.');
      } else {
        toast.error('Gagal mengirim email pemulihan. Pastikan email Anda benar.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side: Branding */}
      <div className="hidden md:flex md:w-1/2 bg-red-600 items-center justify-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          <h1 className="text-5xl font-bold mb-3 uppercase font-sans">KDKMP</h1>
          <p className="text-xl text-red-100 font-bold mb-6 tracking-wide">
            Digital
          </p>
          <p className="text-lg text-red-50 leading-relaxed max-w-sm mx-auto">
            Solusi cerdas bagi pengurus untuk mengelola data anggota, menagih iuran otomatis, dan memantau keuangan secara transparan.
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 pb-32">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="md:hidden flex items-center gap-3 mb-12">
            <Logo size="md" />
            <div className="flex flex-col">
              <span className="font-black text-2xl text-gray-900 leading-none uppercase">KDKMP</span>
              <span className="text-xs font-bold text-red-600 tracking-widest uppercase">Digital</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isResetting ? 'Lupa Password' : 'Selamat Datang'}
          </h2>
          <p className="text-gray-600 mb-10">
            {isResetting 
              ? 'Masukkan email Anda untuk menerima link pemulihan' 
              : 'Silakan masuk menggunakan akun Anda'}
          </p>

          {!isResetting ? (
            <form className="space-y-6" onSubmit={handleEmailLogin}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email atau Nomor HP</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 flex pl-12 pr-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                    placeholder="Masukkan email..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-semibold text-gray-700">Password</label>
                  <button 
                    type="button"
                    onClick={() => setIsResetting(true)}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 flex pl-12 pr-12 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                disabled={authLoading}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? 'Memproses...' : 'Masuk'} <LogIn className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email Anda</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 flex pl-12 pr-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                    placeholder="user@example.com"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  disabled={authLoading}
                  className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {authLoading ? 'Memproses...' : 'Kirim Link Pemulihan'} <KeyRound className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => setIsResetting(false)}
                  className="w-full py-3 text-gray-500 font-bold hover:text-gray-700 transition-colors"
                >
                  Kembali ke Login
                </button>
              </div>
            </form>
          )}

          <p className="mt-10 text-center text-gray-600 font-medium">
            Belum punya akun? {' '}
            <button 
              onClick={() => navigate('/register-koperasi')}
              className="text-red-600 font-bold hover:underline"
            >
              Daftar
            </button>
          </p>
        </motion.div>
      </div>
      <LandingBottomNav />
    </div>
  );
}
