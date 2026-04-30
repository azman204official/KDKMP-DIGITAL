import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Info, 
  HelpCircle, 
  LogIn,
  UserPlus
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function LandingBottomNav() {
  const items = [
    { icon: Home, label: 'Beranda', path: '/', end: true },
    { icon: Info, label: 'Tentang', path: '/about' },
    { icon: HelpCircle, label: 'Bantuan', path: '/help' },
    { icon: LogIn, label: 'Masuk', path: '/login' },
    { icon: UserPlus, label: 'Daftar', path: '/register-koperasi' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 flex items-center justify-around py-3 px-1 z-50 md:hidden shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1.5 p-1 rounded-2xl transition-all",
            isActive ? "text-red-600 scale-110" : "text-gray-400 hover:text-gray-600"
          )}
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive ? "bg-red-50" : "bg-transparent"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
