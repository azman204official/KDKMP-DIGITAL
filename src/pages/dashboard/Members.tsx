import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin, 
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Trash2,
  Edit2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import localDb from '../../lib/localDb';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Member {
  id: string;
  name: string;
  nik: string;
  phone: string;
  address: string;
  addressDetail?: string;
  lat?: number;
  lng?: number;
  joinDate: any;
  status: 'active' | 'suspended' | 'inactive';
  simpananPokok: number;
  simpananWajib: number;
  simpananSukarela: number;
  createdAt: any;
}

export default function Members() {
  const { profile, koperasi } = useAuth();
  
  const members = useLiveQuery(
    () => profile?.koperasiId ? localDb.anggota.where('koperasiId').equals(profile.koperasiId).toArray() : Promise.resolve([]),
    [profile?.koperasiId],
    []
  ) as Member[];

  const loading = members === undefined;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const pendingRegsRaw = useLiveQuery(
    () => profile?.koperasiId ? localDb.registrations.where({ role: 'anggota', status: 'pending' }).filter(r => r.targetKoperasiId === profile.koperasiId).toArray() : Promise.resolve([]),
    [profile?.koperasiId],
    []
  );
  const pendingRegs = pendingRegsRaw || [];

  // Add/Edit Member State
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    nik: '',
    phone: '',
    address: '',
    status: 'active' as const,
    simpananPokok: 0,
    simpananWajib: 0,
    simpananSukarela: 0,
    lat: null as number | null,
    lng: null as number | null
  });

  useEffect(() => {
    if (editingMember) {
      let mergedAddress = editingMember.address || '';
      // If the member provided address details and they aren't already included
      // in the main address, prepend them automatically.
      if (editingMember.addressDetail && !mergedAddress.includes(editingMember.addressDetail)) {
        mergedAddress = `${editingMember.addressDetail}, ${mergedAddress}`;
      }

      setMemberForm({
        name: editingMember.name || '',
        nik: editingMember.nik || '',
        phone: editingMember.phone || '',
        address: mergedAddress,
        status: editingMember.status || 'active',
        simpananPokok: editingMember.simpananPokok || 0,
        simpananWajib: editingMember.simpananWajib || 0,
        simpananSukarela: editingMember.simpananSukarela || 0,
        lat: editingMember.lat || null,
        lng: editingMember.lng || null
      });
    }
  }, [editingMember]);

  const handleApproveAnggota = async (reg: any) => {
    if (!profile?.koperasiId) return;
    try {
      // 1. Create Member in Koperasi
      await localDb.anggota.put({
        id: reg.uid,
        name: reg.nama,
        nik: reg.nik || '-', 
        phone: reg.hp,
        address: `${reg.desa}, ${reg.kecamatan}, ${reg.kabupaten}, ${reg.provinsi}`,
        addressDetail: reg.alamat || '',
        lat: reg.lat || null,
        lng: reg.lng || null,
        status: 'active',
        simpananPokok: 0,
        simpananWajib: 0,
        simpananSukarela: 0,
        koperasiId: profile.koperasiId,
        joinDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        createdAt: new Date().toISOString(),
      });

      // 2. Activate User Profile
      await localDb.users.update(reg.uid, {
        status: 'active'
      });

      // 3. Mark Registration as Approved
      await localDb.registrations.update(reg.id!, {
        status: 'approved'
      });

      toast.success('Pendaftaran anggota disetujui');
    } catch (error) {
      console.error('Error approving member:', error);
      toast.error('Gagal menyetujui anggota');
    }
  };

  const handleRejectAnggota = async (regId: string) => {
    if (!window.confirm('Tolak dan hapus pendaftaran anggota ini?')) return;
    try {
      await localDb.registrations.delete(regId);
      toast.success('Pendaftaran ditolak');
    } catch (error) {
      console.error('Error rejecting member:', error);
      toast.error('Gagal menolak pendaftaran');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.koperasiId) return;
    setIsProcessing(true);
    try {
      await localDb.anggota.add({
        ...memberForm,
        koperasiId: profile.koperasiId,
        joinDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        createdAt: new Date().toISOString(),
      });
      toast.success('Anggota berhasil ditambahkan');
      setShowAddModal(false);
      setMemberForm({ 
        name: '', nik: '', phone: '', address: '', status: 'active', 
        simpananPokok: 0, simpananWajib: 0, simpananSukarela: 0,
        lat: null, lng: null
      });
    } catch (error) {
      console.error(error);
      toast.error('Gagal menambahkan anggota');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.koperasiId || !editingMember) return;
    setIsProcessing(true);
    try {
      await localDb.anggota.update(editingMember.id, {
        ...memberForm,
      });
      toast.success('Data anggota berhasil diperbarui');
      setShowEditModal(false);
      setEditingMember(null);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memperbarui data anggota');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !profile?.koperasiId) return;
    setIsDeleting(true);
    try {
      const memberToDelete = members.find(m => m.id === deleteId);
      const memberName = memberToDelete?.name;
      
      // 1. Delete associated payments
      await localDb.pembayaran.where('anggotaId').equals(deleteId).delete();
      
      // 2. Delete member
      await localDb.anggota.delete(deleteId);
      
      // 3. Mark user as inactive
      await localDb.users.update(deleteId, {
        status: 'inactive'
      });
      
      toast.success('Anggota, riwayat pembayaran, dan akses berhasil dihapus');
      setDeleteId(null);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus anggota');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMembers = members.filter(m => 
    (m.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (m.nik || '').includes(searchTerm)
  );

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Header report
    doc.setFontSize(22);
    doc.setTextColor(220, 38, 38); // red-600
    doc.text(koperasi?.name || 'KOPERASI DIGITAL', 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81); // gray-700
    doc.text('LAPORAN DATA & SIMPANAN ANGGOTA', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // gray-500
    const dateStr = new Date().toLocaleString('id-ID');
    doc.text(`Periode Cetak: ${dateStr}`, 14, 37);

    // Calculate Totals
    const totalPokok = filteredMembers.reduce((sum, m) => sum + (m.simpananPokok || 0), 0);
    const totalWajib = filteredMembers.reduce((sum, m) => sum + (m.simpananWajib || 0), 0);
    const totalSukarela = filteredMembers.reduce((sum, m) => sum + (m.simpananSukarela || 0), 0);
    const totalSemua = totalPokok + totalWajib + totalSukarela;

    // Filtered data for table
    const tableData = filteredMembers.map((m, index) => [
      index + 1,
      m.name || '-',
      m.nik || '-',
      m.phone || '-',
      m.address || '-',
      formatCurrency(m.simpananPokok || 0),
      formatCurrency(m.simpananWajib || 0),
      formatCurrency(m.simpananSukarela || 0),
      formatCurrency((m.simpananPokok || 0) + (m.simpananWajib || 0) + (m.simpananSukarela || 0))
    ]);

    // Summary Row
    const summaryRow = [
      '',
      'TOTAL KESELURUHAN',
      '',
      '',
      '',
      formatCurrency(totalPokok),
      formatCurrency(totalWajib),
      formatCurrency(totalSukarela),
      formatCurrency(totalSemua)
    ];

    autoTable(doc, {
      startY: 45,
      head: [['NO', 'NAMA ANGGOTA', 'NIK', 'WHATSAPP', 'ALAMAT', 'SIMP. POKOK', 'SIMP. WAJIB', 'SIMP. SUKARELA', 'SUBTOTAL']],
      body: [...tableData, summaryRow],
      theme: 'grid',
      headStyles: { 
        fillColor: [220, 38, 38], 
        fontSize: 8,
        halign: 'center'
      },
      styles: { 
        fontSize: 7, 
        cellPadding: 3,
        valign: 'middle'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 40, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 25 },
        4: { cellWidth: 50 },
        5: { halign: 'right', cellWidth: 25 },
        6: { halign: 'right', cellWidth: 25 },
        7: { halign: 'right', cellWidth: 25 },
        8: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        // Highlight summary row
        if (data.row.index === tableData.length) {
          data.cell.styles.fillColor = [245, 245, 245];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [20, 20, 20];
          data.cell.styles.fontSize = 8;
        }
      }
    });

    doc.save(`Laporan_Anggota_${koperasi?.name || 'Koperasi'}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Laporan PDF anggota berhasil diunduh');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 leading-tight tracking-tight">Daftar Anggota</h2>
          <p className="text-gray-500 font-medium mt-1">Total {members.length} anggota terdaftar di {koperasi?.name || 'Koperasi Desa'}.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:text-red-600 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button 
            onClick={() => {
              setEditingMember(null);
              setMemberForm({ 
                name: '', nik: '', phone: '', address: '', status: 'active', 
                simpananPokok: 0, simpananWajib: 0, simpananSukarela: 0,
                lat: null, lng: null
              });
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-100"
          >
            <Plus className="w-5 h-5" /> Tambah Anggota
          </button>
        </div>
      </div>

      {/* Pending Verifications */}
      <AnimatePresence>
        {pendingRegs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="bg-yellow-50 border border-yellow-100 rounded-[2rem] p-6 shadow-sm overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-yellow-900">Verifikasi Anggota Mandiri</h3>
                <p className="text-sm font-medium text-yellow-700 truncate">{pendingRegs.length} pendaftaran baru menunggu konfirmasi.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRegs.map(reg => (
                <div key={reg.id} className="bg-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-yellow-100/50">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{reg.nama}</p>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5">{reg.hp} • {reg.desa}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleRejectAnggota(reg.id)}
                      className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                    >
                      Tolak
                    </button>
                    <button 
                      onClick={() => handleApproveAnggota(reg)}
                      className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Setujui
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari nama atau NIK anggota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-transparent rounded-2xl py-3.5 pl-14 pr-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none font-medium text-sm"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-50 text-gray-500 border border-transparent rounded-2xl font-bold hover:border-gray-200 transition-all w-full sm:w-auto text-sm">
            <Filter className="w-4 h-4" /> Filter Lanjutan
          </button>
          <select className="bg-gray-50 border border-transparent rounded-2xl px-6 py-3.5 text-sm font-bold outline-none cursor-pointer w-full sm:w-auto focus:ring-2 focus:ring-red-100 transition-all">
            <option>Semua Status</option>
            <option>Aktif</option>
            <option>Menunggak</option>
            <option>Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Member List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <p className="text-gray-500 font-medium">Memuat data anggota...</p>
          </div>
        ) : filteredMembers.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-bottom border-gray-50 bg-gray-50/50">
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Informasi Anggota</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">NIK & Kontak</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Total Simpanan</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 text-lg uppercase shadow-sm group-hover:scale-105 transition-transform">
                            {member.name ? member.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{member.name}</p>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">Gabung: {member.joinDate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Shield className="w-3 h-3 text-red-600" /> {member.nik}
                          </p>
                          <a 
                            href={`https://wa.me/${member.phone.replace(/\\D/g, '').replace(/^0/, '62')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-gray-500 flex items-center gap-2 hover:text-green-600 transition-colors"
                          >
                            <Phone className="w-3 h-3" /> {member.phone}
                          </a>
                          <a 
                            href={member.lat && member.lng 
                              ? `https://www.google.com/maps/search/?api=1&query=${member.lat},${member.lng}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${member.addressDetail || ''} ${member.address || ''}`.trim())}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-medium text-red-600 flex items-center gap-2 hover:underline mt-1"
                          >
                            <MapPin className="w-3 h-3" /> {member.lat ? 'Titik Lokasi Pas' : 'Lihat Lokasi'}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={member.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-black text-gray-900 underline decoration-red-100 decoration-4 underline-offset-4">
                          {formatCurrency((member.simpananPokok || 0) + (member.simpananWajib || 0) + (member.simpananSukarela || 0))}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">
                          P: {formatCurrency(member.simpananPokok || 0)} | W: {formatCurrency(member.simpananWajib || 0)} | S: {formatCurrency(member.simpananSukarela || 0)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-right">
                          <button 
                            onClick={() => {
                              setEditingMember(member);
                              setShowEditModal(true);
                            }}
                            className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-green-600 hover:bg-green-50 transition-all shadow-sm group/edit"
                            title="Edit Data"
                          >
                            <Edit2 className="w-4 h-4 group-hover/edit:scale-110 transition-transform" />
                          </button>
                          <button 
                            onClick={() => setDeleteId(member.id)}
                            className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 hover:bg-red-50 transition-all shadow-sm group/del"
                            title="Hapus Anggota"
                          >
                            <Trash2 className="w-4 h-4 group-hover/del:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-50">
              {filteredMembers.map((member) => (
                <div key={member.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 text-sm uppercase">
                        {member.name ? member.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{member.name}</p>
                        <p className="text-[10px] font-medium text-gray-500">Gabung: {member.joinDate}</p>
                      </div>
                    </div>
                    <StatusBadge status={member.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">NIK</p>
                      <p className="text-xs font-bold text-gray-700 truncate">{member.nik}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">WhatsApp</p>
                      <a 
                        href={`https://wa.me/${member.phone.replace(/\\D/g, '').replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-gray-700 hover:text-green-600 transition-colors"
                      >
                        {member.phone}
                      </a>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-2xl flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alamat</p>
                      <p className="text-xs font-bold text-gray-700 truncate">{member.address}</p>
                    </div>
                    <a 
                      href={member.lat && member.lng 
                        ? `https://www.google.com/maps/search/?api=1&query=${member.lat},${member.lng}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${member.addressDetail || ''} ${member.address || ''}`.trim())}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-2.5 bg-white text-red-600 rounded-xl border border-red-50 hover:bg-red-50 transition-all shadow-sm flex items-center gap-2 font-bold text-xs"
                    >
                      <MapPin className="w-4 h-4" /> {member.lat ? 'GPS' : 'Peta'}
                    </a>
                  </div>

                  <div className="flex items-center justify-between bg-red-50/50 p-3 rounded-2xl border border-red-50">
                    <div>
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-0.5">Total Simpanan</p>
                      <p className="text-sm font-black text-gray-900">
                        {formatCurrency((member.simpananPokok || 0) + (member.simpananWajib || 0) + (member.simpananSukarela || 0))}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingMember(member);
                          setShowEditModal(true);
                        }}
                        className="p-2 bg-white text-gray-400 border border-gray-100 rounded-xl hover:text-green-600 transition-all shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteId(member.id)}
                        className="p-2 bg-white text-gray-400 border border-gray-100 rounded-xl hover:text-red-600 transition-all shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada anggota</h3>
            <p className="text-gray-500 font-medium max-w-sm mb-8">
              Mulai kelola koperasi Anda dengan menambahkan anggota pertama Anda sekarang.
            </p>
            <button 
            onClick={() => {
                setEditingMember(null);
                setMemberForm({ 
                  name: '', nik: '', phone: '', address: '', status: 'active', 
                  simpananPokok: 0, simpananWajib: 0, simpananSukarela: 0,
                  lat: null, lng: null
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
            >
              <Plus className="w-5 h-5" /> Tambah Anggota Sekarang
            </button>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => !isProcessing && setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Tambah Anggota Baru</h3>
                  <p className="text-gray-500 font-medium">Lengkapi data diri anggota koperasi.</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-gray-700 ml-1">Nama Lengkap</label>
                    <input 
                      required
                      type="text" 
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 ml-1">NIK (KTP)</label>
                    <input 
                      required
                      type="text" 
                      value={memberForm.nik}
                      onChange={(e) => setMemberForm({ ...memberForm, nik: e.target.value })}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                      placeholder="16 digit NIK"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 ml-1">Nomor WhatsApp</label>
                    <input 
                      required
                      type="tel" 
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                      placeholder="0812..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 ml-1">Simpanan Pokok (Rp)</label>
                    <input 
                      type="number" 
                      value={memberForm.simpananPokok}
                      onChange={(e) => setMemberForm({ ...memberForm, simpananPokok: Number(e.target.value) })}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 ml-1">Simpanan Wajib (Rp)</label>
                    <input 
                      type="number" 
                      value={memberForm.simpananWajib}
                      onChange={(e) => setMemberForm({ ...memberForm, simpananWajib: Number(e.target.value) })}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 ml-1">Simpanan Sukarela (Rp)</label>
                    <input 
                      type="number" 
                      value={memberForm.simpananSukarela}
                      onChange={(e) => setMemberForm({ ...memberForm, simpananSukarela: Number(e.target.value) })}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-1">Alamat Lengkap</label>
                  <textarea 
                    required
                    value={memberForm.address}
                    onChange={(e) => setMemberForm({ ...memberForm, address: e.target.value })}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none h-32 resize-none"
                    placeholder="Alamat lengkap tempat tinggal..."
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Koordinat GPS</p>
                    <p className="text-sm font-bold text-gray-900">
                      {memberForm.lat && memberForm.lng 
                        ? `${memberForm.lat.toFixed(6)}, ${memberForm.lng.toFixed(6)}` 
                        : 'Lokasi belum diset'}
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        toast.error('Browser Anda tidak mendukung GPS');
                        return;
                      }
                      toast.loading('Mencari posisi...');
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setMemberForm({ ...memberForm, lat: pos.coords.latitude, lng: pos.coords.longitude });
                          toast.dismiss();
                          toast.success('Lokasi berhasil diperbarui');
                        },
                        (err) => {
                          toast.dismiss();
                          toast.error('Gagal mengambil lokasi. Pastikan izin GPS aktif.');
                        }
                      );
                    }}
                    className="px-4 py-2 bg-white text-red-600 border border-red-50 rounded-xl hover:bg-red-50 transition-all text-xs font-bold flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" /> {memberForm.lat ? 'Perbarui Lokasi' : 'Set Lokasi Sekarang'}
                  </button>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...
                      </>
                    ) : 'Simpan Anggota'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Member Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => !isProcessing && setShowEditModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Perbaiki Data Anggota</h3>
                  <p className="text-gray-500 font-medium">Ubah informasi anggota yang terpilih.</p>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleUpdateMember} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-gray-700 ml-1">Nama Lengkap</label>
                    <input 
                      required
                      type="text" 
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 ml-1">NIK (KTP)</label>
                    <input 
                      required
                      type="text" 
                      value={memberForm.nik}
                      onChange={(e) => setMemberForm({ ...memberForm, nik: e.target.value })}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 ml-1">Nomor WhatsApp</label>
                    <input 
                      required
                      type="tel" 
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 ml-1">Simpanan Pokok (Rp)</label>
                    <input 
                      type="number" 
                      value={memberForm.simpananPokok}
                      onChange={(e) => setMemberForm({ ...memberForm, simpananPokok: Number(e.target.value) })}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 ml-1">Simpanan Wajib (Rp)</label>
                    <input 
                      type="number" 
                      value={memberForm.simpananWajib}
                      onChange={(e) => setMemberForm({ ...memberForm, simpananWajib: Number(e.target.value) })}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 ml-1">Simpanan Sukarela (Rp)</label>
                    <input 
                      type="number" 
                      value={memberForm.simpananSukarela}
                      onChange={(e) => setMemberForm({ ...memberForm, simpananSukarela: Number(e.target.value) })}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 ml-1">Status Anggota</label>
                    <select 
                      value={memberForm.status}
                      onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value as any })}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none font-bold"
                    >
                      <option value="active">Aktif</option>
                      <option value="suspended">Menunggak</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-1">Alamat Lengkap</label>
                  <textarea 
                    required
                    value={memberForm.address}
                    onChange={(e) => setMemberForm({ ...memberForm, address: e.target.value })}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none h-32 resize-none"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Koordinat GPS</p>
                    <p className="text-sm font-bold text-gray-900">
                      {memberForm.lat && memberForm.lng 
                        ? `${memberForm.lat.toFixed(6)}, ${memberForm.lng.toFixed(6)}` 
                        : 'Lokasi belum diset'}
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        toast.error('Browser Anda tidak mendukung GPS');
                        return;
                      }
                      toast.loading('Mencari posisi...');
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setMemberForm({ ...memberForm, lat: pos.coords.latitude, lng: pos.coords.longitude });
                          toast.dismiss();
                          toast.success('Lokasi berhasil diperbarui');
                        },
                        (err) => {
                          toast.dismiss();
                          toast.error('Gagal mengambil lokasi. Pastikan izin GPS aktif.');
                        }
                      );
                    }}
                    className="px-4 py-2 bg-white text-green-600 border border-green-50 rounded-xl hover:bg-green-50 transition-all text-xs font-bold flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" /> {memberForm.lat ? 'Perbarui Lokasi' : 'Set Lokasi Sekarang'}
                  </button>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 px-6 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Memperbarui...
                      </>
                    ) : 'Perbarui Data'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Hapus Anggota?</h3>
              <p className="text-gray-500 font-medium mb-8">
                Data anggota ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: Member['status'] }) {
  const configs = {
    active: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, text: 'Aktif', class: 'bg-green-50 text-green-700 border-green-100' },
    suspended: { icon: <Clock className="w-3.5 h-3.5" />, text: 'Menunggak', class: 'bg-orange-50 text-orange-700 border-orange-100' },
    inactive: { icon: <XCircle className="w-3.5 h-3.5" />, text: 'Nonaktif', class: 'bg-gray-100 text-gray-600 border-gray-200' },
  };

  const config = configs[status];

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border", config.class)}>
      {config.icon}
      {config.text}
    </div>
  );
}
