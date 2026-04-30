import React from 'react';
import { motion } from 'motion/react';
import { 
  Wallet, 
  CreditCard, 
  History, 
  Bell, 
  User, 
  LogOut, 
  Shield, 
  QrCode,
  ArrowRight,
  ChevronRight,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, cn } from '../lib/utils';
import localDb from '../lib/localDb';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

interface Payment {
  id: string;
  memberId: string;
  type: string;
  amount: number;
  date: string;
  status: 'pending' | 'verified' | 'rejected';
  method: string;
  createdAt: any;
}

import Messaging from './dashboard/Messaging';

import QRCode from 'react-qr-code';

export default function MemberDashboard() {
  const navigate = useNavigate();
  const { profile, koperasi, logout } = useAuth();
  const [activeView, setActiveView] = React.useState<'dashboard' | 'support' | 'qr' | 'history' | 'reminders' | 'profile'>('dashboard');
  
  const paymentsRaw = useLiveQuery(
    () => profile?.uid ? localDb.pembayaran.where('anggotaId').equals(profile.uid).reverse().sortBy('createdAt') : Promise.resolve([]),
    [profile?.uid],
    []
  );

  const payments = (paymentsRaw || []).map(p => ({
    id: p.id!.toString(),
    memberId: p.anggotaId,
    type: p.jenisSimpanan || 'Lainnya',
    amount: p.nominal,
    date: p.tanggalBayar || new Date(p.createdAt || Date.now()).toLocaleDateString('id-ID'),
    status: p.status,
    method: 'Transfer', 
    createdAt: p.createdAt || new Date().toISOString()
  })) as Payment[];

  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [proofImage, setProofImage] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [confirmData, setConfirmData] = React.useState({
    type: 'Simpanan Pokok',
    amount: '',
    method: 'Transfer Bank',
    date: new Date().toISOString().split('T')[0]
  });

  const [addressDetail, setAddressDetail] = React.useState('');
  const [isUpdatingAddress, setIsUpdatingAddress] = React.useState(false);
  const [nik, setNik] = React.useState('');
  const [isUpdatingNik, setIsUpdatingNik] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const memberData = useLiveQuery(
    () => profile?.uid ? localDb.anggota.get(profile.uid) : Promise.resolve(null),
    [profile?.uid]
  );
  
  React.useEffect(() => {
    if (profile?.nik) setNik(profile.nik);
    if (memberData?.alamat) setAddressDetail(memberData.alamat);
  }, [profile, memberData]);

  const handleUpdateNik = async () => {
    if (!profile?.uid || !profile?.koperasiId) return;
    if (!nik.trim() || nik.length < 16) {
      toast.error("NIK harus 16 digit");
      return;
    }
    setIsUpdatingNik(true);
    try {
      await localDb.users.update(profile.uid, { nik });
      await localDb.anggota.update(profile.uid, { nik });
      toast.success("NIK berhasil diperbarui");
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui NIK");
    } finally {
      setIsUpdatingNik(false);
    }
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.uid) return;

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 200,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      const photoURL = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });
      
      await localDb.users.update(profile.uid, { photoURL: photoURL as string });
      await localDb.anggota.update(profile.uid, { photoURL: photoURL as string } as any);
      
      toast.success("Foto profil berhasil diperbarui");
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui foto profil");
    }
  };

  const isNikMissing = !profile?.nik || profile.nik === '-';

  const handleUpdateAddress = async () => {
    if (!profile?.koperasiId || !profile?.uid) return;
    if (!addressDetail.trim()) {
      toast.error("Alamat Jalan dan gang RT/RW tidak boleh kosong");
      return;
    }
    
    setIsUpdatingAddress(true);
    try {
      await localDb.anggota.update(profile.uid, { alamat: addressDetail });
      toast.success("Alamat berhasil diperbarui");
      setTimeout(() => {
        setActiveView('dashboard');
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui alamat");
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.koperasiId || !profile?.uid) return;
    
    // basic validation
    if (!confirmData.amount) {
      alert("Jumlah pembayaran harus diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Starting submission', { confirmData, hasImage: !!proofImage });
      let proofUrl = '';
      if (proofImage) {
        console.log('Reading image as base64...');
        proofUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(proofImage);
        });
        console.log('Image read as base64');
      }
      
      const paymentData = {
        anggotaId: profile.uid,
        koperasiId: profile.koperasiId,
        jenisSimpanan: confirmData.type,
        nominal: parseFloat(confirmData.amount),
        tanggalBayar: confirmData.date,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        buktiPembayaran: proofUrl // This is now a base64 string
      };
      
      await localDb.pembayaran.add(paymentData);
      
      // Create notification for Admins
      await localDb.notifications.add({
        title: 'Pembayaran Baru',
        message: `${profile.displayName || 'Seorang anggota'} telah mengirim bukti pembayaran ${confirmData.type} senilai ${formatCurrency(parseFloat(confirmData.amount))}`,
        type: 'info',
        koperasiId: profile.koperasiId,
        targetRole: 'admin_koperasi',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/payments'
      });
      
      setShowConfirmModal(false);
      setActiveView('history');
      setProofImage(null);
      toast.success("Konfirmasi pembayaran berhasil dikirim.");
    } catch (err) {
      console.error('Submission error:', err);
      toast.error("Gagal mengirim konfirmasi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived state
  const isSimpananPokokPaid = payments.some(p => p.type === 'Simpanan Pokok' && (p.status === 'verified' || p.status === 'pending'));
  const simpananPokokPending = payments.some(p => p.type === 'Simpanan Pokok' && p.status === 'pending');
  
  const currentMonthDate = new Date();
  const currentMonthKey = `${currentMonthDate.getFullYear()}-${currentMonthDate.getMonth() + 1}`;
  const isSimpananWajibPaidThisMonth = payments.some(p => {
    if (p.type !== 'Simpanan Wajib' || p.status === 'rejected') return false;
    const d = p.createdAt ? new Date(p.createdAt) : new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}` === currentMonthKey;
  });
  
  const todayDate = currentMonthDate.getDate();
  const isWajibLate = todayDate > 20 && !isSimpananWajibPaidThisMonth;

  const totalSimpananPokok = payments.filter(p => p.type === 'Simpanan Pokok' && p.status === 'verified').reduce((a, b) => a + b.amount, 0);
  const totalSimpananWajib = payments.filter(p => p.type === 'Simpanan Wajib' && p.status === 'verified').reduce((a, b) => a + b.amount, 0);

  const pendingReminders = [];
  if (!isSimpananPokokPaid) {
    pendingReminders.push({
      id: 'pokok',
      title: 'Tagihan Simpanan Pokok',
      description: `Sebagai anggota baru, Anda diwajibkan membayar Simpanan Pokok sebesar ${formatCurrency(koperasi?.simpananPokok || 100000)} (Satu kali pembayaran).`,
      urgent: true,
    });
  } else if (!isSimpananWajibPaidThisMonth) {
    pendingReminders.push({
      id: 'wajib',
      title: `Tagihan Simpanan Wajib - Bulan Ini`,
      description: `Waktu pembayaran simpanan wajib bulan ini sebesar ${formatCurrency(koperasi?.simpananWajib || 50000)}, paling lambat tanggal 20. ${isWajibLate ? 'Segera lakukan pembayaran untuk menghindari denda.' : ''}`,
      urgent: isWajibLate,
    });
  }

  if (profile?.status === 'inactive') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-white">
          <Shield className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Menunggu Verifikasi</h1>
        <p className="text-gray-500 mb-2 max-w-sm">
          Akun Anda sedang dalam proses verifikasi oleh Admin Koperasi.
        </p>
        {(profile?.koperasiName || koperasi?.name) && (
          <p className="text-red-600 font-bold mb-8 px-4 py-2 bg-red-50 rounded-xl border border-red-100">
             {profile?.koperasiName || koperasi?.name}
          </p>
        )}
        <p className="text-gray-400 text-xs mb-8 max-w-xs">
          Anda akan dapat menggunakan semua fitur setelah pendaftaran Anda disetujui.
        </p>
        <button 
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all"
        >
          <LogOut className="w-5 h-5" /> Keluar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {activeView === 'support' && (
        <div className="p-4 h-screen flex flex-col pt-12">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold flex items-center gap-2">
               <MessageSquare className="text-red-600" /> Bantuan Admin
             </h2>
             <button onClick={() => setActiveView('dashboard')} className="text-red-600 font-bold p-2">Tutup</button>
          </div>
          <div className="flex-1 overflow-hidden rounded-[2rem] border border-gray-100 shadow-xl">
             <Messaging />
          </div>
        </div>
      )}

      {activeView === 'qr' && (
        <div className="p-4 min-h-screen flex flex-col pt-12 items-center text-center">
          <div className="w-full flex justify-between items-center mb-12">
            <h2 className="text-xl font-bold flex items-center gap-2">
               <QrCode className="text-red-600" /> Pembayaran QR
            </h2>
            <button onClick={() => setActiveView('dashboard')} className="text-red-600 font-bold p-2">Tutup</button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
            {koperasi?.payment?.merchantCode ? (
              <div className="w-full bg-white rounded-[3rem] p-8 shadow-2xl mb-8 flex flex-col items-center justify-center border border-gray-100">
                <div className="bg-white p-2 rounded-2xl">
                  <QRCode value={koperasi.payment.merchantCode} size={220} className="w-full h-auto max-w-[220px]" />
                </div>
                <p className="mt-6 text-sm font-bold text-gray-900 tracking-wider uppercase text-center w-full px-2">
                   {koperasi.name || 'Koperasi'}
                </p>
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-50 rounded-[3rem] p-8 relative overflow-hidden shadow-2xl mb-8 flex flex-col items-center justify-center border border-gray-100">
                <QrCode className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold max-w-[200px]">Koperasi belum mengatur merchant code QRIS.</p>
              </div>
            )}
            <h3 className="text-2xl font-black text-gray-900 mb-2">Scan QR</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-6">Scan QR di atas menggunakan aplikasi M-Banking atau e-Wallet favorit Anda.</p>
            
            {(koperasi?.payment?.bankName || koperasi?.payment?.rekeningNumber) && (
              <div className="w-full bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg text-left">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Transfer Bank</p>
                <p className="font-bold text-gray-900 text-lg mb-1">{koperasi.payment.bankName}</p>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="font-mono text-gray-900 font-bold tracking-widest">{koperasi.payment.rekeningNumber}</p>
                  <button onClick={() => {
                    navigator.clipboard.writeText(koperasi.payment.rekeningNumber || '');
                    alert('Nomor rekening disalin!');
                  }} className="text-xs font-bold text-red-600">Salin</button>
                </div>
                {koperasi.payment.rekeningName && (
                  <p className="text-xs text-gray-500 mt-2">A/N: {koperasi.payment.rekeningName}</p>
                )}
              </div>
            )}

            <button 
              onClick={() => setShowConfirmModal(true)}
              className="mt-8 w-full block text-center px-6 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition"
            >
              Konfirmasi Pembayaran Selesai
            </button>
          </div>
        </div>
      )}

      {activeView === 'history' && (
        <div className="p-4 min-h-screen flex flex-col pt-12">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-xl font-bold flex items-center gap-2">
               <History className="text-red-600" /> Riwayat Transaksi
             </h2>
             <button onClick={() => setActiveView('dashboard')} className="text-red-600 font-bold p-2">Tutup</button>
          </div>
          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl flex-1">
             {payments.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-center">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <History className="w-10 h-10 text-gray-300" />
                 </div>
                 <p className="text-lg font-bold text-gray-900 mb-2">Belum Ada Transaksi</p>
                 <p className="text-sm text-gray-500 max-w-xs mx-auto">Transaksi simpanan Anda akan muncul di sini.</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {payments.map(p => (
                   <TransactionItem 
                     key={p.id}
                     title={p.type} 
                     date={p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('id-ID') : p.date} 
                     amount={formatCurrency(p.amount)} 
                     status={p.status as 'pending'|'verified'|'rejected'} 
                   />
                 ))}
               </div>
             )}
          </div>
        </div>
      )}

      {activeView === 'reminders' && (
        <div className="p-4 min-h-screen flex flex-col pt-12">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-xl font-bold flex items-center gap-2">
               <Bell className="text-red-600" /> Pengingat
             </h2>
             <button onClick={() => setActiveView('dashboard')} className="text-red-600 font-bold p-2">Tutup</button>
          </div>
          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl flex-1">
             {pendingReminders.length > 0 ? (
                <div className="space-y-4">
                  {pendingReminders.map(reminder => (
                    <div key={reminder.id} className={`p-5 rounded-2xl border ${reminder.urgent ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                      <div className="flex items-start gap-3">
                         <AlertCircle className={`w-6 h-6 shrink-0 mt-0.5 ${reminder.urgent ? 'text-red-600' : 'text-orange-500'}`} />
                         <div>
                            <h3 className={`font-bold mb-1 ${reminder.urgent ? 'text-red-900' : 'text-orange-900'}`}>{reminder.title}</h3>
                            <p className={`text-sm ${reminder.urgent ? 'text-red-700' : 'text-orange-700'}`}>{reminder.description}</p>
                            <button 
                              onClick={() => setActiveView('qr')}
                              className={`mt-4 px-4 py-2 text-sm font-bold rounded-xl text-white shadow-md ${reminder.urgent ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}
                            >
                              Bayar Sekarang
                            </button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Bell className="w-10 h-10 text-gray-300" />
                   </div>
                   <p className="text-lg font-bold text-gray-900 mb-2">Tidak Ada Pengingat Baru</p>
                   <p className="text-sm text-gray-500 max-w-xs mx-auto">Anda tidak memiliki tagihan atau pemberitahuan penting saat ini.</p>
                </div>
             )}
          </div>
        </div>
      )}

      {activeView === 'profile' && (
        <div className="p-4 min-h-screen flex flex-col pt-12">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-xl font-bold flex items-center gap-2">
               <User className="text-red-600" /> Profil Anggota
             </h2>
             <button onClick={() => setActiveView('dashboard')} className="text-red-600 font-bold p-2">Tutup</button>
          </div>
           <div className="flex-1 space-y-4">
             <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-gray-200 shadow-xl text-center">
               <div 
                 className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden cursor-pointer relative" 
                 onClick={() => fileInputRef.current?.click()}
               >
                 {profile?.photoURL ? (
                   <img src={profile.photoURL} alt="Profil" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-2xl font-black text-red-600">{profile?.displayName?.charAt(0) || 'U'}</span>
                 )}
                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold">Ganti</span>
                 </div>
               </div>
               <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
               <h3 className="text-xl font-black text-gray-900">{profile?.displayName || 'Anggota'}</h3>
               <p className="text-gray-500 font-bold text-sm mb-4">{profile?.email}</p>
               <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 text-xs font-black uppercase tracking-widest rounded-full">Anggota Aktif</span>
             </div>
             
             <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg space-y-4">
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nomor Anggota</p>
                  <p className="font-bold text-gray-900">A-{profile?.uid?.substring(0, 8).toUpperCase()}</p>
               </div>
               <hr className="border-gray-50" />
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">NIK (KTP)</p>
                  <div className="flex flex-wrap gap-2">
                    <input 
                      type="text"
                      className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-red-600"
                      value={nik}
                      onChange={e => setNik(e.target.value.replace(/\D/g, ''))}
                      maxLength={16}
                    />
                    <button 
                      onClick={handleUpdateNik}
                      disabled={isUpdatingNik || nik === profile?.nik || nik.length < 16}
                      className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl disabled:opacity-50"
                    >
                      {isUpdatingNik ? '...' : 'Update'}
                    </button>
                  </div>
               </div>
               <hr className="border-gray-50" />
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Terdaftar Sejak</p>
                  <p className="font-bold text-gray-900">April 2026</p>
               </div>
             </div>

             <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg space-y-4">
               <div>
                 <div className="flex items-center gap-2 mb-2">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alamat Lengkap</p>
                   {!memberData?.alamat && (
                     <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] rounded-full font-bold animate-pulse">Perlu Dilengkapi</span>
                   )}
                 </div>
                 <p className="text-sm text-gray-500 mb-4">
                   Provinsi, Kabupaten/Kota, Kecamatan, dan Desa/Kelurahan Anda sudah tersimpan dari pendaftaran. Silakan tambahkan nama jalan, gang, RT/RW, dan nomor rumah.
                 </p>
                 <textarea 
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all resize-none h-24 font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                   placeholder="Cth: Jl. Pattimura Gg. Durian No.7 RT 02 / RW 04"
                   value={addressDetail}
                   onChange={e => setAddressDetail(e.target.value)}
                 ></textarea>
               </div>
               <button 
                 onClick={handleUpdateAddress}
                 disabled={isUpdatingAddress || addressDetail === memberData?.alamat}
                 className="w-full py-3 bg-red-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors shadow-md"
               >
                 {isUpdatingAddress ? 'Menyimpan...' : (addressDetail === memberData?.alamat ? 'Tersimpan' : 'Simpan Alamat')}
               </button>
             </div>
             
             <button 
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="w-full mt-8 flex justify-center items-center gap-2 py-4 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Keluar dari Akun
              </button>
          </div>
        </div>
      )}

      {activeView === 'dashboard' && (
        <>
          {/* Mobile Top Header */}
          <header className="bg-red-600 px-6 py-10 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <img src="https://cdn.phototourl.com/free/2026-04-28-a960d9af-d6d2-4c3f-9806-8bcc668e885f.png" alt="Logo" className="w-12 h-12" />
            <div className="flex flex-col">
              <span className="font-black text-xl text-white leading-none uppercase">KDKMP</span>
              <span className="text-[10px] font-bold text-red-100 tracking-widest uppercase">Digital</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveView('reminders')}
              className="p-3 bg-white/20 text-white rounded-2xl backdrop-blur-md relative"
            >
              <Bell className="w-5 h-5" />
              {pendingReminders.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-red-600 animate-pulse"></span>
              )}
            </button>
            <button 
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="p-3 bg-white/20 text-white rounded-2xl backdrop-blur-md hover:bg-white hover:text-red-600 transition-all focus:outline-none"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center font-bold text-red-600 text-xl border-4 border-red-400">
              {profile?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg leading-tight">{profile?.displayName || 'Anggota'}</h2>
              <p className="text-red-100 text-sm font-medium opacity-80">NIK: {profile?.nik || '-'}</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-green-400 text-white text-[10px] font-black uppercase rounded-full shadow-lg shadow-green-900/20">Aktif</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 -mt-6 relative z-20 space-y-6">
        {/* Mandatory NIK Modal */}
        {isNikMissing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-8 shadow-2xl relative w-full max-w-md text-center border-4 border-red-500"
            >
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Lengkapi NIK Anda</h3>
              <p className="text-gray-500 mb-8 font-medium">
                Sesuai peraturan koperasi, Anda wajib mengisi Nomor Induk Kependudukan (NIK) sebelum dapat menggunakan fitur aplikasi ini.
              </p>
              
              <div className="text-left mb-6">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">NIK (KTP) 16 Digit</label>
                <input 
                  type="text" 
                  maxLength={16}
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 3316..."
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-6 text-xl font-bold tracking-widest focus:border-red-500 focus:bg-white transition-all outline-none"
                />
              </div>

              <button 
                onClick={handleUpdateNik}
                disabled={isUpdatingNik || nik.length < 16}
                className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition shadow-xl shadow-red-200 disabled:opacity-50"
              >
                {isUpdatingNik ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
              </button>

              <button 
                onClick={() => logout()}
                className="mt-4 text-gray-400 font-bold text-sm hover:text-red-500 transition-colors"
              >
                Keluar / Logout
              </button>
            </motion.div>
          </div>
        )}

        {/* Alerts */}
        {activeView === 'dashboard' && !memberData?.alamat && (
          <div className="p-4 rounded-2xl border flex items-start gap-3 shadow-lg bg-red-50 border-red-200 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => setActiveView('profile')}>
            <AlertCircle className="w-6 h-6 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-red-900">Perhatian: Lengkapi Alamat Anda</h4>
              <p className="text-xs mt-0.5 text-red-700">Agar mempermudah pendataan administratif, silakan lengkapi informasi nama Jalan, Gang, serta RT/RW di Profil Anda.</p>
            </div>
            <button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-100 text-red-700">Isi Sekarang</button>
          </div>
        )}

        {activeView === 'dashboard' && pendingReminders.length > 0 && (
          <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-lg ${pendingReminders[0].urgent ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
            <AlertCircle className={`w-6 h-6 shrink-0 ${pendingReminders[0].urgent ? 'text-red-500' : 'text-orange-500'}`} />
            <div className="flex-1">
              <h4 className={`font-bold text-sm ${pendingReminders[0].urgent ? 'text-red-900' : 'text-orange-900'}`}>{pendingReminders[0].title}</h4>
              <p className={`text-xs mt-0.5 line-clamp-1 ${pendingReminders[0].urgent ? 'text-red-700' : 'text-orange-700'}`}>{pendingReminders[0].description}</p>
            </div>
            <button onClick={() => setActiveView('reminders')} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${pendingReminders[0].urgent ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>Lihat</button>
          </div>
        )}

        {/* Balance Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-200 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-gray-400">
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Total Simpanan Saya</span>
            </div>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter underline">Lihat Detail</span>
          </div>
          <h3 className="text-4xl font-black text-gray-900 leading-none">{formatCurrency(totalSimpananPokok + totalSimpananWajib)}</h3>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Simpanan Pokok</p>
              <p className="font-bold text-gray-900">{formatCurrency(totalSimpananPokok)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Simpanan Wajib</p>
              <p className="font-bold text-gray-900">{formatCurrency(totalSimpananWajib)}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <section>
          <h4 className="text-lg font-bold text-gray-900 mb-4 px-2">Layanan Koperasi</h4>
          <div className="grid grid-cols-4 gap-4">
            <IconButton icon={<CreditCard className="w-5 h-5" />} label="QR Bayar" onClick={() => setActiveView('qr')} />
            <IconButton icon={<History className="w-5 h-5" />} label="Riwayat" onClick={() => setActiveView('history')} />
            <IconButton icon={<Bell className="w-5 h-5" />} label="Pengingat" onClick={() => setActiveView('reminders')} />
            <IconButton icon={<User className="w-5 h-5" />} label="Profil" onClick={() => setActiveView('profile')} />
          </div>
        </section>

        {/* Recent Transactions */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h4 className="text-lg font-bold text-gray-900">Riwayat Terakhir</h4>
            <button onClick={() => setActiveView('history')} className="text-xs font-bold text-red-600 uppercase">Lihat Semua</button>
          </div>
          {payments.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">Belum Ada Riwayat</p>
              <p className="text-xs text-gray-500">Transaksi simpanan Anda akan muncul di sini</p>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-2 border border-gray-100 shadow-sm">
              {payments.slice(0, 3).map(p => (
                 <TransactionItem 
                   key={p.id}
                   title={p.type} 
                   date={p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('id-ID') : p.date} 
                   amount={formatCurrency(p.amount)} 
                   status={p.status as 'pending'|'verified'|'rejected'} 
                 />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-6 left-6 right-6 bg-gray-900/90 backdrop-blur-xl h-20 rounded-[2.5rem] flex items-center justify-around px-8 shadow-2xl border border-white/10 z-50">
        <NavItem icon={<Shield className="w-6 h-6" />} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
        <NavItem icon={<MessageSquare className="w-6 h-6" />} onClick={() => setActiveView('support')} active={activeView === 'support'} />
        <div className="w-16 h-16 bg-red-600 -mt-12 rounded-full flex items-center justify-center shadow-2xl shadow-red-500 border-4 border-gray-900">
           <QrCode className="w-8 h-8 text-white" />
        </div>
        <NavItem icon={<Bell className="w-6 h-6" />} active={activeView === 'reminders'} onClick={() => setActiveView('reminders')} />
        <button onClick={logout}>
          <LogOut className="w-6 h-6 text-gray-400" />
        </button>
      </nav>
      </>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setShowConfirmModal(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-[2rem] shadow-2xl relative w-full max-w-sm"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Konfirmasi Pembayaran</h3>
            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Jenis Simpanan</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  value={confirmData.type}
                  onChange={(e) => setConfirmData({...confirmData, type: e.target.value})}
                >
                  <option value="Simpanan Pokok">Simpanan Pokok</option>
                  <option value="Simpanan Wajib">Simpanan Wajib</option>
                  <option value="Simpanan Sukarela">Simpanan Sukarela</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Jumlah Transfer</label>
                <input 
                  type="number"
                  required
                  placeholder="Contoh: 100000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  value={confirmData.amount}
                  onChange={(e) => setConfirmData({...confirmData, amount: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Metode</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  value={confirmData.method}
                  onChange={(e) => setConfirmData({...confirmData, method: e.target.value})}
                >
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="QRIS">QRIS</option>
                  <option value="E-Wallet">E-Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Bukti Pembayaran (Foto)</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}

function IconButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={onClick}>
      <button className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-600 shadow-xl shadow-gray-200 border border-gray-50 group-hover:text-red-600 group-hover:bg-red-50 transition-all pointer-events-none">
        {icon}
      </button>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight group-hover:text-red-600 transition-colors">{label}</span>
    </div>
  );
}

function NavItem({ icon, active = false, onClick }: { icon: React.ReactNode, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
      "p-3 transition-colors",
      active ? "text-red-500" : "text-gray-400"
    )}>
      {icon}
    </button>
  );
}

function TransactionItem({ title, date, amount, status }: { key?: React.Key, title: string, date: string, amount: string, status: 'verified' | 'pending' | 'rejected' }) {
  return (
    <div className="flex items-center justify-between p-5 hover:bg-gray-50 rounded-[1.5rem] transition-all group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          status === 'verified' ? "bg-green-50 text-green-600" : status === 'rejected' ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"
        )}>
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-none mb-1">{title}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn(
          "text-sm font-black group-hover:scale-110 transition-transform",
          status === 'verified' ? "text-green-600" : status === 'rejected' ? "text-red-500" : "text-orange-500"
        )}>{amount}</p>
        <span className={cn(
          "text-[9px] font-black uppercase tracking-tighter",
          status === 'verified' ? "text-green-400" : status === 'rejected' ? "text-red-400" : "text-orange-400"
        )}>{status}</span>
      </div>
    </div>
  );
}
