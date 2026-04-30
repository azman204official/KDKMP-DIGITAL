import Dexie, { type Table } from 'dexie';

export interface Koperasi {
  id?: string;
  nama: string;
  logo?: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  alamat?: string;
  nomorBadanHukum?: string;
  rekening?: string;
  qrPembayaran?: string;
  status: 'pending' | 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  role: 'super_admin' | 'admin_koperasi' | 'bendahara' | 'anggota';
  koperasiId?: string | null;
  status: 'active' | 'inactive';
}

export interface Anggota {
  id?: string;
  nama: string;
  nik: string;
  alamat?: string;
  nomorHp?: string;
  tanggalGabung?: string;
  status: 'active' | 'suspended' | 'inactive';
  koperasiId: string;
  createdAt?: string;
}

export interface Simpanan {
  id?: string;
  anggotaId: string;
  koperasiId: string;
  jenisSimpanan: 'pokok' | 'wajib' | 'sukarela';
  nominal: number;
  jatuhTempo?: string;
  status: 'unpaid' | 'paid';
  createdAt?: string;
}

export interface Pembayaran {
  id?: string;
  anggotaId: string;
  koperasiId: string;
  nominal: number;
  tanggalBayar?: string;
  buktiPembayaran?: string;
  status: 'pending' | 'verified' | 'rejected';
  jenisSimpanan?: string;
  verifiedBy?: string;
  createdAt?: string;
}

export interface Reminder {
  id?: string;
  anggotaId: string;
  koperasiId: string;
  jadwal: string;
  status: 'scheduled' | 'sent' | 'failed';
  type?: string;
  createdAt?: string;
}

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  targetUserId?: string;
  targetRole?: string;
  koperasiId?: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface Registration {
  id?: string;
  uid: string;
  role: 'admin_koperasi' | 'anggota';
  nama: string;
  email: string;
  hp: string;
  nik: string;
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  desa?: string;
  namaKoperasi?: string;
  badanHukum?: string;
  alamat?: string;
  ketua?: string;
  rekening?: string;
  targetKoperasiId?: string;
  targetKoperasiName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

export interface Chat {
  id?: string;
  name: string;
  lastMessage: string;
  time?: string;
  unread: number;
  type: 'individual' | 'group';
  status?: 'online' | 'offline';
  koperasiId: string;
  targetUserId?: string;
  lastUpdated: string;
}

export interface Message {
  id?: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  koperasiId: string;
  createdAt: string;
}

export class AppDb extends Dexie {
  koperasi!: Table<Koperasi>;
  users!: Table<UserProfile>;
  anggota!: Table<Anggota>;
  simpanan!: Table<Simpanan>;
  pembayaran!: Table<Pembayaran>;
  reminders!: Table<Reminder>;
  notifications!: Table<Notification>;
  registrations!: Table<Registration>;
  chats!: Table<Chat>;
  messages!: Table<Message>;

  constructor() {
    super('KDKMPDigitalDB');
    this.version(3).stores({
      koperasi: '++id, status, ownerId', // ownerId is indexed
      users: 'uid, role, koperasiId, status', // uid is primary key
      anggota: '++id, koperasiId, nik, status', // koperasiId heavily queried
      simpanan: '++id, koperasiId, anggotaId, status, jenisSimpanan',
      pembayaran: '++id, koperasiId, anggotaId, status',
      reminders: '++id, koperasiId, anggotaId, status',
      notifications: '++id, koperasiId, targetUserId, targetRole, isRead',
      registrations: '++id, uid, role, status',
      chats: '++id, koperasiId, targetUserId, type',
      messages: '++id, chatId, koperasiId, senderId, createdAt'
    });
  }
}

export const db = new AppDb();
export default db;

// Sync / export helper
export async function exportDatabase() {
  const { exportDB } = await import('dexie-export-import');
  const blob = await exportDB(db, { prettyJson: true });
  return blob;
}

export async function importDatabase(file: File) {
  const { importDB } = await import('dexie-export-import');
  await importDB(file, { clearTablesBeforeImport: true });
}
