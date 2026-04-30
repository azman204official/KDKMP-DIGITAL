import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check, MapPin, Building, User, Target, QrCode } from 'lucide-react';
import LandingBottomNav from '../components/LandingBottomNav';
import { toast } from 'react-hot-toast';
import { auth, createUserWithEmailAndPassword } from '../lib/firebase';
import localDb from '../lib/localDb';
import { Logo } from '../components/Logo';

// ... (PROVINCES_DATA remains same)

const STEPS = [
  { id: 1, title: 'Peran', icon: <Target className="w-5 h-5" /> },
  { id: 2, title: 'Akun', icon: <User className="w-5 h-5" /> },
  { id: 3, title: 'Wilayah', icon: <MapPin className="w-5 h-5" /> },
  { id: 4, title: 'Data Koperasi', icon: <Building className="w-5 h-5" /> },
  { id: 5, title: 'Verifikasi', icon: <Check className="w-5 h-5" /> }
];

const PROVINCES_DATA = [
  { id: '11', name: 'Aceh' },
  { id: '12', name: 'Sumatera Utara' },
  { id: '13', name: 'Sumatera Barat' },
  { id: '14', name: 'Riau' },
  { id: '21', name: 'Kepulauan Riau' },
  { id: '15', name: 'Jambi' },
  { id: '16', name: 'Sumatera Selatan' },
  { id: '19', name: 'Kepulauan Bangka Belitung' },
  { id: '17', name: 'Bengkulu' },
  { id: '18', name: 'Lampung' },
  { id: '36', name: 'Banten' },
  { id: '31', name: 'DKI Jakarta' },
  { id: '32', name: 'Jawa Barat' },
  { id: '33', name: 'Jawa Tengah' },
  { id: '34', name: 'DI Yogyakarta' },
  { id: '35', name: 'Jawa Timur' },
  { id: '51', name: 'Bali' },
  { id: '52', name: 'Nusa Tenggara Barat' },
  { id: '53', name: 'Nusa Tenggara Timur' },
  { id: '61', name: 'Kalimantan Barat' },
  { id: '62', name: 'Kalimantan Tengah' },
  { id: '63', name: 'Kalimantan Selatan' },
  { id: '64', name: 'Kalimantan Timur' },
  { id: '65', name: 'Kalimantan Utara' },
  { id: '71', name: 'Sulawesi Utara' },
  { id: '75', name: 'Gorontalo' },
  { id: '72', name: 'Sulawesi Tengah' },
  { id: '76', name: 'Sulawesi Barat' },
  { id: '73', name: 'Sulawesi Selatan' },
  { id: '74', name: 'Sulawesi Tenggara' },
  { id: '81', name: 'Maluku' },
  { id: '82', name: 'Maluku Utara' },
  { id: '94', name: 'Papua' },
  { id: '91', name: 'Papua Barat' },
  { id: '95', name: 'Papua Barat Daya' },
  { id: '96', name: 'Papua Selatan' },
  { id: '97', name: 'Papua Tengah' },
  { id: '98', name: 'Papua Pegunungan' }
];

