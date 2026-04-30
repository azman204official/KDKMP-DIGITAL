import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Printer,
  ChevronDown,
  TrendingUp,
  Loader2,
  Users
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import localDb from '../../lib/localDb';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'balance' | 'income' | 'cashflow'>('balance');
  
  const membersRaw = useLiveQuery(
    () => profile?.koperasiId ? localDb.anggota.where('koperasiId').equals(profile.koperasiId).toArray() : Promise.resolve([]),
    [profile?.koperasiId],
    []
  );

  const members = membersRaw || [];
  const loading = membersRaw === undefined;

  const sumPokok = members.reduce((acc, m) => acc + (m.simpananPokok || 0), 0);
  const sumWajib = members.reduce((acc, m) => acc + (m.simpananWajib || 0), 0);
  const sumSukarela = members.reduce((acc, m) => acc + (m.simpananSukarela || 0), 0);
  const totalSimpanan = sumPokok + sumWajib + sumSukarela;

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor: [number, number, number] = [220, 38, 38]; // red-600
    const secondaryColor: [number, number, number] = [55, 65, 81]; // gray-700
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(profile?.koperasiName || 'KOPERASI DIGITAL', 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('LAPORAN KEUANGAN TAHUNAN', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 37);

    // 1. NERACA SECTION
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('1. NERACA KEUANGAN', 14, 50);

    const neracaData = [
      ['ASET (AKTIVA)', '', ''],
      ['   - Kas dan Bank', formatCurrency(totalSimpanan), ''],
      ['   - Piutang Anggota', formatCurrency(0), ''],
      ['   - Inventaris', formatCurrency(0), ''],
      ['TOTAL ASET', '', formatCurrency(totalSimpanan)],
      ['', '', ''],
      ['KEWAJIBAN & EKUITAS (PASSIVA)', '', ''],
      ['   - Simpanan Pokok', formatCurrency(sumPokok), ''],
      ['   - Simpanan Wajib', formatCurrency(sumWajib), ''],
      ['   - Simpanan Sukarela', formatCurrency(sumSukarela), ''],
      ['   - Ekuitas / Modal', formatCurrency(totalSimpanan), ''],
      ['TOTAL KEWAJIBAN & EKUITAS', '', formatCurrency(totalSimpanan)]
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Keterangan', 'Rincian', 'Jumlah']],
      body: neracaData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: 'right', cellWidth: 50 },
        2: { halign: 'right', cellWidth: 50 }
      },
      didParseCell: (data) => {
        if (data.row.index === 0 || data.row.index === 6 || data.row.index === 4 || data.row.index === 11) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // 2. LABA RUGI SECTION
    const lastY = (doc as any).lastAutoTable.finalY || 150;
    doc.addPage(); // Use new page for P&L or if space is tight
    
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('2. LAPORAN LABA RUGI', 14, 20);

    const labaRugiData = [
      ['PENDAPATAN', '', ''],
      ['   - Bagi Hasil Pinjaman', formatCurrency(0), ''],
      ['   - Adm Anggota Baru', formatCurrency(members.length * 10000), ''],
      ['TOTAL PENDAPATAN', '', formatCurrency(members.length * 10000)],
      ['', '', ''],
      ['BEBAN OPERASIONAL', '', ''],
      ['   - Beban Kantor', formatCurrency(0), ''],
      ['   - Honor Pengurus', formatCurrency(0), ''],
      ['TOTAL BEBAN', '', formatCurrency(0)],
      ['', '', ''],
      ['SISA HASIL USAHA (SHU)', '', formatCurrency(members.length * 10000)]
    ];

    autoTable(doc, {
      startY: 25,
      head: [['Keterangan', 'Rincian', 'Jumlah']],
      body: labaRugiData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: 'right', cellWidth: 50 },
        2: { halign: 'right', cellWidth: 50 }
      },
      didParseCell: (data) => {
        if (data.row.index === 0 || data.row.index === 5 || data.row.index === 3 || data.row.index === 8 || data.row.index === 10) {
          data.cell.styles.fontStyle = 'bold';
          if (data.row.index === 10) data.cell.styles.textColor = [22, 163, 74]; // green-600
        }
      }
    });

    // Signatures
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.setFontSize(10);
    doc.text('Mengetahui,', 20, finalY);
    doc.text('Ketua Koperasi', 20, finalY + 5);
    doc.text('____________________', 20, finalY + 25);

    doc.text('Disusun Oleh,', 140, finalY);
    doc.text('Bendahara', 140, finalY + 5);
    doc.text('____________________', 140, finalY + 25);

    doc.save(`Laporan_Keuangan_KDKMP_${profile?.koperasiName || 'Koperasi'}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Laporan PDF berhasil diunduh');
  };

  const PIE_DATA = [
    { name: 'Simpanan Pokok', value: sumPokok, color: '#2563eb' },
    { name: 'Simpanan Wajib', value: sumWajib, color: '#16a34a' },
    { name: 'Simpanan Sukarela', value: sumSukarela, color: '#9333ea' },
  ];

  const totalDana = totalSimpanan > 0 ? totalSimpanan : 1; // Avoid division by zero

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Menyusun Laporan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 leading-tight tracking-tight uppercase">Laporan Keuangan</h2>
          <p className="text-gray-500 font-medium mt-1">Analisis dan ekspor data keuangan koperasi secara komprehensif.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl font-bold text-gray-600 hover:text-red-600 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" /> Cetak
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-100 uppercase text-xs tracking-widest"
          >
            <Download className="w-4 h-4" /> Ekspor PDF/CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 space-y-1.5 w-full">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rentang Tanggal</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select className="w-full bg-gray-50 border border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm font-bold outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-red-100 transition-all">
              <option>April 2026</option>
              <option>Kuartal 1, 2026</option>
              <option>Custom Range...</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex-1 space-y-1.5 w-full">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori Laporan</label>
          <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
            <button 
              onClick={() => setActiveTab('balance')}
              className={cn("flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all", activeTab === 'balance' ? "bg-white text-red-600 shadow-sm" : "text-gray-400 hover:text-gray-600")}
            >Neraca</button>
            <button 
              onClick={() => setActiveTab('income')}
              className={cn("flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all", activeTab === 'income' ? "bg-white text-red-600 shadow-sm" : "text-gray-400 hover:text-gray-600")}
            >Laba Rugi</button>
            <button 
              onClick={() => setActiveTab('cashflow')}
              className={cn("flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all", activeTab === 'cashflow' ? "bg-white text-red-600 shadow-sm" : "text-gray-400 hover:text-gray-600")}
            >Arus Kas</button>
          </div>
        </div>
      </div>

      {/* Main Report View */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Table View */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50">
            <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <FileText className="text-red-600 w-5 h-5" />
              </div>
              {activeTab === 'balance' && 'Neraca Keuangan'}
              {activeTab === 'income' && 'Laporan Laba Rugi'}
              {activeTab === 'cashflow' && 'Laporan Arus Kas'}
            </h3>
            <p className="text-sm text-gray-400 font-medium mt-1">Periode: April 2026</p>
          </div>
          
          <div className="p-8 space-y-10 flex-1 overflow-y-auto min-h-[400px]">
            {activeTab === 'balance' && (
              <div className="space-y-8">
                <ReportSection title="Aset (Aktiva)" items={[
                  { label: 'Kas & Bank', value: totalSimpanan, trend: 'up' },
                  { label: 'Piutang Anggota', value: 0, trend: 'down' },
                  { label: 'Inventaris Kantor', value: 0 },
                ]} />
                <ReportSection title="Kewajiban & Ekuitas (Passiva)" items={[
                  { label: 'Simpanan Pokok', value: sumPokok },
                  { label: 'Simpanan Wajib', value: sumWajib },
                  { label: 'Simpanan Sukarela', value: sumSukarela },
                  { label: 'Tabungan Berjangka', value: 0 },
                  { label: 'Ekuitas / Modal Sendiri', value: totalSimpanan, trend: 'up' },
                ]} />
              </div>
            )}

            {activeTab === 'income' && (
              <div className="space-y-8">
                <ReportSection title="Pendapatan" items={[
                  { label: 'Bagi Hasil Pinjaman', value: 0, trend: 'up' },
                  { label: 'Administrasi Anggota Baru', value: members.length * 10000 },
                  { label: 'Pendapatan Lain-lain', value: 0 },
                ]} total={members.length * 10000} />
                <ReportSection title="Beban Biaya" items={[
                  { label: 'Biaya Operasional Kantor', value: 0 },
                  { label: 'Ganjaran Pengurus', value: 0 },
                  { label: 'Pajak & Retribusi', value: 0 },
                ]} total={0} />
                <div className="pt-8 border-t-4 border-double border-red-50 flex items-center justify-between">
                  <span className="text-lg font-black text-gray-900 uppercase tracking-tighter">Sisa Hasil Usaha (SHU)</span>
                  <span className="text-3xl font-black text-green-600 underline underline-offset-8 decoration-4 decoration-green-100">
                    {formatCurrency(members.length * 10000)}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'cashflow' && (
              <div className="space-y-8">
                <ReportSection title="Arus Kas Operasional" items={[
                  { label: 'Penerimaan Simpanan', value: totalSimpanan },
                  { label: 'Pembayaran Beban Operasional', value: 0 },
                ]} />
               <ReportSection title="Arus Kas Pendanaan" items={[
                  { label: 'SHU Diterima', value: 0 },
                ]} />
              </div>
            )}
          </div>
        </div>

        {/* Visual Analytics */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h4 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">Komposisi Dana</h4>
            <div className="h-64 w-full relative">
               {totalSimpanan > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={PIE_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {PIE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                        formatter={(v: number) => formatCurrency(v)}
                      />
                   </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <div className="w-32 h-32 rounded-full border-[10px] border-gray-100 animate-pulse"></div>
                 </div>
               )}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-sm font-black text-gray-900">{formatCurrency(totalSimpanan)}</p>
               </div>
            </div>
            <div className="mt-8 space-y-4">
              {PIE_DATA.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 4px 6px ${item.color}33` }}></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-gray-900 bg-gray-50 px-2 py-0.5 rounded-lg">{totalSimpanan > 0 ? ((item.value / totalDana) * 100).toFixed(1) : '0.0'}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-red-100 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <h4 className="text-xl font-black mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" /> Kinerja Koperasi
            </h4>
            <p className="text-red-100 text-sm font-medium leading-relaxed mb-8">
              Koperasi Anda sedang mengumpulkan data. Berdasarkan anggota saat ini, likuiditas Anda sangat terkontrol.
            </p>
            <button 
              onClick={handleExportPDF}
              className="w-full py-4 bg-white text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Cetak Laporan Lengkap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportSection({ title, items, total }: { title: string, items: { label: string, value: number, trend?: 'up' | 'down' }[], total?: number }) {
  return (
    <div className="space-y-5">
      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</h5>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-700 group-hover:text-red-600 transition-colors">{item.label}</span>
              {item.trend && item.value > 0 && (
                item.trend === 'up' ? 
                <ArrowUpRight className="w-3.5 h-3.5 text-green-500" /> : 
                <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
              )}
            </div>
            <span className={cn(
              "text-sm font-black text-gray-900 font-mono tracking-tighter",
              item.value < 0 && "text-red-600"
            )}>
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
      {total !== undefined && (
        <div className="pt-6 mt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total {title}</span>
          <span className="text-lg font-black text-gray-900 underline underline-offset-4 decoration-red-100 decoration-2">{formatCurrency(total)}</span>
        </div>
      )}
    </div>
  );
}
