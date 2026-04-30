import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  Loader2,
  Settings
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { formatCurrency, cn } from '../../lib/utils';
import Onboarding from '../../components/Onboarding';
import { useAuth } from '../../hooks/useAuth';
import localDb from '../../lib/localDb';
import { useLiveQuery } from 'dexie-react-hooks';

const initialData = [
  { name: 'Jan', value: 0 },
  { name: 'Feb', value: 0 },
  { name: 'Mar', value: 0 },
  { name: 'Apr', value: 0 },
  { name: 'Mei', value: 0 },
  { name: 'Jun', value: 0 },
];

export default function Overview() {
  const { profile, koperasi, logout } = useAuth();
  
  const members = useLiveQuery(
    () => (profile?.koperasiId ? localDb.anggota.where('koperasiId').equals(profile.koperasiId).toArray() : Promise.resolve([])),
    [profile?.koperasiId],
    []
  );

  const payments = useLiveQuery(
    () => (profile?.koperasiId ? localDb.pembayaran.where('koperasiId').equals(profile.koperasiId).reverse().sortBy('createdAt') : Promise.resolve([])),
    [profile?.koperasiId],
    []
  );

  const loading = members === undefined || payments === undefined;

  const activities = payments.slice(0, 10).map(data => ({
    id: data.id,
    user: data.anggotaId || 'Anggota', // Might want to join with anggota name
    action: `Pembayaran ${data.jenisSimpanan || 'Simpanan'}`,
    time: data.tanggalBayar || data.createdAt || 'Baru Saja',
    status: data.status || 'pending',
    amount: formatCurrency(data.nominal || 0)
  }));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const last6Months: any[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({ 
      name: months[d.getMonth()], 
      month: d.getMonth(), 
      year: d.getFullYear(), 
      value: 0 
    });
  }

  payments.forEach(payment => {
    if (payment.status === 'verified' && payment.createdAt) {
      const pDate = new Date(payment.createdAt);
      const pMonth = pDate.getMonth();
      const pYear = pDate.getFullYear();

      const monthIndex = last6Months.findIndex(m => m.month === pMonth && m.year === pYear);
      if (monthIndex !== -1) {
        last6Months[monthIndex].value += (payment.nominal || 0);
      }
    }
  });

  const chartData = last6Months.map(({ name, value }) => ({ name, value }));

  const stats = {
    totalAnggota: members.length,
    newMembersThisMonth: members.filter(m => {
        const createdAt = m.createdAt ? new Date(m.createdAt) : null;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return createdAt && createdAt >= startOfMonth;
    }).length,
    totalSimpanan: payments.filter(p => p.status === 'verified').reduce((acc, p) => acc + (p.nominal || 0), 0),
    savingsToday: payments.filter(p => {
        const createdAt = p.createdAt ? new Date(p.createdAt) : null;
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return createdAt && createdAt >= startOfDay;
    }).reduce((acc, p) => acc + (p.nominal || 0), 0),
    totalTunggakan: members.filter(m => ((m as any).simpananPokok || 0) + ((m as any).simpananWajib || 0) + ((m as any).simpananSukarela || 0) < 50000).length * 10000, 
    kasKoperasi: payments.filter(p => p.status === 'verified').reduce((acc, p) => acc + (p.nominal || 0), 0)
  };

  if (profile?.status === 'inactive') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-white">
          <Loader2 className="w-12 h-12 animate-spin" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Menunggu Persetujuan</h1>
        <p className="text-gray-500 mb-8 max-w-sm">
          Akun Admin Koperasi Anda sedang menunggu verifikasi oleh Super Admin. Anda akan mendapatkan akses penuh setelah disetujui.
        </p>
        <button 
          onClick={() => logout()}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Onboarding />
      
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 leading-tight">Selamat pagi, {profile?.displayName?.split(' ')[0] || 'Admin'} 👋</h2>
        <p className="text-gray-500 font-medium mt-1">Ini ringkasan aktivitas {koperasi?.nama || 'Koperasi'} hari ini.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          label="Total Anggota"
          value={stats.totalAnggota.toString()}
          subValue={`+${stats.newMembersThisMonth} bulan ini`}
          icon={<Users className="w-5 h-5" />}
          color="bg-blue-600"
          trend="up"
        />
        <StatCard 
          label="Total Simpanan"
          value={formatCurrency(stats.totalSimpanan)}
          subValue={`+${formatCurrency(stats.savingsToday)} hari ini`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-green-600"
          trend="up"
        />
        <StatCard 
          label="Total Tunggakan"
          value={formatCurrency(stats.totalTunggakan)}
          subValue={`+${formatCurrency(0)} hari ini`}
          icon={<AlertCircle className="w-5 h-5" />}
          color="bg-orange-500"
          trend="down"
        />
        <StatCard 
          label="Kas Koperasi"
          value={formatCurrency(stats.kasKoperasi || stats.totalSimpanan)}
          subValue={`+${formatCurrency(stats.savingsToday)} hari ini`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-red-600"
          trend="up"
        />
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Grafik Pembayaran</h3>
              <p className="text-sm text-gray-500 font-medium">Tren pembayaran simpanan</p>
            </div>
            <select className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold outline-none w-full sm:w-auto">
              <option>6 Bulan Terakhir</option>
              <option>1 Tahun Terakhir</option>
            </select>
          </div>
          <div className="h-64 sm:h-80 w-full lg:-ml-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}Jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v}
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Total']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#dc2626" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Aktivitas Terbaru</h3>
          <div className="space-y-6 flex-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {activities.length > 0 ? (
              activities.slice(0, 8).map((act, i) => (
                <ActivityItem 
                  key={act.id}
                  user={act.user} 
                  action={act.action} 
                  time={act.time} 
                  status={act.status as any}
                  amount={act.amount}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-sm font-bold text-gray-400">Belum ada aktivitas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon, color, trend }: { label: string, value: string, subValue: string, icon: React.ReactNode, color: string, trend: 'up' | 'down' }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={cn("p-3 rounded-2xl text-white group-hover:scale-110 transition-transform", color)}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-gray-900 mt-0.5">{value}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {trend === 'up' ? (
          <ArrowUpRight className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span className={cn("text-xs font-bold", trend === 'up' ? 'text-green-500' : 'text-red-500')}>
          {subValue}
        </span>
      </div>
    </motion.div>
  );
}

function ActivityItem({ user, action, time, amount, status }: { key?: React.Key, user: string, action: string, time: string, amount?: string, status: 'verified' | 'pending' | 'info' }) {
  return (
    <div className="flex items-start gap-4">
      <div className={cn(
        "w-2 h-2 rounded-full mt-2 flex-shrink-0",
        status === 'verified' && "bg-green-500 shadow-lg shadow-green-200",
        status === 'pending' && "bg-orange-400 shadow-lg shadow-orange-200",
        status === 'info' && "bg-blue-500 shadow-lg shadow-blue-200"
      )}></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{user}</p>
        <p className="text-xs font-medium text-gray-400">{action}</p>
        <p className="text-[10px] font-bold text-gray-300 uppercase mt-1">{time}</p>
      </div>
      {amount && (
        <div className="text-right">
          <p className={cn(
            "text-xs font-bold",
            status === 'verified' ? "text-green-600" : "text-orange-600"
          )}>{amount}</p>
          <p className="text-[9px] font-black uppercase text-gray-300">{status}</p>
        </div>
      )}
    </div>
  );
}
