import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, TrendingUp, Users, Loader2 } from 'lucide-react';
import { Logo } from './Logo';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 500); // Tunggu animasi exit
    }, 5000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-between overflow-hidden font-sans"
        >
          {/* Top Decoration */}
          <div className="absolute top-0 left-0 w-full h-32 overflow-hidden pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-red-600/10 to-transparent" />
             <motion.div 
               initial={{ x: -100, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               className="absolute top-0 left-0 w-64 h-32 bg-red-600/5 rounded-full -translate-x-20 -translate-y-10 blur-3xl"
             />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 pt-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
              className="relative mb-6"
            >
              <Logo size="xl" />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <h1 className="text-6xl font-black text-[#0A1D37] tracking-tight mb-2">
                KDKMP
              </h1>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-[3px] w-6 bg-red-600" />
                <span className="text-3xl font-bold text-red-600 tracking-[0.1em] uppercase">Digital</span>
                <div className="h-[3px] w-6 bg-red-600" />
              </div>
              <p className="text-lg text-gray-500 font-medium leading-tight max-w-[280px] mx-auto">
                Koperasi Desa/Kelurahan Merah Putih Digital
              </p>
            </motion.div>
          </div>

          {/* Footer Section */}
          <div className="relative w-full h-80 overflow-hidden flex flex-col items-center justify-end pb-12">
            {/* Village Illustration in Waves */}
            <div className="absolute inset-0 w-full h-full pointer-events-none opacity-100">
              <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full text-red-600 fill-current translate-y-10">
                <path d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128V320H0Z"></path>
              </svg>
              {/* Village outline on top of the wave */}
              <div className="absolute bottom-[130px] left-0 w-full flex justify-center opacity-80 scale-125">
                <div className="flex items-end gap-0.5">
                  <div className="w-10 h-8 bg-white/20 border-t-2 border-x-2 border-white rounded-t-sm" />
                  <div className="w-14 h-14 bg-white/30 border-t-2 border-x-2 border-white rounded-t-sm relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-white" />
                  </div>
                  <div className="w-12 h-10 bg-white/20 border-t-2 border-x-2 border-white rounded-t-sm" />
                  <div className="w-8 h-6 bg-white/10 border-t-2 border-x-2 border-white rounded-t-sm" />
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-4 mb-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-[3px] border-white/20 border-t-white rounded-full"
              />
              <p className="text-white font-medium tracking-wider text-xl">
                Memuat...
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
