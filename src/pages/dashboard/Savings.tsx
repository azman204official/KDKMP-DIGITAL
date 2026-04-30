import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Filter,
  History,
  TrendingUp,
  Download,
  Users,
  Loader2,
  Settings,
  X
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import localDb from '../../lib/localDb';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'react-hot-toast';

export default function Savings() {
  const { profile, koperasi } = useAuth();
  
  const members = useLiveQuery(
    () => profile?.koperasiId ? localDb.anggota.where('koperasiId').equals(profile.koperasiId).toArray() : Promise.resolve([]),
    [profile?.koperasiId],
    []
  );

  const loading = members === undefined;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form State
  const [settingsForm, setSettingsForm] = useState({
    simpananPokok: 0,
    simpananWajib: 0
  });

  useEffect(() => {
    if (koperasi?.settings) {
      setSettingsForm({
        simpananPokok: koperasi.settings.simpananPokok || 0,
        simpananWajib: koperasi.settings.simpananWajib || 0
      });
    }
  }, [koperasi]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.koperasiId) return;

    setIsUpdating(true);
    try {
      if (koperasi?.id) {
        await localDb.koperasi.update(koperasi.id, {
          settings: {
            ...koperasi.settings,
            simpananPokok: Number(settingsForm.simpananPokok),
            simpananWajib: Number(settingsForm.simpananWajib)
          }
        });
      }
      toast.success('Pengaturan simpanan berhasil diperbarui');
      setShowSettingsModal(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memperbarui pengaturan');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredMembers = members.filter(m => 
    (m.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (m.nik || '').includes(searchTerm)
  );

  const stats = {
    totalAnggota: members.length,
    sumPokok: members.reduce((acc, m) => acc + (m.simpananPokok || 0), 0),
    sumWajib: members.reduce((acc, m) => acc + (m.simpananWajib || 0), 0),
    sumSukarela: members.reduce((acc, m) => acc + (m.simpananSukarela || 0), 0),
  };

  const savingsData = [
    { type: 'Simpanan Pokok', total: stats.sumPokok, members: stats.totalAnggota, icon: <Wallet />, color: 'bg-blue-600' },
    { type: 'Simpanan Wajib', total: stats.sumWajib, members: stats.totalAnggota, icon: <TrendingUp />, color: 'bg-green-600' },
    { type: 'Simpanan Sukarela', total: stats.sumSukarela, members: Math.floor(stats.totalAnggota * 0.5), icon: <TrendingUp />, color: 'bg-purple-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 leading-tight">Manajemen Simpanan</h2>
          <p className="text-gray-500 font-medium mt-1">Kelola dan pantau total simpanan anggota koperasi.</p>
        </div>

      </div>

      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900">Pengaturan Simpanan</h3>
                <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleUpdateSettings} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Simpanan Pokok (Sekali seumur hidup)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                      <input 
                        type="number"
                        required
                        value={settingsForm.simpananPokok}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, simpananPokok: Number(e.target.value) }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Simpanan Wajib (Per Bulan)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                      <input 
                        type="number"
                        required
                        value={settingsForm.simpananWajib}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, simpananWajib: Number(e.target.value) }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 py-3.5 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
                  >
                    {isUpdating ? 'Menyimpan...' : 'Simpan Detail'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Savings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {savingsData.map((s) => (
          <div key={s.type} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150", s.color)}></div>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg", s.color)}>
              {React.cloneElement(s.icon as React.ReactElement, { className: 'w-6 h-6' })}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.type}</p>
            <h3 className="text-2xl font-black text-gray-900 mb-4">{formatCurrency(s.total)}</h3>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
               <span className="text-xs font-bold text-gray-500">{s.members} Anggota</span>
               <button className="text-xs font-black text-red-600 uppercase tracking-tighter hover:underline">Detail</button>
            </div>
          </div>
        ))}
      </div>

      {/* List / table area */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Status Simpanan Anggota</h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari anggota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-transparent rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-600 focus:bg-white outline-none"
              />
            </div>
            <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 transition-all">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <p className="text-gray-500 font-medium">Memuat data simpanan...</p>
          </div>
        ) : filteredMembers.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Anggota</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Wajib (Bin)</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Simpanan</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Tagihan</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredMembers.map((member) => {
                    const total = (member.simpananPokok || 0) + (member.simpananWajib || 0) + (member.simpananSukarela || 0);
                    return (
                      <SavingRow 
                        key={member.id}
                        name={member.name} 
                        wajib={member.simpananWajib || 0} 
                        total={total} 
                        status={total >= 100000 ? 'lunas' : 'menunggak'} 
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {filteredMembers.map((member) => {
                const total = (member.simpananPokok || 0) + (member.simpananWajib || 0) + (member.simpananSukarela || 0);
                const status = total >= 100000 ? 'lunas' : 'menunggak';
                return (
                  <div key={member.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900">{member.name}</p>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border",
                        status === 'lunas' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                      )}>
                        {status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-2xl">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Wajib (Bln)</p>
                        <p className="text-xs font-bold text-gray-700">{formatCurrency(member.simpananWajib || 0)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-xs font-black text-red-600">{formatCurrency(total)}</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter hover:text-red-600 transition-colors">
                        <History className="w-3 h-3" /> Lihat Riwayat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada anggota</h3>
            <p className="text-gray-500 font-medium max-w-sm">
              Silakan tambahkan anggota di menu Anggota untuk mengelola simpanan.
            </p>
          </div>
        )}
        <div className="p-6 border-t border-gray-50 text-center">
          <button className="text-sm font-bold text-gray-400 hover:text-red-600 transition-colors">Tampilkan Lebih Banyak</button>
        </div>
      </div>
    </div>
  );
}

function SavingRow({ name, wajib, total, status }: { key?: React.Key, name: string, wajib: number, total: number, status: 'lunas' | 'menunggak' }) {
  return (
    <tr className="hover:bg-gray-50/50 transition-colors group">
      <td className="px-8 py-5 font-bold text-gray-900">{name}</td>
      <td className="px-8 py-5 text-gray-500 font-medium">{formatCurrency(wajib)}</td>
      <td className="px-8 py-5">
        <span className="font-black text-gray-900">{formatCurrency(total)}</span>
      </td>
      <td className="px-8 py-5">
        <span className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
          status === 'lunas' ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
        )}>
          {status}
        </span>
      </td>
      <td className="px-8 py-5 text-right">
        <button className="p-2 text-gray-300 hover:text-red-600 transition-colors">
          <History className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
}