export default function RegisterKoperasi() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillKoperasiId = searchParams.get('koperasiId');
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'admin_koperasi' | 'anggota' | null>(prefillKoperasiId ? 'anggota' : null);
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    email: '',
    password: '',
    hp: '',
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
    desa: '',
    namaKoperasi: '',
    badanHukum: '',
    alamat: '',
    ketua: '',
    rekening: '',
    targetKoperasiId: prefillKoperasiId || '',
    lat: null as number | null,
    lng: null as number | null,
  });

  useEffect(() => {
    if (prefillKoperasiId) {
      const fetchKop = async () => {
        const kop = await localDb.koperasi.get(prefillKoperasiId);
        if (kop) {
          toast.success(`Anda akan mendaftar ke: ${kop.nama}`);
        }
      };
      
      fetchKop();
    }
  }, [prefillKoperasiId]);

  // Location Data States
  const [provinces, setProvinces] = useState<any[]>(PROVINCES_DATA);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [availableKoperasi, setAvailableKoperasi] = useState<any[]>([]);

  React.useEffect(() => {
    if (selectedRole === 'anggota' && step === 4) {
      const fetchKoperasiData = async () => {
        try {
          const kopListFull = await localDb.koperasi.toArray();
          
          let kopList = [...kopListFull];
          
          const selectedProv = provinces.find(p => p.id === formData.provinsi);
          
          // Improved filtering with soft matching
          const clean = (s: any) => {
            if (!s) return '';
            return String(s).toLowerCase()
              .replace(/provinsi|kabupaten|kota|kecamatan|kelurahan|desa|kab\.|kec\.|prov\./g, '')
              .replace(/[^a-z0-9]/g, '')
              .trim();
          };

          const sPId = String(formData.provinsi || '').toLowerCase().trim();
          const sKId = String(formData.kabupaten || '').toLowerCase().trim();

          const selProvName = provinces.find(p => p.id === formData.provinsi)?.name || formData.provinsi;
          const selKabName = regencies.find(r => r.id === formData.kabupaten)?.name || formData.kabupaten;
          const selKecName = districts.find(d => d.id === formData.kecamatan)?.name || formData.kecamatan;
          const selDesaName = villages.find(v => v.id === formData.desa)?.name || formData.desa;

          const sP = clean(selProvName);
          const sK = clean(selKabName);
          const sKec = clean(selKecName);
          const sD = clean(selDesaName);

          const rankedKops = kopList.map(kop => {
            const rawP = String(kop.provinsi || '').toLowerCase().trim();
            const rawK = String(kop.kabupaten || '').toLowerCase().trim();
            const rawKec = String(kop.kecamatan || '').toLowerCase().trim();
            const rawD = String(kop.desa || '').toLowerCase().trim();
            const rawName = String(kop.nama || '').toLowerCase().trim();

            const kP = clean(rawP);
            const kK = clean(rawK);
            const kKec = clean(rawKec);
            const kD = clean(rawD);
            const kN = clean(rawName);

            // Strict location matching: 
            // Cooperative MUST match the selected Province and Regency if they are selected.
            const pMatch = !formData.provinsi || (kP === sP || rawP === sPId);
            const kMatch = !formData.kabupaten || (kK === sK || rawK === sKId);

            if (!pMatch || !kMatch) return null;

            let score = 0;
            if (kP === sP) score += 10;
            if (kK === sK) score += 20;
            if (sKec && kKec === sKec) score += 30;
            if (sD && kD === sD) score += 40;
            
            // Substring bonus
            if (sK && rawK.includes(sK)) score += 5;
            if (sKec && rawKec.includes(sKec)) score += 5;
            if (sD && rawD.includes(sD)) score += 5;

            return { ...kop, score };
          })
          .filter(k => k !== null && k.score >= 10) // Must at least match Province or Regency
          .sort((a: any, b: any) => b.score - a.score);

          setAvailableKoperasi(rankedKops);
        } catch (err) {
          console.error("Error fetching Koperasi", err);
        }
      }
      fetchKoperasiData();
    }
  }, [step, selectedRole, formData.provinsi, formData.kabupaten, formData.kecamatan, formData.desa, provinces, regencies, districts, villages]);

  const fetchLocation = async (type: 'provinces' | 'regencies' | 'districts' | 'villages', id?: string) => {
    const urls = {
      provinces: [
        'https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json',
        'https://ibnux.github.io/data-indonesia/provinsi.json'
      ],
      regencies: [
        `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${id}.json`,
        `https://ibnux.github.io/data-indonesia/kabupaten/${id}.json`
      ],
      districts: [
        `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${id}.json`,
        `https://ibnux.github.io/data-indonesia/kecamatan/${id}.json`
      ],
      villages: [
        `https://emsifa.github.io/api-wilayah-indonesia/api/villages/${id}.json`,
        `https://ibnux.github.io/data-indonesia/kelurahan/${id}.json`
      ]
    };

    let lastErr;
    for (const url of urls[type]) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.map((d: any) => ({
          id: d.id,
          name: (d.name || d.nama).split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        }));
      } catch (err) {
        lastErr = err;
        console.warn(`Failed to fetch from ${url}, trying fallback...`, err);
      }
    }
    throw lastErr;
  };

  // Fetch Provinces
  React.useEffect(() => {
    if (step === 2) {
      setLoadingLocation(true);
      fetchLocation('provinces')
        .then(apiProvinces => {
          const merged = [...apiProvinces];
          PROVINCES_DATA.forEach(p => {
            if (!merged.find(m => m.id === p.id)) merged.push(p);
          });
          setProvinces(merged);
        })
        .catch(() => setProvinces(PROVINCES_DATA))
        .finally(() => setLoadingLocation(false));
    }
  }, [step]);

  // Fetch Regencies
  React.useEffect(() => {
    if (formData.provinsi) {
      setLoadingLocation(true);
      fetchLocation('regencies', formData.provinsi)
        .then(data => {
          setRegencies(data);
          setDistricts([]);
          setVillages([]);
          updateFormData({ kabupaten: '', kecamatan: '', desa: '' });
        })
        .catch(err => {
          console.error("Error fetching regencies:", err);
          toast.error("Gagal memuat data kabupaten/kota. Periksa koneksi internet Anda.");
        })
        .finally(() => setLoadingLocation(false));
    }
  }, [formData.provinsi]);

  // Fetch Districts
  React.useEffect(() => {
    if (formData.kabupaten) {
      setLoadingLocation(true);
      fetchLocation('districts', formData.kabupaten)
        .then(data => {
          setDistricts(data);
          setVillages([]);
          updateFormData({ kecamatan: '', desa: '' });
        })
        .catch(err => {
          console.error("Error fetching districts:", err);
          toast.error("Gagal memuat data kecamatan. Periksa koneksi internet Anda.");
        })
        .finally(() => setLoadingLocation(false));
    }
  }, [formData.kabupaten]);

  // Fetch Villages
  React.useEffect(() => {
    if (formData.kecamatan) {
      setLoadingLocation(true);
      fetchLocation('villages', formData.kecamatan)
        .then(data => {
          setVillages(data);
          updateFormData({ desa: '' });
        })
        .catch(err => {
          console.error("Error fetching villages:", err);
          toast.error("Gagal memuat data desa/kelurahan. Periksa koneksi internet Anda.");
        })
        .finally(() => setLoadingLocation(false));
    }
  }, [formData.kecamatan]);

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return !!selectedRole;
      case 2:
        return !!(formData.nama && formData.nik && formData.nik.length === 16 && formData.hp && formData.email && formData.password);
      case 3:
        return !!(formData.provinsi && formData.kabupaten && formData.kecamatan && formData.desa);
      case 4:
        if (selectedRole === 'admin_koperasi') {
          return !!(formData.namaKoperasi && formData.ketua && formData.rekening && formData.alamat);
        } else {
          return !!(formData.targetKoperasiId && formData.alamat);
        }
      case 5:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!isStepValid()) {
      toast.error('Mohon lengkapi semua data yang wajib diisi.');
      return;
    }
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    if (!formData.email || !formData.password || !formData.nama) {
      toast.error('Mohon lengkapi data akun Anda.');
      return;
    }

    if (selectedRole === 'admin_koperasi' && !formData.namaKoperasi) {
      toast.error('Mohon lengkapi data koperasi Anda.');
      return;
    }

    if (selectedRole === 'anggota' && !formData.targetKoperasiId) {
      toast.error('Mohon pilih koperasi tujuan Anda.');
      return;
    }

    setIsSubmitting(true);
    const registrationId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Resolve IDs to names for locations
      const selectedProvName = provinces.find(p => p.id === formData.provinsi)?.name || formData.provinsi;
      const selectedKabName = regencies.find(r => r.id === formData.kabupaten)?.name || formData.kabupaten;
      const selectedKecName = districts.find(d => d.id === formData.kecamatan)?.name || formData.kecamatan;
      const selectedDesaName = villages.find(v => v.id === formData.desa)?.name || formData.desa;

      const finalFormData = {
        ...formData,
        provinsi: selectedProvName,
        kabupaten: selectedKabName,
        kecamatan: selectedKecName,
        desa: selectedDesaName,
      };

      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const targetKop = availableKoperasi.find(k => k.id === formData.targetKoperasiId);

      // 2. Create User Profile
      let koperasiId = selectedRole === 'anggota' ? formData.targetKoperasiId : `kop_${formData.desa || 'id'}_${Date.now()}`;
      
      try {
        await localDb.users.put({
          uid: user.uid,
          email: formData.email,
          displayName: formData.nama,
          nik: formData.nik,
          role: selectedRole,
          koperasiId: koperasiId,
          koperasiName: selectedRole === 'anggota' ? (targetKop?.nama || null) : (formData.namaKoperasi || null),
          status: selectedRole === 'admin_koperasi' ? 'active' : 'inactive' // Admin auto-approve, Anggota need verification
        });
        
        if (selectedRole === 'admin_koperasi') {
           await localDb.koperasi.add({
             id: koperasiId,
             nama: formData.namaKoperasi || '',
             kabupaten: formData.kabupaten || '',
             kecamatan: formData.kecamatan || '',
             desa: formData.desa || '',
             provinsi: formData.provinsi || '',
             status: 'active',
             alamat: formData.alamat,
             rekening: formData.rekening,
             nomorBadanHukum: formData.badanHukum,
             createdAt: new Date().toISOString(),
             updatedAt: new Date().toISOString()
           });
        }
      } catch (err: any) {
        console.error('Error creating user profile or koperasi:', err);
      }

      // 3. Create Registration Document
      try {
        await localDb.registrations.put({
          id: registrationId,
          uid: user.uid, 
          role: selectedRole as any,
          ...finalFormData,
          targetKoperasiName: targetKop?.nama || null,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error('Error creating registration doc:', err);
      }

      // Notify Super Admin
      try {
        await localDb.notifications.put({
          title: 'Pendaftaran Baru',
          message: `${formData.nama} mendaftar sebagai ${selectedRole === 'admin_koperasi' ? 'Admin Koperasi' : 'Anggota'}${selectedRole === 'admin_koperasi' ? ` (${formData.namaKoperasi})` : ''}.`,
          type: 'info',
          targetRole: 'super_admin',
          createdAt: new Date().toISOString(),
          link: '/registrations', 
          isRead: false
        });
      } catch (err: any) {
        console.warn('Failed to notify super admin:', err);
      }

      toast.success('Pendaftaran berhasil! Akun Anda telah dibuat. Silakan tunggu verifikasi admin untuk mengaktifkan akses.');
      await auth.signOut();
      navigate('/login');
    } catch (error: any) {
      console.error('Error submitting registration:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email sudah terdaftar. Silakan gunakan email lain.');
      } else {
        toast.error('Pendaftaran gagal. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <Logo size="md" />
          <div className="flex flex-col">
            <span className="font-black text-xl text-gray-900 leading-none uppercase">KDKMP</span>
            <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase">Digital</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-8">
          {STEPS.map((s) => (
            <div key={s.id} className={`flex items-center gap-2 transition-all ${step >= s.id ? 'text-red-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s.id ? 'bg-red-600 text-white' : 'bg-gray-100'}`}>
                {step > s.id ? <Check className="w-5 h-5" /> : s.icon}
              </div>
              <span className="font-bold text-sm tracking-wide uppercase">{s.title}</span>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/login')} className="text-sm font-bold text-gray-500 hover:text-red-600">Batal</button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden pb-32">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>

        <motion.div 
          layout
          className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden relative z-10"
        >
          <div className="p-5 sm:p-8 md:p-12">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Pilih Peran Anda</h2>
                    <p className="text-gray-500">Aplikasi menyesuaikan fitur berdasarkan peran Anda.</p>
                  </div>
                  
                  <div className="grid gap-4">
                    <button 
                      onClick={() => setSelectedRole('admin_koperasi')}
                      className={`w-full p-6 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${selectedRole === 'admin_koperasi' ? 'border-red-600 bg-red-50' : 'border-gray-100 hover:border-red-600'}`}
                    >
                      <div>
                        <h3 className={`font-bold text-lg ${selectedRole === 'admin_koperasi' ? 'text-red-700' : 'text-gray-900 group-hover:text-red-700'}`}>Pengurus Koperasi</h3>
                        <p className="text-sm text-gray-500">Mengelola anggota, simpanan, dan laporan desa</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedRole === 'admin_koperasi' ? 'border-red-600 bg-red-600' : 'border-gray-200'}`}>
                        {selectedRole === 'admin_koperasi' && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </button>

                    <button 
                      onClick={() => setSelectedRole('anggota')}
                      className={`w-full p-6 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${selectedRole === 'anggota' ? 'border-red-600 bg-red-50' : 'border-gray-100 hover:border-red-600'}`}
                    >
                      <div>
                        <h3 className={`font-bold text-lg ${selectedRole === 'anggota' ? 'text-red-700' : 'text-gray-900 group-hover:text-red-700'}`}>Anggota</h3>
                        <p className="text-sm text-gray-500">Melihat simpanan dan melakukan pembayaran</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedRole === 'anggota' ? 'border-red-600 bg-red-600' : 'border-gray-200'}`}>
                        {selectedRole === 'anggota' && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Buat Akun {selectedRole === 'admin_koperasi' ? 'Manager' : 'Anggota'}</h2>
                    <p className="text-gray-500">Isi data akun Anda untuk mengakses platform.</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField label="Nama Lengkap" placeholder="Budi Santoso" value={formData.nama} onChange={v => updateFormData({ nama: v })} />
                    <InputField label="NIK (KTP)" placeholder="16 digit NIK" value={formData.nik} onChange={v => updateFormData({ nik: v.replace(/\D/g, '') })} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField label="Nomor HP" placeholder="0812..." value={formData.hp} onChange={v => updateFormData({ hp: v })} />
                    <InputField label="Email" placeholder="budi@example.com" value={formData.email} onChange={v => updateFormData({ email: v })} />
                  </div>
                  <InputField label="Password" type="password" placeholder="********" value={formData.password} onChange={v => updateFormData({ password: v })} />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Pilih Wilayah</h2>
                    <p className="text-gray-500">Tentukan lokasi desa/kelurahan koperasi Anda.</p>
                  </div>
                  <div className="space-y-4">
                    <SelectField 
                      label="Provinsi" 
                      value={formData.provinsi}
                      options={[...provinces].sort((a,b) => a.name.localeCompare(b.name))} 
                      onChange={v => updateFormData({ provinsi: v })} 
                    />
                    <SelectField 
                      label="Kabupaten / Kota" 
                      value={formData.kabupaten}
                      disabled={!formData.provinsi || loadingLocation}
                      options={regencies} 
                      onChange={v => updateFormData({ kabupaten: v })} 
                    />
                    <SelectField 
                      label="Kecamatan" 
                      value={formData.kecamatan}
                      disabled={!formData.kabupaten || loadingLocation}
                      options={districts} 
                      onChange={v => updateFormData({ kecamatan: v })} 
                    />
                    <SelectField 
                      label="Desa / Kelurahan" 
                      value={formData.desa}
                      disabled={!formData.kecamatan || loadingLocation}
                      options={villages} 
                      onChange={v => updateFormData({ desa: v })} 
                    />
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {selectedRole === 'admin_koperasi' ? (
                    <>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Informasi Koperasi</h2>
                        <p className="text-gray-500">Berikan detail resmi koperasi Desa/Kelurahan Anda.</p>
                      </div>
                      <InputField label="Nama Koperasi" placeholder="Koperasi Desa Sukamaju (KDKMP)" value={formData.namaKoperasi} onChange={v => updateFormData({ namaKoperasi: v })} />
                      <div className="grid md:grid-cols-2 gap-4">
                        <InputField label="Nomor Badan Hukum" placeholder="33.16.05.2003" value={formData.badanHukum} onChange={v => updateFormData({ badanHukum: v })} />
                        <InputField label="Ketua Koperasi" placeholder="Drs. Mulyono" value={formData.ketua} onChange={v => updateFormData({ ketua: v })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">Detail Alamat (Jalan, No Rumah, Patokan) <span className="text-red-500">*</span></label>
                        <textarea 
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                          placeholder="Alamat Lengkap Kantor Koperasi"
                          rows={3}
                          value={formData.alamat}
                          onChange={e => updateFormData({ alamat: e.target.value })}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <InputField label="Nomor Rekening Koperasi" placeholder="123-456-789" value={formData.rekening} onChange={v => updateFormData({ rekening: v })} />
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-gray-700">QR Pembayaran (QRIS)</label>
                          <button className="w-full bg-gray-50 border border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center justify-center gap-2 hover:border-red-600 hover:bg-gray-100 transition-all">
                            <QrCode className="w-8 h-8 text-gray-400" />
                            <span className="text-xs font-bold text-gray-500">Klik untuk upload QR</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">Titik Lokasi Kantor (Opsional)</label>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => {
                              if (!navigator.geolocation) {
                                toast.error('Browser Anda tidak mendukung GPS');
                                return;
                              }
                              toast.loading('Mencari posisi anda...');
                              navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                  updateFormData({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                  toast.dismiss();
                                  toast.success('Lokasi berhasil dikunci');
                                },
                                (err) => {
                                  toast.dismiss();
                                  toast.error('Gagal mengambil lokasi. Pastikan izin GPS aktif.');
                                }
                              );
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold ${formData.lat ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-red-600'}`}
                          >
                            <MapPin className="w-5 h-5" /> {formData.lat ? 'Lokasi Terkunci' : 'Kunci Lokasi Kantor Sekarang'}
                          </button>
                        </div>
                        {formData.lat && (
                          <p className="text-[10px] font-bold text-gray-400 mt-1">
                            Koordinat: {formData.lat.toFixed(6)}, {formData.lng?.toFixed(6)}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Building className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Pilih Koperasi</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2">
                          Pilih koperasi yang tersedia di wilayah pendaftaran Anda.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Koperasi Tujuan <span className="text-red-500">*</span></label>
                          <p className="text-[10px] text-gray-400 font-medium italic mb-2">Tips: Gunakan menu dropdown di bawah untuk memilih koperasi yang terdaftar.</p>
                          <select 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none font-bold shadow-sm"
                            value={formData.targetKoperasiId}
                            onChange={(e) => updateFormData({ targetKoperasiId: e.target.value })}
                          >
                            <option value="">-- Pilih Koperasi --</option>
                            {availableKoperasi.length === 0 ? (
                              <option value="" disabled>Tidak ada koperasi terdaftar di wilayah Anda</option>
                            ) : (
                              availableKoperasi.map((kop) => (
                                <option key={kop.id} value={kop.id}>
                                  {kop.nama} {kop.kecamatan ? `(${kop.kecamatan})` : ''}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                        {availableKoperasi.length === 0 && (
                          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-2">
                            <p className="text-xs font-bold text-orange-700 underline">
                              Koperasi Tidak Ditemukan?
                            </p>
                            <p className="text-[10px] text-orange-600 leading-relaxed italic">
                              Kami sedang memfilter berdasarkan <strong>{(regencies.find(r => r.id === formData.kabupaten)?.name || formData.kabupaten) || 'wilayah terpilih'}</strong>.
                            </p>
                            <p className="text-[10px] text-orange-600 leading-relaxed font-bold">
                              PENTING: Jika Anda Pengurus Koperasi, pastikan Anda sudah mengatur "Provinsi" dan "Kabupaten" di Pengaturan Profil Koperasi Anda agar anggota dapat menemukan koperasi Anda.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">Detail Alamat (Jalan, No Rumah, Patokan) <span className="text-red-500">*</span></label>
                        <textarea 
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
                          placeholder="Contoh: Jl. Merdeka No. 12, Samping Masjid Al-Ikhlas"
                          rows={3}
                          value={formData.alamat}
                          onChange={e => updateFormData({ alamat: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700">Titik Lokasi GPS (Opsional)</label>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => {
                              if (!navigator.geolocation) {
                                toast.error('Browser Anda tidak mendukung GPS');
                                return;
                              }
                              toast.loading('Mencari posisi anda...');
                              navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                  updateFormData({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                  toast.dismiss();
                                  toast.success('Lokasi berhasil dikunci');
                                },
                                (err) => {
                                  toast.dismiss();
                                  toast.error('Gagal mengambil lokasi. Pastikan izin GPS aktif.');
                                }
                              );
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold ${formData.lat ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-red-600'}`}
                          >
                            <MapPin className="w-5 h-5" /> {formData.lat ? 'Lokasi Terkunci' : 'Kunci Lokasi Saat Ini'}
                          </button>
                        </div>
                        {formData.lat && (
                          <p className="text-[10px] font-bold text-gray-400 mt-1">
                            Koordinat: {formData.lat.toFixed(6)}, {formData.lng?.toFixed(6)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Konfirmasi Data</h2>
                  <p className="text-gray-500">Periksa kembali data Anda sebelum mengajukan pendaftaran.</p>
                  
                  <div className="bg-gray-50 p-6 rounded-2xl text-left space-y-2 border border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Peran:</span>
                      <span className="font-bold text-gray-900">{selectedRole === 'admin_koperasi' ? 'Pengurus Koperasi' : 'Anggota'}</span>
                    </div>
                    {selectedRole === 'admin_koperasi' && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Koperasi:</span>
                        <span className="font-bold text-gray-900">{formData.namaKoperasi || '-'}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Wilayah:</span>
                      <span className="font-bold text-gray-900">{formData.desa || '-'}, {formData.kecamatan || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nama:</span>
                      <span className="font-bold text-gray-900">{formData.nama || '-'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-center text-gray-400 mt-6 leading-relaxed">
                    Dengan mendaftar, Anda menyetujui Syarat dan Ketentuan penggunaan platform KDKMP Digital sebagai wadah manajemen koperasi desa yang sah.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 sm:mt-12 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 border-t border-gray-100 pt-6 sm:pt-8 w-full">
              {step > 1 && (
                <button 
                  onClick={prevStep}
                  className="flex items-center justify-center gap-2 font-bold px-4 sm:px-6 py-3.5 sm:py-3 rounded-xl transition-all w-full sm:w-auto text-gray-700 bg-gray-100 sm:bg-transparent hover:bg-gray-200 sm:hover:bg-gray-100 mr-auto"
                >
                  <ChevronLeft className="w-5 h-5" /> Sebelumnya
                </button>
              )}
              
              <button 
                onClick={step === 5 ? handleSubmit : nextStep}
                disabled={isSubmitting || (step < 5 && !isStepValid())}
                className={`flex items-center justify-center gap-2 font-bold px-4 sm:px-8 py-3.5 sm:py-3 rounded-xl transition-all shadow-xl w-full sm:w-auto ${
                  (isSubmitting || (step < 5 && !isStepValid())) 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'
                }`}
              >
                {step === 5 ? (isSubmitting ? 'Mengirim...' : 'Ajukan Sekarang') : 'Lanjutkan'} <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </main>
      <LandingBottomNav />
    </div>
  );
}

function InputField({ label, placeholder, type = 'text', value, onChange, required = true }: { label: string, placeholder: string, type?: string, value?: string, onChange?: (v: string) => void, required?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-bold text-gray-700 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        type={type}
        required={required}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({ label, options, value, disabled, onChange, required = true }: { label: string, options: any[], value?: string, disabled?: boolean, onChange?: (v: string) => void, required?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-bold text-gray-700 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select 
        value={value}
        required={required}
        disabled={disabled}
        onChange={e => onChange?.(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none disabled:opacity-50"
      >
        <option value="">Pilih {label}</option>
        {options.map(o => (
          <option key={o.id || o} value={o.id || o}>{o.name || o}</option>
        ))}
      </select>
    </div>
  );
}
