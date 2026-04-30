import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Users, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LandingBottomNav from '../components/LandingBottomNav';
import { Logo } from '../components/Logo';

export default function Home() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'super_admin') navigate('/super-admin');
      else if (profile.role === 'anggota') navigate('/member');
      else if (profile.role === 'admin_koperasi') navigate('/dashboard');
    }
  }, [user, profile, loading, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Hero Section */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Logo size="md" />
          <div className="flex flex-col">
            <span className="font-black text-xl text-gray-900 leading-none uppercase">KDKMP</span>
            <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase">Digital</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="text-gray-600 font-medium hover:text-red-600 transition-colors"
          >
            Masuk
          </button>
          <button 
            onClick={() => navigate('/register-koperasi')}
            className="bg-red-600 text-white px-5 py-2 rounded-full font-medium hover:bg-red-700 transition-all shadow-lg shadow-red-200"
          >
            Daftar Koperasi
          </button>
        </div>
      </nav>

      <main>
        <section className="px-6 pt-20 pb-12 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-8">
              <Logo size="lg" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Platform Digital <span className="text-red-600">Koperasi Desa</span> Masa Depan
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Memudahkan pengurus dalam pengelolaan data anggota, penagihan iuran otomatis, serta pemantauan laporan keuangan yang akurat dan transparan bagi seluruh anggota.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/register-koperasi')}
                className="w-full sm:w-auto bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-200"
              >
                Mulai Sekarang <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="px-6 py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-red-600" />}
              title="Manajemen Anggota"
              description="Pendataan anggota koperasi yang sistematis dan mudah dikelola oleh pengurus."
            />
            <FeatureCard 
              icon={<CreditCard className="w-8 h-8 text-red-600" />}
              title="Pembayaran Digital"
              description="Sistem QR Code dan verifikasi otomatis untuk pembayaran simpanan wajib dan pokok."
            />
            <FeatureCard 
              icon={<Bell className="w-8 h-8 text-red-600" />}
              title="Reminder Otomatis"
              description="Notifikasi pengingat pembayaran melalui WhatsApp dan Email secara otomatis."
            />
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-gray-100 text-center">
        <p className="text-gray-500 font-medium">© 2026 KDKMP Digital</p>
      </footer>
      <LandingBottomNav />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-red-200 transition-all hover:shadow-xl group">
      <div className="mb-6 p-4 bg-red-50 rounded-2xl w-fit group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
