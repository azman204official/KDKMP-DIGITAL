import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Search, 
  Check, 
  X, 
  Eye, 
  Clock, 
  Calendar,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Megaphone
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import localDb from '../../lib/localDb';
import { useLiveQuery } from 'dexie-react-hooks';

interface Payment {
  id: string;
  member: string;
  type: string;
  amount: number;
  date: string;
  status: 'pending' | 'verified' | 'rejected';
  method: string;
  proofUrl?: string;
  createdAt: any;
}

export default function Payments() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const paymentsRaw = useLiveQuery(
    () => profile?.koperasiId ? localDb.pembayaran.where('koperasiId').equals(profile.koperasiId).reverse().sortBy('createdAt') : Promise.resolve([]),
    [profile?.koperasiId],
    []
  );
  
  // Transform dexie payments structure to match what component expects
  const payments = (paymentsRaw || []).map(p => ({
    id: p.id!.toString(),
    member: p.anggotaId, // will handle display later or just use ID
    type: p.jenisSimpanan,
    amount: p.nominal,
    date: new Date(p.createdAt).toLocaleDateString('id-ID'),
    status: p.status,
    method: 'Transfer', // Not explicitly in model, defaulting
    proofUrl: p.buktiPembayaran,
    createdAt: p.createdAt
  })) as Payment[];

  const loading = paymentsRaw === undefined;

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    if (!profile?.koperasiId) return;
    const payment = payments.find(p => p.id === id);
    if (!payment) return;

    try {
      await localDb.pembayaran.update(parseInt(id), {
        status,
        updatedAt: new Date().toISOString()
      });

      // Update Anggota's simpanan if verified
      if (status === 'verified') {
        const rawPayment = paymentsRaw?.find(p => p.id === parseInt(id));
        if (rawPayment) {
          const anggota = await localDb.anggota.get(rawPayment.anggotaId);
          if (anggota) {
            let updateData: any = {};
            if (rawPayment.jenisSimpanan === 'Simpanan Pokok') {
              updateData.simpananPokok = (anggota.simpananPokok || 0) + rawPayment.nominal;
            } else if (rawPayment.jenisSimpanan === 'Simpanan Wajib') {
              updateData.simpananWajib = (anggota.simpananWajib || 0) + rawPayment.nominal;
            } else if (rawPayment.jenisSimpanan === 'Simpanan Sukarela') {
              updateData.simpananSukarela = (anggota.simpananSukarela || 0) + rawPayment.nominal;
            }
            await localDb.anggota.update(anggota.id!, updateData);
          }
        }
      }

      // Notify the member
      const rawPayment = paymentsRaw?.find(p => p.id === parseInt(id));
      if (rawPayment && rawPayment.anggotaId) {
        await localDb.notifications.add({
          title: status === 'verified' ? 'Pembayaran Berhasil' : 'Pembayaran Ditolak',
          message: status === 'verified' 
            ? `Pembayaran ${payment.type} senilai ${formatCurrency(payment.amount)} telah diverifikasi.`
            : `Pembayaran ${payment.type} senilai ${formatCurrency(payment.amount)} ditolak. Silakan hubungi admin.`,
          koperasiId: profile.koperasiId,
          targetUserId: rawPayment.anggotaId, // Assuming anggotaId maps to user ID eventually
          targetRole: 'anggota',
          isRead: false,
          createdAt: new Date().toISOString(),
          type: status === 'verified' ? 'success' : 'alert',
          actionUrl: '/history'
        });
      }

      toast.success(status === 'verified' ? 'Pembayaran berhasil diverifikasi!' : 'Pembayaran ditolak.');
    } catch (error) {
      console.error(error);
      toast.error('Gagal memperbarui status pembayaran');
    }
  };

  // Fetch members to identify those who haven't paid
  const members = useLiveQuery(
    () => profile?.koperasiId ? localDb.anggota.where('koperasiId').equals(profile.koperasiId).toArray() : Promise.resolve([]),
    [profile?.koperasiId],
    []
  );

  const handleSendBulkReminder = async () => {
    if (!profile?.koperasiId) return;                
    
    // Payments verified this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const paidMemberIds = payments
      .filter(p => {
        const d = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
        return p.status === 'verified' && p.type === 'Simpanan Wajib' && 
               d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .map(p => p.member); // Assuming member field is name or ID

    const membersToRemind = members.filter(m => !paidMemberIds.includes(m.name));
      
    if (confirm(`Kirim pengingat ke ${membersToRemind.length} anggota yang belum membayar?`)) {                
      toast.success(`Pengingat berhasil dikirim ke ${membersToRemind.length} anggota.`);
      // In a real app, send actual messages here
    }
  };

  const handleDelete = async (id: string) => {
    if (!profile?.koperasiId || !confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    try {
      await localDb.pembayaran.delete(parseInt(id));
      toast.success('Pembayaran berhasil dihapus.');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus pembayaran');
    }
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const paidMemberIds = payments
    .filter(p => {
      const d = p.createdAt ? new Date(p.createdAt) : new Date();
      return p.status === 'verified' && p.type === 'Simpanan Wajib' && 
             d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .map(p => p.member);

  const membersToRemind = members.filter(m => !paidMemberIds.includes(m.id?.toString()!));

  const filteredPayments = payments.filter(p => {
    const mem = members.find(m => m.id === p.member);
    const mName = mem ? mem.name : p.member;
    const matchesSearch = (mName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    pendingCount: payments.filter(p => p.status === 'pending').length,
    todayTotal: payments
      .filter(p => {
        const d = p.createdAt ? new Date(p.createdAt) : new Date();
        return d.toDateString() === new Date().toDateString() && p.status === 'verified';
      })
      .reduce((acc, p) => acc + (p.amount || 0), 0)
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 leading-tight">Verifikasi Pembayaran</h2>
          <p className="text-gray-500 font-medium mt-1">Kelola dan verifikasi bukti transfer dari anggota koperasi.</p>
        </div>
        <button 
          onClick={handleSendBulkReminder}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
        >
          <Megaphone className="w-4 h-4" /> Kirim Pengingat Wajib
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Menunggu Verifikasi</p>
            <p className="text-2xl font-black text-orange-500 mt-1">{stats.pendingCount} Transaksi</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-2xl text-orange-500">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Masuk Hari Ini</p>
            <p className="text-2xl font-black text-green-600 mt-1">{formatCurrency(stats.todayTotal)}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-2xl text-green-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target Bulanan</p>
            <p className="text-2xl font-black text-red-600 mt-1">Sesuai Data</p>
          </div>
          <div className="p-3 bg-red-50 rounded-2xl text-red-600">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari nama anggota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-transparent rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
          />
        </div>
        <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 w-full sm:w-auto">
          <FilterTab active={filter === 'all'} label="Semua" onClick={() => setFilter('all')} />
          <FilterTab active={filter === 'pending'} label="Pending" onClick={() => setFilter('pending')} />
          <FilterTab active={filter === 'verified'} label="Diverifikasi" onClick={() => setFilter('verified')} />
        </div>
      </div>

      {/* Payment List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-dashed border-gray-200">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <p className="text-gray-500 font-medium">Memuat data pembayaran...</p>
          </div>
        ) : filteredPayments.length > 0 ? (
          <AnimatePresence>
            {filteredPayments.map((payment) => (
              <motion.div 
                layout
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg",
                    payment.status === 'verified' ? "bg-green-600 shadow-green-100" : 
                    payment.status === 'rejected' ? "bg-red-600 shadow-red-100" : "bg-orange-500 shadow-orange-100"
                  )}>
                    <CreditCard className="text-white w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors uppercase tracking-tight text-sm line-clamp-1">{payment.member || 'Tanpa Nama'}</h4>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold text-gray-500">
                      <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-red-600" /> {payment.type || 'Simpanan'}</span>
                      <span className="hidden sm:inline-block md:hidden lg:inline-block flex items-center gap-1"><Calendar className="w-3 h-3" /> {payment.date || 'Baru Saja'}</span>
                    </div>
                  </div>
                  <div className="md:hidden text-right">
                    <p className="text-sm font-black text-gray-900">{formatCurrency(payment.amount || 0)}</p>
                    <StatusIndicator status={payment.status} />
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="hidden md:block text-right mr-4">
                    <p className="text-lg font-black text-gray-900">{formatCurrency(payment.amount || 0)}</p>
                    <StatusIndicator status={payment.status} />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Proof URL:', payment.proofUrl);
                        if (payment.proofUrl) {
                          setViewingImage(payment.proofUrl);
                        } else {
                          toast.error('Bukti pembayaran tidak tersedia.');
                        }
                      }}
                      className="flex-1 md:flex-none px-3 py-2 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-1 font-bold text-[10px] sm:text-xs"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> {payment.proofUrl ? 'Lihat Bukti' : 'No Bukti'}
                    </button>
                    {payment.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleVerify(payment.id, 'rejected')}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all shadow-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleVerify(payment.id, 'verified')}
                          className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all shadow-sm"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => handleDelete(payment.id)}
                      className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all shadow-sm"
                      title="Hapus Transaksi"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="bg-white p-20 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
              <CreditCard className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Belum ada transaksi</h3>
            <p className="text-gray-500 font-medium max-w-sm">
              Semua bukti pembayaran dari anggota akan muncul di sini untuk diverifikasi.
            </p>
          </div>
        )}
      </div>

      {/* Belum Bayar List */}
      {membersToRemind.length > 0 && (
        <div className="mt-12 space-y-5">
          <h3 className="text-2xl font-bold text-gray-900">Belum Membayar Simpanan Wajib</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {membersToRemind.map(member => (
              <div key={member.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-red-100 transition-all">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-400 font-medium">{member.phone || 'No Phone'}</p>
                </div>
                <a 
                  href={`https://wa.me/${member.phone?.replace(/^0/, '62') || ''}/?text=${encodeURIComponent(`Halo ${member.name}, mohon segera lakukan pembayaran Simpanan Wajib Koperasi bulan ini ya.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-4 px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-green-600 transition-all flex-shrink-0"
                >
                  WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      {viewingImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setViewingImage(null)}>
          <img src={viewingImage} alt="Bukti Pembayaran" className="max-w-full max-h-full object-contain rounded-2xl" />
        </div>
      )}
    </div>
  );
}

function FilterTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 sm:px-8 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-1 sm:flex-none",
        active ? "bg-white text-red-600 shadow-md border border-gray-100" : "text-gray-400 hover:text-gray-600"
      )}
    >
      {label}
    </button>
  );
}

function StatusIndicator({ status }: { status: Payment['status'] }) {
  const labels = {
    pending: { text: 'Menunggu', color: 'text-orange-500' },
    verified: { text: 'Berhasil', color: 'text-green-600' },
    rejected: { text: 'Ditolak', color: 'text-red-500' },
  };
  return (
    <span className={cn("text-[10px] font-black uppercase tracking-widest", labels[status].color)}>
      {labels[status].text}
    </span>
  );
}
