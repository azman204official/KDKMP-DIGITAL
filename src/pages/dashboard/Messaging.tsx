import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Search, 
  Users, 
  MoreVertical, 
  Phone, 
  Video, 
  Image as ImageIcon,
  Paperclip,
  CheckCheck,
  Megaphone,
  PlusCircle,
  Loader2,
  Download,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import localDb from '../../lib/localDb';
import { useLiveQuery } from 'dexie-react-hooks';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: any;
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  type: 'individual' | 'group';
  status?: 'online' | 'offline';
}

export default function Messaging() {
  const { profile, koperasi } = useAuth();
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isAddingChat, setIsAddingChat] = useState(false);
  
  const members = useLiveQuery(
    () => profile?.koperasiId ? localDb.anggota.where('koperasiId').equals(profile.koperasiId).toArray() : Promise.resolve([]),
    [profile?.koperasiId],
    []
  );

  const chats = useLiveQuery(async () => {
    if (!profile?.koperasiId) return [];
    const dbChats = await localDb.chats.where('koperasiId').equals(profile.koperasiId).reverse().sortBy('lastUpdated');
    const broadcast = {
      id: 'broadcast',
      name: 'Pengumuman Koperasi',
      lastMessage: 'Gunakan ini untuk broadcast ke seluruh anggota.',
      time: 'Baru',
      unread: 0,
      type: 'group' as const,
      koperasiId: profile.koperasiId,
      lastUpdated: new Date().toISOString()
    };
    if (!dbChats.find(d => d.id === 'broadcast' || d.type === 'group')) {
      return [broadcast, ...dbChats];
    }
    return dbChats;
  }, [profile?.koperasiId], []);

  const messages = useLiveQuery(
    () => (profile?.koperasiId && selectedChat) ? localDb.messages.where('chatId').equals(selectedChat.id!).sortBy('createdAt') : Promise.resolve([]),
    [profile?.koperasiId, selectedChat?.id],
    []
  );

  const loading = chats === undefined;

  const handleStartChat = async (member: any) => {
    if (!profile?.koperasiId) return;
    
    // Check if chat already exists
    const chatExists = chats.find(c => c.name === member.name);
    if (chatExists) {
        setSelectedChat(chatExists);
        setIsAddingChat(false);
        return;
    }

    try {
        const newChatId = await localDb.chats.add({
            name: member.name,
            koperasiId: profile.koperasiId,
            lastMessage: 'Chat dimulai',
            lastUpdated: new Date().toISOString(),
            type: 'individual',
            targetUserId: member.id, // Store targetUserId
            unread: 0,
            status: 'offline'
        });
        setIsAddingChat(false);
        toast.success(`Chat dengan ${member.name} dimulai.`);
    } catch(e) {
        console.error(e);
        toast.error('Gagal membuat chat baru.');
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chat: any) => {
    e.stopPropagation();
    if (!profile?.koperasiId) {
        return;
    }
    if (chat.id === 'broadcast') {
        return;
    }
    
    if (!confirm(`Apakah Anda yakin ingin menghapus percakapan dengan ${chat.name}?`)) return;

    try {
        await localDb.messages.where('chatId').equals(chat.id!).delete();
        await localDb.chats.delete(chat.id!);
        toast.success('Chat berhasil dihapus.');
        if (selectedChat?.id === chat.id) setSelectedChat(null);
    } catch(e) {
        console.error(e);
        toast.error('Gagal menghapus chat.');
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !profile?.koperasiId || !selectedChat) return;

    setIsSending(true);
    const messageContent = message;
    setMessage('');

    try {
      await localDb.messages.add({
        chatId: selectedChat.id!,
        koperasiId: profile.koperasiId,
        senderId: profile.uid,
        senderName: profile.displayName || 'Admin',
        content: messageContent,
        createdAt: new Date().toISOString(),
      });

      // Update chat lastMessage
      if (selectedChat.id !== 'broadcast') {
        await localDb.chats.update(selectedChat.id!, {
           lastMessage: messageContent,
           lastUpdated: new Date().toISOString()
        });
      }

      // Notify the recipient
      if (selectedChat.id === 'broadcast') {
        // Broadcast to all members
        await localDb.notifications.add({
          title: 'Pengumuman Baru',
          message: messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : ''),
          type: 'info',
          koperasiId: profile.koperasiId,
          targetRole: profile.role === 'anggota' ? 'admin_koperasi' : 'anggota',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/support'
        });
      } else if ((selectedChat as any).targetUserId) {
        // Individual chat
        await localDb.notifications.add({
          title: `Pesan dari ${profile.displayName || 'Admin'}`,
          message: messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : ''),
          type: 'info',
          koperasiId: profile.koperasiId,
          targetUserId: selectedChat.targetUserId,
          targetRole: 'anggota',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/support'
        });
      } else if (profile.role === 'anggota') {
        // Member sending message to system/admins
        await localDb.notifications.add({
          title: `Pesan Baru dari ${profile.displayName}`,
          message: messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : ''),
          type: 'info',
          koperasiId: profile.koperasiId,
          targetRole: 'admin_koperasi',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/support'
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengirim pesan');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] min-h-[400px] w-full max-w-full flex bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mx-auto min-w-0">
      {/* Sidebar: Chat List */}
      <div className={cn("w-full border-r border-gray-100 flex-col md:w-80 flex-shrink-0", selectedChat ? "hidden md:flex" : "flex")}>
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Pesan</h2>
            <button 
              onClick={() => setIsAddingChat(!isAddingChat)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <PlusCircle className="w-6 h-6" />
            </button>
          </div>
          {!isAddingChat && (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari percakapan..."
                className="w-full bg-gray-50 border border-transparent rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-600 focus:bg-white outline-none transition-all"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isAddingChat ? (
            <div className="p-4 space-y-2">
                <h4 className="font-black text-gray-900 text-sm px-2">Pilih Anggota</h4>
                {members.map(member => (
                    <button key={member.id} onClick={() => handleStartChat(member)} className="w-full p-3 text-left hover:bg-gray-50 rounded-xl font-bold text-gray-700">
                        {member.name}
                    </button>
                ))}
            </div>
          ) : loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
              <p className="text-xs font-bold text-gray-400">Memuat...</p>
            </div>
          ) : chats.length > 0 ? (
            chats.map((chat) => (
              <div
                 key={chat.id}
                 role="button"
                 tabIndex={0}
                 onClick={() => setSelectedChat(chat)}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedChat(chat); }}
                 className={cn(
                   "w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-all text-left relative group cursor-pointer",
                   selectedChat?.id === chat.id && "bg-red-50/50"
                 )}
              >
                {selectedChat?.id === chat.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 rounded-r-full"></div>}
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg transition-transform group-hover:scale-105",
                    chat.type === 'group' ? "bg-red-600 shadow-red-100" : "bg-gray-400 shadow-gray-100"
                  )}>
                    {chat.type === 'group' ? <Megaphone className="w-5 h-5" /> : chat.name.charAt(0)}
                  </div>
                  {chat.status === 'online' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={cn("text-sm font-bold truncate", chat.unread > 0 ? "text-gray-900" : "text-gray-700")}>{chat.name}</h4>
                    <span className="text-[10px] font-bold text-gray-400">{chat.time}</span>
                  </div>
                  <p className={cn("text-xs truncate transition-colors", chat.unread > 0 ? "text-gray-900 font-bold" : "text-gray-400 font-medium")}>
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.id !== 'broadcast' && (
                  <button onClick={(e) => handleDeleteChat(e, chat)} className="text-gray-400 hover:text-red-600 p-2 ml-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 text-center space-y-4">
              <p className="text-xs font-bold text-gray-400">Belum ada percakapan</p>
              <button 
                onClick={() => setIsAddingChat(true)}
                className="w-full p-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200"
              >
                Mulai Chat Baru
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn("flex-1 flex-col bg-slate-50/20 min-w-0", selectedChat ? "flex" : "hidden md:flex")}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 px-4 md:px-8 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 pr-4">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold",
                  selectedChat.type === 'group' ? "bg-red-600" : "bg-gray-400"
                )}>
                  {selectedChat.type === 'group' ? <Users className="w-5 h-5" /> : selectedChat.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 truncate">{selectedChat.name}</h3>
                  <p className="text-xs font-medium text-gray-400 truncate">
                    {selectedChat.id === 'broadcast' ? `${koperasi?.name || 'Koperasi'} Official` : (selectedChat.status === 'online' ? 'Sedang Online' : 'Terakhir dilihat Baru Saja')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HeaderAction onClick={() => toast.success('Fitur telepon akan segera hadir!')} icon={<Phone className="w-4 h-4" />} />
                <HeaderAction onClick={() => toast.success('Fitur panggilan video akan segera hadir!')} icon={<Video className="w-4 h-4" />} />
                <div className="w-px h-6 bg-gray-100 mx-2"></div>
                <div className="relative">
                    <HeaderAction onClick={() => setIsMenuOpen(!isMenuOpen)} icon={<MoreVertical className="w-4 h-4" />} />
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 p-2">
                             <button onClick={(e) => { setIsMenuOpen(false); handleDeleteChat(e, selectedChat!); }} className="w-full text-left p-2 text-red-600 rounded-lg hover:bg-red-50 text-sm font-bold">Hapus Percakapan</button>
                        </div>
                    )}
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
            >
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <MessageItem 
                    key={msg.id}
                    sender={msg.senderName} 
                    content={msg.content} 
                    time={msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru'} 
                    isMe={msg.senderId === profile?.uid} 
                    isSent={!!msg.createdAt}
                  />
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <Megaphone className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-sm font-bold text-gray-400">Belum ada pesan di percakapan ini</p>
                  <p className="text-xs font-medium text-gray-400 max-w-xs mt-1">Gunakan kotak di bawah untuk mengirim pesan pertama.</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 md:gap-4 max-w-5xl mx-auto">
                 <div className="flex gap-1 md:gap-2 pb-1.5 focus-within:opacity-100 transition-opacity">
                   <button type="button" className="p-2 md:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Paperclip className="w-5 h-5" /></button>
                   <button type="button" className="p-2 md:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><ImageIcon className="w-5 h-5" /></button>
                 </div>
                 <div className="flex-1 relative">
                    <textarea 
                      placeholder="Ketik pesan di sini..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] py-3.5 px-6 focus:ring-2 focus:ring-red-600 focus:bg-white transition-all outline-none resize-none overflow-hidden text-sm font-medium pr-4"
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                      }}
                    />
                 </div>
                 <button 
                   type="submit"
                   disabled={!message.trim() || isSending}
                   className={cn(
                     "w-12 h-12 rounded-2xl transition-all shadow-xl flex items-center justify-center flex-shrink-0",
                     message.trim() ? "bg-red-600 text-white shadow-red-100" : "bg-gray-100 text-gray-400 shadow-none"
                   )}
                 >
                   {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                 </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
             <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mb-8 relative">
               <Megaphone className="text-red-600 w-10 h-10" />
               <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm animate-bounce">
                  <CheckCheck className="w-4 h-4 text-green-500" />
               </div>
             </div>
             <h3 className="text-2xl font-black text-gray-900 tracking-tight">{koperasi?.name || 'KDKMP'} Messenger</h3>
             <p className="text-gray-500 max-w-sm mt-3 font-medium">Pilih percakapan untuk memulai dukungan atau broadcast pengumuman kepada anggota koperasi.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderAction({ icon, onClick }: { icon: React.ReactNode, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 hover:bg-red-50 transition-all font-bold">
      {icon}
    </button>
  );
}

function MessageItem({ sender, content, time, isMe = false, isSent = false }: { key?: React.Key, sender: string, content: string, time: string, isMe?: boolean, isSent?: boolean }) {
  return (
    <div className={cn("flex flex-col group", isMe ? "items-end" : "items-start")}>
      {!isMe && <span className="text-[10px] font-bold text-gray-400 mb-1 ml-1 uppercase">{sender}</span>}
      <div className={cn(
        "max-w-[75%] p-4 rounded-3xl shadow-sm relative",
        isMe ? "bg-red-600 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
      )}>
        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{content}</p>
        <div className={cn(
          "flex items-center gap-1 mt-2",
          isMe ? "justify-end text-red-200" : "justify-start text-gray-400"
        )}>
          <span className="text-[10px] font-black uppercase tracking-widest">{time}</span>
          {isMe && <CheckCheck className={cn("w-3.5 h-3.5", isSent ? "text-red-100" : "text-red-300 opacity-50")} />}
        </div>
      </div>
    </div>
  );
}

