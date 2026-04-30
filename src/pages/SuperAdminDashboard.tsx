import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  MapPin, 
  Building2, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  ArrowUpRight,
  TrendingUp,
  Mail,
  MoreVertical,
  Search,
  Filter,
  Check,
  X,
  LogOut,
  Menu,
  Bell,
  Phone,
  MessageCircle,
  FileDown
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import localDb from '../lib/localDb';
import { useLiveQuery } from 'dexie-react-hooks';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('stats');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const regsQuery = useLiveQuery(
    () => localDb.registrations.toArray()
  );
  
  const registrations = (regsQuery || []).filter(r => r.role !== 'anggota').sort((a,b) => {
    const d1 = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const d2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return d2 - d1;
  });

  const loading = regsQuery === undefined;

  const handleApprove = async (regId: string | number) => {
    try {
      const parsedId = typeof regId === 'string' ? parseInt(regId) : regId;
      const reg = registrations.find(r => r.id === parsedId);
      if (!reg) return;

      const koperasiId = `kop_${reg.desa || 'id'}_${Date.now()}`;

      // 1. Create Koperasi Document
      await localDb.koperasi.add({
        id: koperasiId,
        nama: reg.namaKoperasi || '', // 'nama' is in Koperasi interface
        kabupaten: reg.kabupaten || '',
        kecamatan: reg.kecamatan || '',
        desa: reg.desa || '',
        provinsi: reg.provinsi || '',
        status: 'active',
        alamat: reg.alamat,
        rekening: reg.rekening,
        nomorBadanHukum: reg.badanHukum,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 2. Update Registration Status
      await localDb.registrations.update(parsedId, { 
        status: 'approved',
        targetKoperasiId: koperasiId
      });

      // 3. Activate User Profile if UID exists
      if (reg.uid) {
        await localDb.users.update(reg.uid, {
          status: 'active',
          role: reg.role || 'admin_koperasi',
          koperasiId: koperasiId
        });
      }

      toast.success('Pendaftaran disetujui & Akun diaktifkan');
      
      // WhatsApp message option
      const userPhone = reg.hp;
      if (userPhone) {
        const message = `Halo ${reg.ketua || reg.nama}, pendaftaran koperasi ${reg.namaKoperasi} di KDKMP Digital telah DISETUJUI. Akun Anda sudah terverifikasi, silakan login menggunakan email yang terdaftar. Terima kasih.`;
        const waUrl = `https://wa.me/${userPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
      }
    } catch (error) {
      console.error("Approval error:", error);
    }
  };

  const handleReject = async (regId: string | number) => {
    if (!window.confirm('Yakin ingin menolak pendaftaran ini?')) return;
    try {
      const parsedId = typeof regId === 'string' ? parseInt(regId) : regId;
      await localDb.registrations.delete(parsedId);
      toast.success('Pendaftaran ditolak & dihapus');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus pendaftaran');
    }
  };

  const pendingRegs = registrations.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Super Admin Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 text-white flex flex-col p-6 transition-transform duration-300 transform md:relative md:translate-x-0 md:z-auto",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <img src="https://cdn.phototourl.com/free/2026-04-28-a960d9af-d6d2-4c3f-9806-8bcc668e885f.png" alt="Logo" className="w-10 h-10" />
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight leading-none uppercase">KDKMP</span>
              <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase">Digital</span>
            </div>
          </div>
          <button className="md:hidden text-white/50 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <SideItem 
            icon={<BarChart3 />} 
            label="National Stats" 
            active={activeView === 'stats'} 
            onClick={() => { setActiveView('stats'); setIsSidebarOpen(false); }} 
          />
          <SideItem 
            icon={<Building2 />} 
            label="Koperasi List" 
            active={activeView === 'list'} 
            onClick={() => { setActiveView('list'); setIsSidebarOpen(false); }} 
          />
          <SideItem 
            icon={<Clock />} 
            label="Pending Approval" 
            badge={pendingRegs.length.toString()} 
            active={activeView === 'approval'} 
            onClick={() => { setActiveView('approval'); setIsSidebarOpen(false); }} 
          />
          <SideItem 
            icon={<MapPin />} 
            label="Region Manager" 
            active={activeView === 'region'} 
            onClick={() => { setActiveView('region'); setIsSidebarOpen(false); }} 
          />
        </nav>

        <div className="pt-6 border-t border-white/10">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Account</p>
          <div className="flex items-center justify-between p-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">S</div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">Super Admin</p>
                <p className="text-[10px] text-white/40 uppercase font-black">Owner</p>
              </div>
            </div>
            <button 
              onClick={() => {
                auth.signOut();
                navigate('/login');
              }}
              className="p-2 text-white/20 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg leading-none uppercase">KDKMP</span>
              <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase">Digital</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-xl">
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                auth.signOut();
                navigate('/login');
              }}
              className="p-2 text-red-500 hover:text-red-700 bg-red-50 rounded-xl"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-12 space-y-8 md:space-y-12 overflow-y-auto overflow-x-hidden pb-32 md:pb-12">
          <AnimatePresence mode="wait">
            {activeView === 'stats' && <StatsView key="stats" onSeeAll={() => setActiveView('approval')} registrations={registrations} onApprove={handleApprove} onReject={handleReject} />}
            {activeView === 'list' && <KoperasiListView key="list" registrations={registrations} />}
            {activeView === 'approval' && <ApprovalView key="approval" registrations={registrations} onApprove={handleApprove} onReject={handleReject} />}
            {activeView === 'region' && <RegionManagerView key="region" registrations={registrations} />}
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-2 z-40 pb-safe">
          <button 
            onClick={() => setActiveView('stats')} 
            className={cn("flex flex-col items-center p-2 transition-all", activeView === 'stats' ? "text-red-600 scale-110" : "text-gray-400")}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-bold">Stats</span>
          </button>
          <button 
            onClick={() => setActiveView('list')} 
            className={cn("flex flex-col items-center p-2 transition-all", activeView === 'list' ? "text-red-600 scale-110" : "text-gray-400")}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-bold">Koperasi</span>
          </button>
          <button 
            onClick={() => setActiveView('approval')} 
            className={cn("flex flex-col items-center p-2 transition-all relative", activeView === 'approval' ? "text-red-600 scale-110" : "text-gray-400")}
          >
            <div className="relative">
              <Clock className="w-5 h-5" />
              {pendingRegs.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
            </div>
            <span className="text-[10px] mt-1 font-bold">Approval</span>
          </button>
          <button 
            onClick={() => setActiveView('region')} 
            className={cn("flex flex-col items-center p-2 transition-all", activeView === 'region' ? "text-red-600 scale-110" : "text-gray-400")}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-bold">Wilayah</span>
          </button>
        </nav>
      </main>
    </div>
  );
}

function RegionManagerView({ registrations }: { key?: string, registrations: any[] }) {
  const approved = registrations.filter(r => r.status === 'approved');
  
  // Aggregate data by Province
  const provinceStats = approved.reduce((acc: any, curr) => {
    const prov = curr.provinsi || 'Tidak Diketahui';
    if (!acc[prov]) {
      acc[prov] = { name: prov, count: 0, regencies: {} };
    }
    acc[prov].count += 1;
    
    const reg = curr.kabupaten || 'Tidak Diketahui';
    if (!acc[prov].regencies[reg]) {
      acc[prov].regencies[reg] = 0;
    }
    acc[prov].regencies[reg] += 1;
    
    return acc;
  }, {});

  const sortedProvinces = Object.values(provinceStats).sort((a: any, b: any) => b.count - a.count);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Region Manager</h1>
          <p className="text-sm sm:text-base text-gray-500 font-bold mt-2">Distribusi Koperasi berdasarkan wilayah administratif.</p>
        </div>
        <div className="px-5 py-2.5 bg-orange-50 rounded-2xl flex items-center gap-2 w-max self-start sm:self-center">
          <MapPin className="w-4 h-4 text-orange-600" />
          <span className="text-[10px] sm:text-xs font-black uppercase text-orange-600 tracking-widest">{sortedProvinces.length} Provinsi Terdata</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Provinsi Teraktif
          </h2>
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            {sortedProvinces.map((prov: any, idx: number) => (
              <div key={prov.name} className={cn(
                "p-6 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors",
                idx === 0 && "bg-orange-50/30"
              )}>
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-black">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900">{prov.name}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{Object.keys(prov.regencies).length} Kabupaten/Kota</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-gray-900">{prov.count}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Koperasi</p>
                </div>
              </div>
            ))}
            {sortedProvinces.length === 0 && (
              <div className="p-12 text-center text-gray-400 font-bold">
                Belum ada data wilayah
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Distribusi Kabupaten/Kota
          </h2>
          <div className="space-y-4">
            {sortedProvinces.slice(0, 5).map((prov: any) => (
              <div key={`dist-${prov.name}`} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900">{prov.name}</h4>
                  <span className="text-xs font-black text-gray-400 uppercase">{prov.count} Total</span>
                </div>
                <div className="space-y-3">
                  {Object.entries(prov.regencies).map(([reg, count]: [any, any]) => (
                    <div key={reg} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-600">{reg}</span>
                        <span className="text-gray-900">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / prov.count) * 100}%` }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatsView({ onSeeAll, registrations, onApprove, onReject }: { key?: string, onSeeAll: () => void, registrations: any[], onApprove: (id: string) => void, onReject: (id: string) => void }) {
  const approved = registrations.filter(r => r.status === 'approved').length;
  const pending = registrations.filter(r => r.status === 'pending').length;

  const provCount = new Set(registrations.filter(r => r.status === 'approved').map(r => r.provinsi)).size;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">National Overview</h1>
          <p className="text-sm sm:text-base text-gray-500 font-bold mt-2">Monitoring {registrations.length} Koperasi di seluruh Indonesia.</p>
        </div>
        <div className="flex items-center gap-4">
             <div className="px-5 py-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-2 w-max">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] sm:text-xs font-black uppercase text-gray-500 tracking-widest">Sistem Online</span>
             </div>
        </div>
      </header>

      {/* Global Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
         <GlobalStat icon={<Building2 className="text-blue-500" />} label="Total Koperasi" value={registrations.length.toString()} trend="+42/mo" />
         <GlobalStat icon={<TrendingUp className="text-green-500" />} label="Pending" value={pending.toString()} trend="Review" />
         <GlobalStat icon={<Shield className="text-red-500" />} label="Disetujui" value={approved.toString()} trend="Active" />
         <GlobalStat icon={<MapPin className="text-orange-500" />} label="Wilayah" value={`${provCount} Prov`} trend="All" />
      </div>

      {/* Recent Approvals */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Pending Approvals</h2>
          <button onClick={onSeeAll} className="text-sm font-black text-red-600 uppercase tracking-widest">Lihat Semua Antrean</button>
        </div>
        <div className="grid gap-4">
           {registrations.filter(r => r.status === 'pending').slice(0, 3).map(reg => (
             <ApprovalItem 
              key={reg.id} 
              id={reg.id}
              name={reg.namaKoperasi} 
              region={`${reg.desa || ''}, ${reg.kecamatan || ''}`} 
              date={reg.createdAt?.toDate ? reg.createdAt.toDate().toLocaleString() : 'Baru saja'}
              hp={reg.hp}
              phone={reg.phone}
              onApprove={onApprove}
              onReject={onReject}
              onReview={onSeeAll}
             />
           ))}
           {registrations.filter(r => r.status === 'pending').length === 0 && (
             <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 font-bold text-gray-400">
               Tidak ada pendaftaran yang pending
             </div>
           )}
        </div>
      </section>
    </motion.div>
  );
}

function KoperasiListView({ registrations }: { key?: string, registrations: any[] }) {
  const approved = registrations.filter(r => r.status === 'approved');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApproved = approved.filter(item => 
    item.namaKoperasi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.ketua?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kabupaten?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add Report Header
    doc.setFontSize(22);
    doc.setTextColor(220, 38, 38); // Red-600
    doc.text('KDKMP DIGITAL', 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.text('LAPORAN DAFTAR KOPERASI SELURUH INDONESIA', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray-500
    const dateStr = new Date().toLocaleString('id-ID');
    doc.text(`Dicetak pada: ${dateStr}`, 14, 37);

    // Filtered data for table
    const tableData = filteredApproved.map((item, index) => [
      index + 1,
      item.namaKoperasi || '-',
      item.ketua || '-',
      item.kabupaten || '-',
      `${item.desa || ''}, ${item.kecamatan || ''}`,
      item.badanHukum || '-',
      item.hp || item.phone || '-'
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['NO', 'NAMA KOPERASI', 'KETUA', 'KABUPATEN', 'WILAYAH DESA/KEC', 'BADAN HUKUM', 'WHATSAPP']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [220, 38, 38],
        halign: 'center',
        fontSize: 9
      },
      styles: { 
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 60, fontStyle: 'bold' },
        2: { cellWidth: 35 },
        3: { halign: 'center', cellWidth: 30 },
        4: { cellWidth: 50 },
        5: { cellWidth: 40 },
        6: { halign: 'center', cellWidth: 40 }
      }
    });

    doc.save(`Laporan_Daftar_Koperasi_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Laporan PDF berhasil diunduh');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Daftar Koperasi</h1>
          <p className="text-sm sm:text-base text-gray-500 font-bold mt-2">Daftar seluruh koperasi mitra KDKMP Digital yang disetujui.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari koperasi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20 font-bold"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors flex-1 sm:flex-none">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-200 text-sm font-bold hover:bg-red-700 transition-all flex-1 sm:flex-none"
            >
              <FileDown className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-4">
        {filteredApproved.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between group hover:shadow-xl transition-all gap-4">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center font-black text-red-600 text-xl flex-shrink-0">
                {item.namaKoperasi?.charAt(0) || 'K'}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 line-clamp-1">{item.namaKoperasi}</h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                  <p className="text-xs font-bold text-gray-400">Legalitas: {item.badanHukum} • {item.desa}, {item.kecamatan}</p>
                  {(item.hp || item.phone) && (
                    <button 
                      onClick={() => {
                        const phone = item.hp || item.phone;
                        const message = `Halo ${item.ketua || item.nama}, akun pendaftaran koperasi ${item.namaKoperasi} sudah terverifikasi silakan login menggunakan email yang terdaftar. Terima kasih.`;
                        const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                        window.open(waUrl, '_blank');
                      }}
                      className="flex items-center gap-2 text-xs font-black text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-xl transition-all shadow-lg shadow-green-200"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Kirim Notifikasi WA ({item.hp || item.phone})
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-8 w-full sm:w-auto">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Ketua</p>
                <p className="font-bold text-gray-900">{item.ketua}</p>
              </div>
              <div className="text-right min-w-[100px]">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Kabupaten</p>
                <p className="font-bold text-gray-900 line-clamp-1">{item.kabupaten}</p>
              </div>
              <button className="p-2.5 text-gray-300 hover:text-gray-600">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {approved.length === 0 && (
          <div className="p-12 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-bold text-gray-400">Belum ada koperasi yang disetujui</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ApprovalView({ registrations, onApprove, onReject }: { key?: string, registrations: any[], onApprove: (id: string) => void, onReject: (id: string) => void }) {
  const pending = registrations.filter(r => r.status === 'pending');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Pending Approvals</h1>
          <p className="text-sm sm:text-base text-gray-500 font-bold mt-2">Verifikasi berkas dan legalitas koperasi baru.</p>
        </div>
        <div className="px-5 py-2.5 bg-red-50 rounded-2xl flex items-center gap-2 w-max self-start sm:self-center">
          <Clock className="w-4 h-4 text-red-600" />
          <span className="text-[10px] sm:text-xs font-black uppercase text-red-600 tracking-widest">{pending.length} Menunggu Approval</span>
        </div>
      </header>

      <div className="grid gap-6">
        {pending.map((item) => (
    <div className="bg-white p-4 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-gray-300 text-xl flex-shrink-0">
            {item.namaKoperasi?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{item.namaKoperasi}</h3>
            <p className="text-xs font-bold text-gray-400 mt-1 truncate">{item.desa}, {item.kecamatan} • {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Baru'}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => onReject(item.id)}
            className="flex-1 sm:flex-none p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
          >
            <X className="w-5 h-5 sm:mr-0 mr-2" /> <span className="sm:hidden font-bold">Tolak</span>
          </button>
          <button 
            onClick={() => onApprove(item.id)}
            className="flex-1 sm:flex-none p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
          >
            <Check className="w-5 h-5 sm:mr-0 mr-2" /> <span className="sm:hidden font-bold">Setujui</span>
          </button>
        </div>
      </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ketua Pengurus</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-700">{item.ketua}</p>
                  {(item.hp || item.phone) && (
                    <button 
                      onClick={() => {
                        const phone = item.hp || item.phone;
                        const message = `Halo ${item.ketua || item.nama}, akun pendaftaran koperasi ${item.namaKoperasi} sudah terverifikasi silakan login menggunakan email yang terdaftar. Terima kasih.`;
                        const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                        window.open(waUrl, '_blank');
                      }}
                      className="flex items-center gap-1.5 text-[11px] font-black text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Kirim WA ({item.hp || item.phone})
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Badan Hukum</p>
                <p className="text-sm font-bold text-blue-600">{item.badanHukum}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Manager</p>
                <p className="text-sm font-bold text-gray-700 truncate">{item.email}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-500 truncate max-w-[200px] sm:max-w-none">Hubungi: {item.nama}</span>
              </div>
              <button 
                onClick={() => {
                   toast(`Detail Rekening: ${item.rekening}`);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-gray-200"
              >
                Detail Berkas
              </button>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <div className="p-16 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
             <CheckCircle className="w-16 h-16 text-green-200 mx-auto mb-4" />
             <p className="text-xl font-bold text-gray-400">Antrean approval kosong</p>
             <p className="text-gray-400 mt-2">Semua pengajuan telah diproses.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function GlobalStat({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-black text-gray-900">{value}</h3>
        <span className="text-xs font-black text-green-500 tracking-tighter mb-1">{trend}</span>
      </div>
    </div>
  );
}

interface SideItemProps {
  icon: React.ReactElement;
  label: string;
  active?: boolean;
  badge?: string;
  onClick: () => void;
}

function SideItem({ icon, label, active = false, badge, onClick }: SideItemProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all",
        active ? "bg-red-600 text-white shadow-xl shadow-red-900/50" : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <div className="flex items-center gap-4">
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
        <span>{label}</span>
      </div>
      {badge && <span className="bg-white/10 text-[10px] font-black px-2 py-1 rounded-lg text-white/50">{badge}</span>}
    </button>
  );
}

function ApprovalItem({ id, name, region, date, hp, phone, onApprove, onReject, onReview }: { key?: any, id: string, name: string, region: string, date: string, hp?: string, phone?: string, onApprove?: (id: string) => void, onReject?: (id: string) => void, onReview?: () => void }) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between group hover:shadow-xl transition-all gap-4">
       <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-gray-400 text-xl group-hover:bg-red-50 group-hover:text-red-600 transition-colors flex-shrink-0">
            {name?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-gray-900 group-hover:text-red-600 transition-all truncate">{name}</h4>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {region}</span>
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {date}</span>
              {(hp || phone) && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const p = hp || phone || '';
                    const message = `Halo, akun pendaftaran koperasi ${name} sudah terverifikasi silakan login menggunakan email yang terdaftar. Terima kasih.`;
                    const waUrl = `https://wa.me/${p.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                    window.open(waUrl, '_blank');
                  }}
                  className="flex items-center gap-1 text-[10px] font-black text-green-600 hover:text-green-700"
                >
                  <MessageCircle className="w-3 h-3" /> WA: {hp || phone}
                </button>
              )}
            </div>
          </div>
       </div>
       <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {onApprove && onReject ? (
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => onReject(id)}
                className="flex-1 sm:flex-none p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"
                title="Tolak"
              >
                <X className="w-5 h-5 sm:mr-0 mr-2" /> <span className="sm:hidden font-bold">Tolak</span>
              </button>
              <button 
                onClick={() => onApprove(id)}
                className="flex-1 sm:flex-none p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all flex items-center justify-center"
                title="Setujui"
              >
                <Check className="w-5 h-5 sm:mr-0 mr-2" /> <span className="sm:hidden font-bold">Setujui</span>
              </button>
            </div>
          ) : (
            <button onClick={onReview} className="w-full sm:w-auto px-6 py-2.5 bg-gray-50 text-gray-500 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all text-sm">Review</button>
          )}
          <button className="p-2.5 text-gray-300 hover:text-gray-600 hidden sm:block">
            <MoreVertical className="w-5 h-5" />
          </button>
       </div>
    </div>
  );
}
