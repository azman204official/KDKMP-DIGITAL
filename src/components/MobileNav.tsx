import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Wallet, 
  CreditCard, 
  MessageSquare,
  FileText,
  Settings 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

export default function MobileNav() {
  const { profile } = useAuth();
  const menuItems = [
    { icon: BarChart3, label: 'Beranda', path: '/dashboard', end: true },
    { icon: Users, label: 'Anggota', path: '/dashboard/members' },
    { icon: Wallet, label: 'Simpanan', path: '/dashboard/savings' },
    { icon: CreditCard, label: 'Bayar', path: '/dashboard/payments' },
    { icon: MessageSquare, label: 'Pesan', path: '/dashboard/messaging' },
    { icon: FileText, label: 'Laporan', path: '/dashboard/reports' },
  ].filter(item => {
    if (profile?.status === 'inactive') return item.path === '/dashboard';
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around py-2 px-1 z-30 md:hidden">
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl text-gray-400 hover:text-red-600 transition-all",
            isActive && "text-red-600"
          )}
        >
          <item.icon className="w-6 h-6" />
          <span className="text-[10px] font-bold">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
