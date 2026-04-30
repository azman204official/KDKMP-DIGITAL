import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, BookOpen, Settings, Users, CreditCard, MessageSquare, ChevronRight } from 'lucide-react';
import LandingBottomNav from '../components/LandingBottomNav';

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-16 pb-12 px-6 text-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Pusat Bantuan</h1>
          <p className="text-gray-500 font-bold">Panduan lengkap penggunaan aplikasi KDKMP Digital.</p>
        </motion.div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Admin Guide */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Panduan Akun Admin</h2>
          </div>
          <div className="grid gap-4">
            <HelpCard 
              title="Cara Aktivasi Koperasi" 
              desc="Setelah daftar, tunggu persetujuan Super Admin. Status koperasi akan aktif otomatis setelah disetujui." 
              step="1"
            />
            <HelpCard 
              title="Mengelola Anggota" 
              desc="Masuk ke menu Anggota, tambahkan anggota satu per satu atau gunakan fitur undang anggota." 
              step="2"
            />
            <HelpCard 
              title="Verifikasi Pembayaran" 
              desc="Lihat menu 'Bayar' untuk memproses bukti transfer dari anggota. Klik centang untuk setujui atau silang untuk tolak." 
              step="3"
            />
            <HelpCard 
              title="Mengirim Pengingat" 
              desc="Gunakan tombol 'Kirim Pengingat' di menu pembayaran untuk kirim pesan otomatis ke WA anggota yang belum bayar." 
              step="4"
            />
          </div>
        </section>

        {/* Member Guide */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Panduan Akun Anggota</h2>
          </div>
          <div className="grid gap-4">
            <HelpCard 
              title="Pendaftaran Anggota" 
              desc="Gunakan menu pendaftaran, pilih koperasi desa Anda, dan lengkapi data profil dengan benar." 
              step="1"
            />
            <HelpCard 
              title="Cara Bayar Simpanan" 
              desc="Pilih 'Lakukan Pembayaran', masukkan nominal, lalu unggah bukti transfer ATM/Mobile Banking." 
              step="2"
            />
            <HelpCard 
              title="Cek Status Simpanan" 
              desc="Buka dashboard anggota untuk melihat total simpanan pokok, wajib, dan sukarela yang sudah diverifikasi." 
              step="3"
            />
            <HelpCard 
              title="Hubungi Pengurus" 
              desc="Gunakan fitur chat di dalam aplikasi untuk berkomunikasi langsung dengan admin koperasi Anda." 
              step="4"
            />
          </div>
        </section>

        {/* Installation Guide */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-2xl">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Panduan Instalasi</h2>
          </div>
          <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-12">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-lg shadow-black/20">1</span>
                <div>
                  <h3 className="font-black text-xl text-gray-900">Perangkat Android</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Menggunakan Google Chrome</p>
                </div>
              </div>
              <div className="grid gap-6 ml-6 sm:ml-6 border-l-2 border-gray-100 pl-8">
                <InstallStep 
                  text={<span>Buka aplikasi browser <span className="font-bold text-gray-900">Chrome</span> di HP Anda dan akses alamat KDKMP Digital.</span>}
                />
                <InstallStep 
                  text={<span>Ketuk ikon <span className="font-bold text-gray-900">titik tiga (⋮)</span> yang terletak di pojok kanan atas browser.</span>}
                />
                <InstallStep 
                  text={<span>Cari dan pilih menu <span className="font-bold text-gray-900 text-red-600">"Instal aplikasi"</span> atau <span className="font-bold text-gray-900">"Tambahkan ke Layar utama"</span>.</span>}
                />
                <InstallStep 
                  text="Konfirmasi dengan klik 'Instal' dan aplikasi akan muncul secara otomatis di daftar aplikasi atau layar utama ponsel Anda."
                />
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent w-full"></div>

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-lg shadow-blue-600/20">2</span>
                <div>
                  <h3 className="font-black text-xl text-gray-900">Perangkat iPhone / iPad</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Menggunakan Safari Browser</p>
                </div>
              </div>
              <div className="grid gap-6 ml-6 sm:ml-6 border-l-2 border-gray-100 pl-8">
                <InstallStep 
                  text={<span>Buka browser <span className="font-bold text-gray-900 text-blue-600">Safari</span> dan kunjungi situs KDKMP Digital.</span>}
                />
                <InstallStep 
                  text={<span>Ketuk tombol <span className="font-bold text-gray-900">Share</span> (ikon kotak dengan tanda panah ke arah atas) di bagian bawah layar.</span>}
                />
                <InstallStep 
                  text={<span>Gulir menu ke bawah dan pilih opsi <span className="font-bold text-gray-900 text-blue-600">"Add to Home Screen"</span> atau <span className="font-bold text-gray-900">"Tambah ke Layar Utama"</span>.</span>}
                />
                <InstallStep 
                  text="Klik 'Add' di pojok kanan atas untuk menyelesaikan proses pemasangan aplikasi."
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - Quick Links */}
        <section className="bg-red-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-red-200">
          <h2 className="text-2xl font-black mb-6">Butuh Bantuan Lebih Lanjut?</h2>
          <div className="grid gap-3">
            <a href="https://wa.me/628123456789" target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-between transition-all group">
              <span className="font-bold">Hubungi Customer Support WA</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="mailto:support@kdkmp.com" className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-between transition-all group">
              <span className="font-bold">Kirim Email ke IT Support</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </section>
      </main>

      <LandingBottomNav />
    </div>
  );
}

function HelpCard({ title, desc, step }: { title: string, desc: string, step: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex gap-6 hover:shadow-md transition-all">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-gray-400 text-lg flex-shrink-0">
        {step}
      </div>
      <div>
        <h3 className="font-extrabold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm font-medium text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function InstallStep({ text }: { text: React.ReactNode }) {
  return (
    <div className="relative group">
      <div className="absolute -left-[1.58rem] top-2 w-2.5 h-2.5 bg-white border-2 border-gray-200 rounded-full group-hover:border-red-400 transition-colors z-10"></div>
      <p className="text-sm font-medium text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}
