import React from 'react';
import { motion } from 'motion/react';
import { Info, Users, Globe, Target, Award } from 'lucide-react';
import LandingBottomNav from '../components/LandingBottomNav';
import { Logo } from '../components/Logo';

export default function About() {
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-red-600 text-white pt-20 pb-24 px-6 text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase">KDKMP Digital</h1>
          <p className="text-red-100 max-w-2xl mx-auto font-medium">
            Memudahkan pengurus koperasi dalam manajemen anggota dan penagihan iuran secara otomatis melalui teknologi digital yang transparan dan akurat.
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 -mt-12">
        <div className="bg-white rounded-[3rem] shadow-xl p-8 md:p-12 space-y-12 border border-gray-100">
          <section className="space-y-6">
            <div className="flex items-center gap-4 text-red-600">
              <div className="p-3 bg-red-50 rounded-2xl">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Visi Kami</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              Menjadi platform digital nomor satu dalam memberdayakan koperasi desa di seluruh Indonesia, menciptakan kemandirian ekonomi dari desa untuk negeri.
            </p>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4 text-red-600">
              <div className="p-3 bg-red-50 rounded-2xl">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Misi Kami</h2>
            </div>
            <ul className="grid gap-4">
              <MisiItem text="Digitalisasi seluruh proses administrasi koperasi desa agar lebih cepat dan efisien." />
              <MisiItem text="Menyediakan sistem pelaporan keuangan yang transparan dan dapat dipertanggungjawabkan." />
              <MisiItem text="Memudahkan komunikasi antara pengurus koperasi dan anggota melalui fitur pesan terintegrasi." />
              <MisiItem text="Mendorong inklusi keuangan warga desa melalui sistem simpan pinjam digital yang aman." />
            </ul>
          </section>

          <section className="pt-12 border-t border-gray-50 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <Logo size="lg" />
            <div className="flex flex-col">
              <div className="flex flex-col mb-2">
                <span className="font-black text-xl text-gray-900 leading-none uppercase">KDKMP</span>
                <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase">Digital</span>
              </div>
              <p className="text-gray-500 font-medium">Platform ini dikembangkan khusus untuk mendukung pertumbuhan ekonomi rakyat desa demi masa depan Indonesia yang lebih cerah.</p>
            </div>
          </section>
        </div>
      </main>

      <LandingBottomNav />
    </div>
  );
}

function MisiItem({ text }: { text: string }) {
  return (
    <li className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-red-100 transition-all">
      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5">
        <Award className="w-3.5 h-3.5" />
      </div>
      <p className="text-gray-700 font-bold leading-relaxed">{text}</p>
    </li>
  );
}
