import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  User, 
  CreditCard, 
  Bell, 
  ChevronRight, 
  Upload,
  QrCode,
  Shield,
  Save,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import localDb from '../../lib/localDb';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Settings() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = React.useState('profile');
  const [loading, setLoading] = React.useState(false);
  
  const koperasiDataRaw = useLiveQuery(
    () => profile?.koperasiId ? localDb.koperasi.get(profile.koperasiId) : Promise.resolve(null),
    [profile?.koperasiId]
  );
  
  const koperasiData = koperasiDataRaw || {
    name: (profile as any)?.koperasiName || 'KDKMP Digital',
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
    desa: '',
    alamat: '',
    badanHukum: '',
    tahunBerdiri: '',
  };

  const handleSave = async (data: any) => {
    if (!profile?.koperasiId) return;
    setLoading(true);
    try {
      const payload = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      if (!data.name && koperasiData?.name) {
        payload.nama = koperasiData.name;
      }

      await localDb.koperasi.update(profile.koperasiId, payload);
      if (data.location) {
        await localDb.koperasi.update(profile.koperasiId, {
           provinsi: data.location.province || '',
           kabupaten: data.location.regency || '',
           kecamatan: data.location.district || '',
           desa: data.location.village || '',
           alamat: data.address || ''
        });
      }
      toast.success('Pengaturan berhasil disimpan!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = koperasiDataRaw &&
    koperasiDataRaw.nama &&
    koperasiDataRaw.provinsi &&
    koperasiDataRaw.kabupaten &&
    koperasiDataRaw.kecamatan &&
    koperasiDataRaw.desa &&
    koperasiDataRaw.alamat &&
    koperasiDataRaw.nomorBadanHukum;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 leading-tight">Pengaturan Koperasi</h2>
        <p className="text-gray-500 font-medium mt-1">Kelola profil, struktur pengurus, dan kebijakan simpanan.</p>
      </div>

      {!isProfileComplete && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-700">
              <AlertCircle />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">Lengkapi Profil Koperasi</h4>
              <p className="text-amber-700 text-sm">Data koperasi tidak lengkap. Mohon lengkapi Profil Koperasi agar sistem berfungsi optimal.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-2">
          <SettingsTab 
            icon={<Building />} 
            label="Profil Koperasi" 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')}
          />
          <SettingsTab 
            icon={<CreditCard />} 
            label="Rekening & QR" 
            active={activeTab === 'payment'} 
            onClick={() => setActiveTab('payment')}
          />
          <SettingsTab 
            icon={<User />} 
            label="Struktur Pengurus" 
            active={activeTab === 'org'} 
            onClick={() => setActiveTab('org')}
          />
          <SettingsTab 
            icon={<Shield />} 
            label="Keamanan" 
            active={activeTab === 'security'} 
            onClick={() => setActiveTab('security')}
          />
          <SettingsTab 
            icon={<Bell />} 
            label="Notifikasi" 
            active={activeTab === 'notifications'} 
            onClick={() => setActiveTab('notifications')}
          />
        </div>

        {/* Form Area */}
        <div className="md:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <ProfileSection 
                key="profile" 
                data={koperasiData} 
                profile={profile}
                onSave={handleSave} 
                loading={loading} 
              />
            )}
            {activeTab === 'payment' && (
              <PaymentSection 
                key="payment" 
                data={koperasiData} 
                onSave={handleSave} 
                loading={loading} 
              />
            )}
            {activeTab === 'org' && (
              <PlaceholderSection 
                key="org" 
                title="Struktur Pengurus" 
                icon={<User />} 
              />
            )}
            {activeTab === 'security' && (
              <PlaceholderSection 
                key="security" 
                title="Keamanan" 
                icon={<Shield />} 
              />
            )}
            {activeTab === 'notifications' && (
              <PlaceholderSection 
                key="notifications" 
                title="Notifikasi" 
                icon={<Bell />} 
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ data, profile, onSave, loading }: { key?: string, data: any, profile: any, onSave: (data: any) => void, loading: boolean }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    badanHukum: '',
    tahunBerdiri: '',
    address: '',
    logoUrl: '',
    location: {
      province: '',
      regency: '',
      village: '',
      district: '',
    }
  });

  React.useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || '',
        badanHukum: data.badanHukum || '',
        tahunBerdiri: data.tahunBerdiri || '',
        address: data.address || '',
        logoUrl: data.logoUrl || '',
        location: {
          province: data.location?.province || '',
          regency: data.location?.regency || '',
          village: data.location?.village || '',
          district: data.location?.district || '',
        }
      });
    }
  }, [data]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 500) { // 500KB limit for base64 storage
      toast.error('Ukuran file maksimal 500KB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const [provinces, setProvinces] = React.useState<any[]>([]);
  const [regencies, setRegencies] = React.useState<any[]>([]);
  const [districts, setDistricts] = React.useState<any[]>([]);
  const [villages, setVillages] = React.useState<any[]>([]);

  const [loadingWilayah, setLoadingWilayah] = React.useState(false);

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
          name: (d.name || d.nama || '').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        }));
      } catch (err) {
        lastErr = err;
        console.warn(`Failed to fetch from ${url}, trying fallback...`, err);
      }
    }
    throw lastErr;
  };

  React.useEffect(() => {
    setLoadingWilayah(true);
    fetchLocation('provinces')
      .then(data => {
        setProvinces(data);
        setLoadingWilayah(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setLoadingWilayah(false);
      });
  }, []);

  React.useEffect(() => {
    if (formData.location.province && provinces.length > 0) {
      const prov = provinces.find(p => 
        p.id === formData.location.province || 
        (p.name && formData.location.province && p.name.toLowerCase() === formData.location.province.toLowerCase())
      );
      const provId = prov?.id;
      
      if (provId) {
        setLoadingWilayah(true);
        fetchLocation('regencies', provId)
          .then(data => {
            setRegencies(data);
            setLoadingWilayah(false);
          })
          .catch(err => {
            console.error('Fetch error regencies:', err);
            setLoadingWilayah(false);
          });
      }
    } else {
      setRegencies([]);
    }
  }, [formData.location.province, provinces]);

  React.useEffect(() => {
    if (formData.location.regency && regencies.length > 0) {
      const reg = regencies.find(r => 
        r.id === formData.location.regency || 
        (r.name && formData.location.regency && r.name.toLowerCase() === formData.location.regency.toLowerCase())
      );
      const regId = reg?.id;
      
      if (regId) {
        setLoadingWilayah(true);
        fetchLocation('districts', regId)
          .then(data => {
            setDistricts(data);
            setLoadingWilayah(false);
          })
          .catch(err => {
            console.error('Fetch error districts:', err);
            setLoadingWilayah(false);
          });
      }
    } else {
      setDistricts([]);
    }
  }, [formData.location.regency, regencies]);

  React.useEffect(() => {
    if (formData.location.district && districts.length > 0) {
      const dist = districts.find(d => 
        d.id === formData.location.district || 
        (d.name && formData.location.district && d.name.toLowerCase() === formData.location.district.toLowerCase())
      );
      const distId = dist?.id;
      
      if (distId) {
        setLoadingWilayah(true);
        fetchLocation('villages', distId)
          .then(data => {
            setVillages(data);
            setLoadingWilayah(false);
          })
          .catch(err => {
            console.error('Fetch error villages:', err);
            setLoadingWilayah(false);
          });
      }
    } else {
      setVillages([]);
    }
  }, [formData.location.district, districts]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8"
    >
      <div className="flex items-center gap-8 border-b border-gray-50 pb-8">
        <div className="relative group">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-200 group-hover:border-red-600 transition-all overflow-hidden bg-cover bg-center"
               style={formData.logoUrl ? { backgroundImage: `url(${formData.logoUrl})` } : {}}>
            {!formData.logoUrl && <Building className="w-8 h-8 text-gray-300 group-hover:text-red-600" />}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleLogoUpload}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 bg-red-600 text-white p-2 rounded-xl shadow-lg shadow-red-200 hover:scale-110 transition-all"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-bold text-gray-900">Logo Koperasi</h4>
          <p className="text-sm text-gray-400 font-medium">Resolusi disarankan 512x512px (PNG/JPG).</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="col-span-2">
          <label className="text-sm font-bold text-gray-700 ml-1">Nama Koperasi</label>
          <input 
            type="text" 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none font-bold"
          />
        </div>

        <div className="col-span-2 bg-red-50 p-6 rounded-2xl border border-red-100">
          <label className="text-sm font-bold text-red-900 ml-1">Tautan Pendaftaran Anggota</label>
          <p className="text-xs text-red-700 mb-3">Bagikan tautan ini ke warga untuk bergabung ke koperasi Anda secara otomatis.</p>
          <div className="flex gap-2">
            <input 
              readOnly
              type="text" 
              value={`${window.location.origin}/register?koperasiId=${profile?.koperasiId}`}
              className="flex-1 bg-white border border-red-200 rounded-xl py-3 px-4 text-sm font-medium text-red-800 outline-none"
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/register?koperasiId=${profile?.koperasiId}`);
                toast.success('Tautan disalin!');
              }}
              className="bg-red-600 text-white px-4 rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Salin
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 ml-1">Nomor Badan Hukum</label>
          <input 
            type="text" 
            value={formData.badanHukum}
            onChange={(e) => setFormData({ ...formData, badanHukum: e.target.value })}
            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-700 ml-1">Tahun Berdiri</label>
          <input 
            type="text" 
            value={formData.tahunBerdiri}
            onChange={(e) => setFormData({ ...formData, tahunBerdiri: e.target.value })}
            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 ml-1 font-sans flex items-center gap-2">
            Provinsi
            {loadingWilayah && <span className="text-[10px] text-gray-400 animate-pulse">(Memuat...)</span>}
          </label>
          <select 
            value={formData.location.province}
            onChange={(e) => {
              const selected = provinces.find(p => p.id === e.target.value || p.name === e.target.value);
              setFormData({ 
                ...formData, 
                location: { 
                  ...formData.location, 
                  province: selected?.name || e.target.value,
                  regency: '',
                  district: '',
                  village: ''
                } 
              });
            }}
            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none"
          >
            <option value="">-- Pilih Provinsi --</option>
            {provinces.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 ml-1 font-sans">Kabupaten/Kota</label>
          <select 
            value={formData.location.regency}
            disabled={!formData.location.province}
            onChange={(e) => {
              const selected = regencies.find(r => r.id === e.target.value || r.name === e.target.value);
              setFormData({ 
                ...formData, 
                location: { 
                  ...formData.location, 
                  regency: selected?.name || e.target.value,
                  district: '',
                  village: ''
                } 
              });
            }}
            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none disabled:opacity-50"
          >
            <option value="">-- Pilih Kabupaten --</option>
            {regencies.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
           <label className="text-sm font-bold text-gray-700 ml-1">Kecamatan</label>
           <select 
             value={formData.location.district}
             disabled={!formData.location.regency}
             onChange={(e) => {
               const selected = districts.find(d => d.id === e.target.value || d.name === e.target.value);
               setFormData({ 
                 ...formData, 
                 location: { 
                   ...formData.location, 
                   district: selected?.name || e.target.value,
                   village: ''
                 } 
               });
             }}
             className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none disabled:opacity-50"
           >
             <option value="">-- Pilih Kecamatan --</option>
             {districts.map(d => (
               <option key={d.id} value={d.name}>{d.name}</option>
             ))}
           </select>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 ml-1">Nama Desa</label>
          <select 
            value={formData.location.village}
            disabled={!formData.location.district}
            onChange={(e) => {
              const selected = villages.find(v => v.id === e.target.value || v.name === e.target.value);
              setFormData({ 
                ...formData, 
                location: { 
                  ...formData.location, 
                  village: selected?.name || e.target.value
                } 
              });
            }}
            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none disabled:opacity-50"
          >
            <option value="">-- Pilih Desa/Kelurahan --</option>
            {villages.map(v => (
              <option key={v.id} value={v.name}>{v.name}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="text-sm font-bold text-gray-700 ml-1">Alamat Lengkap Kantor</label>
          <textarea 
            rows={3}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-50">
        <button 
          onClick={() => onSave(formData)}
          disabled={loading}
          className="px-8 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : <><Save className="w-5 h-5" /> Simpan Perubahan</>}
        </button>
      </div>
    </motion.div>
  );
}

function PaymentSection({ data, onSave, loading }: { key?: string, data: any, onSave: (data: any) => void, loading: boolean }) {
  const [formData, setFormData] = React.useState({
    bankName: '',
    rekeningNumber: '',
    rekeningName: '',
    merchantCode: '',
    simpananPokok: 100000,
    simpananWajib: 50000,
  });

  React.useEffect(() => {
    if (data?.payment || data?.simpananPokok || data?.simpananWajib) {
      setFormData({
        bankName: data.payment?.bankName || '',
        rekeningNumber: data.payment?.rekeningNumber || '',
        rekeningName: data.payment?.rekeningName || '',
        merchantCode: data.payment?.merchantCode || '',
        simpananPokok: data.simpananPokok || 100000,
        simpananWajib: data.simpananWajib || 50000,
      });
    }
  }, [data]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8"
    >
      <div>
        <h4 className="text-lg font-bold text-gray-900">Rekening & Simpanan</h4>
        <p className="text-sm text-gray-500 font-medium">Informasi pembayaran dan kebijakan simpanan koperasi.</p>
      </div>

      <div className="grid gap-6">
        <div>
          <label className="text-sm font-bold text-gray-700 ml-1">Nominal Simpanan Pokok (Rp)</label>
          <input 
            type="number" 
            value={formData.simpananPokok}
            placeholder="Contoh: 100000"
            onChange={(e) => setFormData({ ...formData, simpananPokok: parseInt(e.target.value) || 0 })}
            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-700 ml-1">Nominal Simpanan Wajib (Rp)</label>
          <input 
            type="number" 
            value={formData.simpananWajib}
            placeholder="Contoh: 50000"
            onChange={(e) => setFormData({ ...formData, simpananWajib: parseInt(e.target.value) || 0 })}
            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-700 ml-1">Nama Bank</label>
          <input 
            type="text" 
            value={formData.bankName}
            placeholder="Contoh: Bank Jateng, BRI, dll"
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none"
          />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-bold text-gray-700 ml-1">Nomor Rekening</label>
            <input 
              type="text" 
              value={formData.rekeningNumber}
              onChange={(e) => setFormData({ ...formData, rekeningNumber: e.target.value })}
              className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 ml-1">Nama Pemilik Rekening</label>
            <input 
              type="text" 
              value={formData.rekeningName}
              onChange={(e) => setFormData({ ...formData, rekeningName: e.target.value })}
              className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-bold text-gray-700 ml-1">Merchant Code (NMID)</label>
          <input 
            type="text" 
            value={formData.merchantCode || ''}
            placeholder="Contoh: ID1023456789012"
            onChange={(e) => setFormData({ ...formData, merchantCode: e.target.value })}
            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:border-red-600 focus:bg-white transition-all outline-none uppercase"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-50">
        <button 
          onClick={() => {
            const { simpananPokok, simpananWajib, ...paymentData } = formData;
            onSave({ payment: paymentData, simpananPokok, simpananWajib });
          }}
          disabled={loading}
          className="px-8 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : <><Save className="w-5 h-5" /> Simpan Perubahan</>}
        </button>
      </div>
    </motion.div>
  );
}

function PlaceholderSection({ title, icon }: { key?: string, title: string, icon: React.ReactElement }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4"
    >
      <div className="p-4 bg-gray-50 rounded-2xl text-gray-300">
        {React.cloneElement(icon, { className: 'w-12 h-12' })}
      </div>
      <div>
        <h4 className="text-xl font-bold text-gray-900">{title}</h4>
        <p className="text-gray-500 font-medium">Fitur ini akan segera tersedia.</p>
      </div>
    </motion.div>
  );
}

function SettingsTab({ icon, label, active = false, onClick }: { icon: React.ReactElement, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all group",
        active ? "bg-white text-red-600 shadow-sm border border-gray-100" : "text-gray-400 hover:text-red-500 hover:bg-white/50"
      )}
    >
      <div className="flex items-center gap-3">
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
        <span>{label}</span>
      </div>
      <ChevronRight className={cn("w-4 h-4 transition-transform", active ? "translate-x-1" : "opacity-0 group-hover:opacity-100")} />
    </button>
  );
}
