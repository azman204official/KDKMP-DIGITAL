import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  Zap, 
  Users, 
  CreditCard, 
  FileText 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  elementId?: string; // ID of the element to highlight
}

const STEPS: Step[] = [
  {
    title: "Selamat Datang di KDKMP Digital!",
    description: "Platform manajemen koperasi desa masa depan. Mari kami tunjukkan fitur utamanya untuk memudahkan pengelolaan koperasi Anda.",
    icon: <Zap className="w-12 h-12 text-yellow-400" />
  },
  {
    title: "Manajemen Anggota",
    description: "Di sini Anda bisa mengelola seluruh data anggota, melihat riwayat bergabung, dan memantau status keanggotaan mereka.",
    icon: <Users className="w-12 h-12 text-blue-500" />,
    elementId: "sidebar-members"
  },
  {
    title: "Verifikasi Pembayaran",
    description: "Terima dan verifikasi bukti transfer simpanan dari anggota secara real-time. Transparansi keuangan kini lebih mudah.",
    icon: <CreditCard className="w-12 h-12 text-green-500" />,
    elementId: "sidebar-payments"
  },
  {
    title: "Laporan Otomatis",
    description: "Hasilkan laporan Neraca, Laba Rugi, dan Arus Kas secara otomatis. Siap cetak untuk kebutuhan rapat tahunan.",
    icon: <FileText className="w-12 h-12 text-red-600" />,
    elementId: "sidebar-reports"
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('kdkmp-onboarding-seen');
    if (!hasSeen) {
      setTimeout(() => setIsVisible(true), 1500);
    }
  }, []);

  const close = () => {
    setIsVisible(false);
    localStorage.setItem('kdkmp-onboarding-seen', 'true');
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
    else close();
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (!isVisible) return null;

  const step = STEPS[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          onClick={close}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-[2.5rem] shadow-2xl border border-white/20 w-full max-w-lg overflow-hidden flex flex-col"
        >
          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-gray-100 flex">
            {STEPS.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex-1 transition-all duration-500",
                  i <= currentStep ? "bg-red-600" : "bg-transparent"
                )}
              />
            ))}
          </div>

          <button 
            onClick={close}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-10 pt-16 flex flex-col items-center text-center">
            <motion.div
              key={currentStep}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner"
            >
              {step.icon}
            </motion.div>
            
            <h3 className="text-2xl font-black text-gray-900 leading-tight mb-4">{step.title}</h3>
            <p className="text-gray-500 font-medium leading-relaxed mb-10 text-lg">
              {step.description}
            </p>

            <div className="w-full flex items-center justify-between gap-4 mt-auto">
              <button 
                onClick={prev}
                disabled={currentStep === 0}
                className={cn(
                  "flex items-center gap-2 font-bold px-6 py-3 rounded-2xl transition-all",
                  currentStep === 0 ? "opacity-0 cursor-default" : "text-gray-400 hover:text-gray-600 active:scale-95"
                )}
              >
                <ChevronLeft className="w-5 h-5" /> Kembali
              </button>
              
              <button 
                onClick={next}
                className="flex items-center gap-2 bg-gray-900 text-white font-bold px-10 py-4 rounded-[1.5rem] hover:bg-red-600 transition-all hover:shadow-xl hover:shadow-red-200 active:scale-95"
              >
                {currentStep === STEPS.length - 1 ? (
                  <>Selesai <CheckCircle className="w-5 h-5" /></>
                ) : (
                  <>Lanjut <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>

          <div className="px-10 py-6 bg-gray-50/50 text-center border-t border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Langkah {currentStep + 1} dari {STEPS.length}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
