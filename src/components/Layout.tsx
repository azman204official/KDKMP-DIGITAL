import React from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { Bell, Search, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import localDb from '../lib/localDb';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const pendingCount = useLiveQuery(
    () => {
      if (!profile?.koperasiId) return Promise.resolve(0);
      return localDb.pembayaran
        .where({ koperasiId: profile.koperasiId, status: 'pending' })
        .count();
    },
    [profile?.koperasiId],
    0
  );

  return (
    <div className="flex bg-gray-50 min-h-screen overflow-hidden">
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col pb-20 md:pb-0 min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 pr-2">
            <Logo size="md" />
            <div className="min-w-0">
              <div className="text-base md:text-lg font-black text-gray-900 leading-tight truncate uppercase">KDKMP</div>
              <div className="text-[9px] md:text-[10px] font-bold text-red-600 tracking-wider leading-tight truncate uppercase">Digital</div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button 
              onClick={() => navigate('/dashboard/settings')}
              className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 hover:bg-red-50 transition-all"
              title="Atur"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/dashboard/payments')}
              className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 hover:bg-red-50 transition-all relative"
              title="Lihat Pembayaran"
            >
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {pendingCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => logout()}
              className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 hover:bg-red-50 transition-all"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="h-10 w-px bg-gray-100 mx-2 hidden sm:block"></div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none">
                {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-xs text-gray-400 font-medium mt-1">Status: Sistem Online</p>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="px-4 md:px-8 mt-4">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari..."
              className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-red-600 transition-all outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Content */}
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
