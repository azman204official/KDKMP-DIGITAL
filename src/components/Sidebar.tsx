import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Wallet, 
  CreditCard, 
  Bell, 
  FileText, 
  Settings, 
  LogOut, 
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { Logo } from './Logo';

export default function Sidebar() {
  const { logout, profile, koperasi } = useAuth();

  const menuItems = [
    { icon: BarChart3, label: 'Beranda', path: '/dashboard', end: true },
    { icon: Users, label: 'Anggota', path: '/dashboard/members', id: 'sidebar-members' },
    { icon: Wallet, label: 'Simpanan', path: '/dashboard/savings' },
    { icon: CreditCard, label: 'Pembayaran', path: '/dashboard/payments', id: 'sidebar-payments' },
    { icon: MessageSquare, label: 'Pesan', path: '/dashboard/messaging' },
    { icon: Bell, label: 'Reminder', path: '/dashboard/reminders' },
    { icon: FileText, label: 'Laporan', path: '/dashboard/reports', id: 'sidebar-reports' },
    { icon: Settings, label: 'Pengaturan', path: '/dashboard/settings' },
  ].filter(item => {
    // If inactive, only show 'Beranda' and 'Pengaturan' (maybe they need to fix something in settings?)
    // Actually, usually they can't do anything. Let's just show Beranda.
    if (profile?.status === 'inactive') return item.path === '/dashboard';
    return true;
  });

  const getAbbreviation = (name: string) => {
    if (!name) return 'KDKMP';
    if (name.length <= 10) return name;
    return name
      .split(' ')
      .filter(word => !['DESA', 'KOPERASI', 'DAN'].includes(word.toUpperCase()))
      .map(word => word[0])
      .join('')
      .toUpperCase() || 'KDKMP';
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="p-8 flex items-center gap-3">
        {koperasi?.logoUrl ? (
          <img src={koperasi.logoUrl} alt="Logo" className="w-10 h-10 object-contain drop-shadow-md rounded-lg" />
        ) : (
          <Logo size="md" />
        )}
        <div className="overflow-hidden">
          <h1 className="font-bold text-lg leading-tight text-gray-900 truncate" title={koperasi?.name}>
            {koperasi?.name ? (koperasi.name.length > 20 ? getAbbreviation(koperasi.name) : koperasi.name) : 'KDKMP'}
          </h1>
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest leading-none truncate">
            {koperasi?.location?.village || koperasi?.location?.district || 'PROFIL KOPERASI'}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            id={item.id}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all group",
              isActive && "bg-red-600 text-white hover:bg-red-600 hover:text-white shadow-lg shadow-red-100"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 p-4 rounded-2xl mb-4 flex items-center gap-3 border border-gray-100">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-gray-600">
            {profile?.displayName?.charAt(0) || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-900 truncate">{profile?.displayName || 'Admin Koperasi'}</p>
            <p className="text-xs text-gray-500 capitalize">{profile?.role?.replace('_', ' ') || 'Admin'}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar Aplikasi</span>
        </button>
      </div>
    </aside>
  );
}
