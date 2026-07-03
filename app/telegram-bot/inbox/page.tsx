'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  MessageSquare, Send, Loader2, User, RefreshCw, Search, ChevronLeft,
  Paperclip, Image, Video, Mic, MapPin, Smile, FileText, Play,
  CheckCheck, Check, Clock, X, Download, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import toast from 'react-hot-toast';
import { telegramBotApi, getCenterIdOrThrow } from '@/api/telegramBotApi';
import type { ChatUser, ChatMessage, MessageContentType } from '@/api/telegramBotApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const MESSAGE_TYPES: { value: MessageContentType; label: string; icon: any }[] = [
  { value: 'photo', label: 'Rasm', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'document', label: 'Fayl', icon: FileText },
  { value: 'voice', label: 'Ovozli', icon: Mic },
  { value: 'location', label: 'Joylashuv', icon: MapPin },
  { value: 'sticker', label: 'Stiker', icon: Smile },
];

function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const day = 86400000;

  if (diff < day && now.getDate() === date.getDate()) return 'Bugun';
  if (diff < 2 * day && now.getDate() - date.getDate() === 1) return 'Kecha';
  if (diff < 7 * day) return format(date, 'EEEE');
  return format(date, 'dd.MM.yyyy');
}

function formatDateSeparator(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const day = 86400000;

  if (diff < day && now.getDate() === date.getDate()) return 'Bugun';
  if (diff < 2 * day && now.getDate() - date.getDate() === 1) return 'Kecha';
  return format(date, 'dd.MM.yyyy');
}

function getUserInitials(u: ChatUser): string {
  const name = u.student_name || `${u.first_name || ''} ${u.last_name || ''}`;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || '?').toUpperCase();
}

function getUserName(u: ChatUser): string {
  return u.student_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Noma\'lum';
}

function getMessagePreview(msg: ChatMessage): string {
  if (msg.text) return msg.text;
  switch (msg.content_type) {
    case 'photo': return '📷 Rasm' + (msg.caption ? ': ' + msg.caption : '');
    case 'video': return '🎬 Video' + (msg.caption ? ': ' + msg.caption : '');
    case 'voice': return '🎤 Ovozli xabar';
    case 'document': return '📎 ' + (msg.file?.file_name || 'Fayl');
    case 'location': return '📍 Joylashuv';
    case 'sticker': return msg.sticker?.emoji ? msg.sticker.emoji + ' Stiker' : '🎨 Stiker';
    case 'animation': return '🎥 GIF';
    default: return 'Xabar';
  }
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isAdmin = msg.is_from_admin;

  const renderContent = () => {
    switch (msg.content_type) {
      case 'text':
        return <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>;

      case 'photo':
        return (
          <div className="space-y-1">
            {msg.file?.url ? (
              <a href={msg.file.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={msg.file.url}
                  alt={msg.caption || 'Rasm'}
                  className="max-w-full rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                  style={{ maxHeight: 280 }}
                />
              </a>
            ) : (
              <div className="bg-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
                <Image className="h-8 w-8 mx-auto mb-1" />
                Rasm
              </div>
            )}
            {msg.caption && <p className="text-sm mt-1">{msg.caption}</p>}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-1">
            {msg.file?.url ? (
              <video
                src={msg.file.url}
                controls
                className="max-w-full rounded-lg"
                style={{ maxHeight: 280 }}
                preload="metadata"
              >
                <a href={msg.file.url} download>Yuklab olish</a>
              </video>
            ) : (
              <div className="bg-gray-900 rounded-lg p-4 text-center text-gray-400 text-sm flex flex-col items-center">
                <Video className="h-8 w-8 mb-1" />
                Video
              </div>
            )}
            {msg.caption && <p className="text-sm mt-1">{msg.caption}</p>}
          </div>
        );

      case 'voice':
        return (
          <div className="flex items-center gap-2 min-w-[200px]">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 shrink-0">
              <Play className="h-4 w-4 fill-current" />
            </Button>
            <div className="flex-1 h-1.5 bg-gray-300 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '0%' }} />
            </div>
            <span className="text-xs text-gray-500 shrink-0">
              {msg.file?.duration ? `${Math.floor(msg.file.duration / 60)}:${String(msg.file.duration % 60).padStart(2, '0')}` : '0:00'}
            </span>
          </div>
        );

      case 'document':
        return (
          <a
            href={msg.file?.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{msg.file?.file_name || 'Fayl'}</p>
              {msg.file?.file_size && (
                <p className="text-xs text-gray-500">
                  {(msg.file.file_size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
            <Download className="h-4 w-4 text-gray-400 shrink-0" />
          </a>
        );

      case 'location':
        return (
          <div className="space-y-1">
            <a
              href={`https://maps.google.com/maps?q=${msg.location?.latitude},${msg.location?.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-lg p-3 text-white text-center">
                <MapPin className="h-8 w-8 mx-auto mb-1" />
                <p className="text-xs font-medium">Joylashuv</p>
                <p className="text-[10px] opacity-80">
                  {msg.location?.latitude?.toFixed(4)}, {msg.location?.longitude?.toFixed(4)}
                </p>
              </div>
            </a>
          </div>
        );

      case 'sticker':
        return (
          <div className="max-w-[160px]">
            {msg.sticker?.url ? (
              <img src={msg.sticker.url} alt="Sticker" className="w-full" />
            ) : (
              <div className="text-4xl text-center p-2">{msg.sticker?.emoji || '✨'}</div>
            )}
            {msg.sticker?.set_name && (
              <p className="text-[10px] text-gray-400 text-center mt-0.5">{msg.sticker.set_name}</p>
            )}
          </div>
        );

      case 'animation':
        return (
          <div>
            {msg.file?.url ? (
              <video
                src={msg.file.url}
                autoPlay
                loop
                muted
                playsInline
                className="max-w-full rounded-lg"
                style={{ maxHeight: 200 }}
              />
            ) : (
              <div className="bg-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">GIF</div>
            )}
          </div>
        );

      default:
        return <p className="text-sm">{msg.text || 'Xabar'}</p>;
    }
  };

  return (
    <div className={cn('flex mb-2', isAdmin ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[75%] min-w-[60px]',
        isAdmin ? 'order-1' : 'order-1'
      )}>
        <div className={cn(
          'rounded-2xl px-3.5 py-2 shadow-sm',
          isAdmin
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md'
        )}>
          {renderContent()}
          <div className={cn(
            'flex items-center gap-1 mt-1',
            isAdmin ? 'justify-end' : 'justify-start'
          )}>
            <span className={cn(
              'text-[10px]',
              isAdmin ? 'text-blue-100' : 'text-gray-400'
            )}>
              {msg.sent_at ? formatTime(new Date(msg.sent_at)) : ''}
            </span>
            {isAdmin && (
              msg.read_at
                ? <CheckCheck className="h-3 w-3 text-blue-200" />
                : <Check className="h-3 w-3 text-blue-200" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageDateSeparator({ date }: { date: Date }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-xs bg-gray-200 text-gray-500 px-3 py-1 rounded-full font-medium">
        {formatDateSeparator(date)}
      </span>
    </div>
  );
}

function ChatUserItem({
  user,
  isActive,
  isSelected,
  onClick,
}: {
  user: ChatUser;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left',
        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50 border-l-2 border-l-transparent'
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-xs font-medium bg-blue-100 text-blue-700">
            {getUserInitials(user)}
          </AvatarFallback>
        </Avatar>
        <span className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
          isActive ? 'bg-green-500' : 'bg-gray-300'
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-medium text-gray-900 truncate">{getUserName(user)}</p>
          {user.last_message_at && (
            <span className="text-[10px] text-gray-400 shrink-0">
              {formatTime(new Date(user.last_message_at))}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs text-gray-500 truncate">
            {user.last_message_type === 'text' && user.last_message
              ? user.last_message
              : user.last_message_type
                ? getMessagePreview({ content_type: user.last_message_type, is_from_admin: false } as ChatMessage)
                : user.last_message || ''}
          </p>
          {(user.unread_count || 0) > 0 && (
            <span className="shrink-0 bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {user.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] gap-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="w-[320px] border-r border-gray-200 p-3 space-y-3 shrink-0">
        <Skeleton className="h-9 w-full rounded-lg" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Xabarlar yuklanmoqda...</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <MessageSquare className="h-16 w-16 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium text-gray-500">Xabarlar mavjud emas</p>
        <p className="text-sm mt-1">Botga xabar kelganda shu yerda ko'rinadi</p>
      </div>
    </div>
  );
}

function StartChatState() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <MessageSquare className="h-16 w-16 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium text-gray-500">Chatni tanlang</p>
        <p className="text-sm mt-1">Chapdagi ro'yxatdan foydalanuvchini tanlang</p>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const [centerId, setCenterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatUser[]>([]);
  const [search, setSearch] = useState('');
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaTypeRef = useRef<MessageContentType>('photo');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }, 50);
  }, []);

  const loadChats = useCallback(async () => {
    try {
      const cid = await getCenterIdOrThrow();
      setCenterId(cid);
      const data = await telegramBotApi.getChats(cid, search);
      setChats(data || []);
    } catch {
      toast.error('Xatolik');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadChats(); }, [loadChats]);

  const loadMessages = useCallback(async (chatId: number) => {
    if (!centerId) return;
    setMessagesLoading(true);
    try {
      const data = await telegramBotApi.getChatMessages(centerId, chatId);
      setMessages(data || []);
      scrollToBottom(false);
      telegramBotApi.markChatAsRead(centerId, chatId).catch(() => {});
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [centerId, scrollToBottom]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat, loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!selectedChat) return;
    const interval = setInterval(() => {
      if (selectedChat && centerId) {
        telegramBotApi.getChatMessages(centerId, selectedChat).then(data => {
          const msgs = data || [];
          if (msgs.length !== messages.length) {
            setMessages(msgs);
            scrollToBottom(false);
          }
        }).catch(() => {});
        telegramBotApi.getChats(centerId).then(data => {
          setChats(data || []);
        }).catch(() => {});
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedChat, centerId, messages.length, scrollToBottom]);

  const handleSelectChat = (chatId: number) => {
    setSelectedChat(chatId);
    setShowMobileChat(true);
    setChats(prev => prev.map(c =>
      c.chat_id === chatId ? { ...c, unread_count: 0 } : c
    ));
  };

  const handleSendText = async () => {
    if (!textInput.trim() || !centerId || !selectedChat || sending) return;
    setSending(true);
    const text = textInput.trim();
    setTextInput('');
    const optimistic: ChatMessage = {
      id: Date.now(),
      chat_id: selectedChat,
      text: text,
      content_type: 'text',
      is_from_admin: true,
      sent_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    scrollToBottom();
    try {
      await telegramBotApi.sendReply(centerId, selectedChat, text);
      loadMessages(selectedChat);
      setTimeout(() => loadChats(), 500);
    } catch (err: any) {
      toast.error(err.message || 'Xatolik');
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setTextInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleMediaSend = async (file: File) => {
    if (!centerId || !selectedChat) return;
    const type = mediaTypeRef.current;
    setSending(true);
    setShowMediaMenu(false);
    try {
      if (type === 'photo') {
        await telegramBotApi.sendPhoto(centerId, selectedChat, file);
      } else if (type === 'video') {
        await telegramBotApi.sendVideo(centerId, selectedChat, file);
      } else if (type === 'document') {
        await telegramBotApi.sendDocument(centerId, selectedChat, file);
      } else if (type === 'voice') {
        await telegramBotApi.sendVoice(centerId, selectedChat, file);
      }
      loadMessages(selectedChat);
      setTimeout(() => loadChats(), 500);
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleMediaSend(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileSelect = (type: MessageContentType) => {
    mediaTypeRef.current = type;
    if (type === 'photo' || type === 'video' || type === 'document' || type === 'voice') {
      const acceptMap: Record<string, string> = {
        photo: 'image/*',
        video: 'video/*',
        document: '*/*',
        voice: 'audio/*',
      };
      if (fileInputRef.current) {
        fileInputRef.current.accept = acceptMap[type] || '*/*';
        fileInputRef.current.click();
      }
    }
  };

  const sendLocation = () => {
    if (!centerId || !selectedChat) return;
    if (!navigator.geolocation) {
      toast.error('Geolokatsiya qo\'llab-quvvatlanmaydi');
      return;
    }
    setSending(true);
    setShowMediaMenu(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await telegramBotApi.sendLocation(centerId, selectedChat, pos.coords.latitude, pos.coords.longitude);
          loadMessages(selectedChat);
          setTimeout(() => loadChats(), 500);
        } catch (err: any) {
          toast.error(err.message || 'Xatolik');
        } finally {
          setSending(false);
        }
      },
      () => {
        toast.error('Joylashuvni aniqlab bo\'lmadi');
        setSending(false);
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const selectedUser = useMemo(() => {
    return chats.find(c => c.chat_id === selectedChat) || null;
  }, [chats, selectedChat]);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [chats]);

  const groupedMessages = useMemo(() => {
    const groups: { date: Date; messages: ChatMessage[] }[] = [];
    let currentGroup: { date: Date; messages: ChatMessage[] } | null = null;

    for (const msg of messages) {
      const d = new Date(msg.sent_at);
      const dateKey = format(d, 'yyyy-MM-dd');
      if (!currentGroup || format(currentGroup.date, 'yyyy-MM-dd') !== dateKey) {
        currentGroup = { date: d, messages: [] };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(msg);
    }
    return groups;
  }, [messages]);

  if (loading) return <LoadingSkeleton />;

  const leftPanel = (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-lg border-0 outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-colors placeholder:text-gray-400"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {sortedChats.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            {search ? 'Hech narsa topilmadi' : 'Foydalanuvchilar mavjud emas'}
          </div>
        ) : (
          <div className="py-1">
            {sortedChats.map(user => (
              <ChatUserItem
                key={user.chat_id}
                user={user}
                isActive={user.is_active}
                isSelected={selectedChat === user.chat_id}
                onClick={() => handleSelectChat(user.chat_id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const rightPanel = (
    <div className="flex flex-col h-full">
      {!selectedChat ? (
        <StartChatState />
      ) : messagesLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => { setSelectedChat(null); setShowMobileChat(false); }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs font-medium bg-blue-100 text-blue-700">
                {selectedUser ? getUserInitials(selectedUser) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedUser ? getUserName(selectedUser) : 'Foydalanuvchi'}
              </p>
              <p className="text-[11px] text-gray-400">
                {selectedUser?.is_active ? 'Online' : 'Offline'}
                {selectedUser?.phone_number && ` · ${selectedUser.phone_number}`}
                {selectedUser?.username && ` · @${selectedUser.username}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => selectedChat && loadMessages(selectedChat)}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                <div className="text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>Xabarlar mavjud emas</p>
                  <p className="text-xs mt-0.5">Xabar yozing va suhbatni boshlang</p>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3">
                {groupedMessages.map((group, gi) => (
                  <div key={gi}>
                    <MessageDateSeparator date={group.date} />
                    {group.messages.map(msg => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="shrink-0 px-3 py-3 border-t border-gray-200 bg-white">
            <div className="flex items-end gap-2">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => setShowMediaMenu(!showMediaMenu)}
                  disabled={sending}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                {showMediaMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMediaMenu(false)} />
                    <div className="absolute bottom-12 left-0 z-20 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 min-w-[180px]">
                      {MESSAGE_TYPES.map(item => (
                        <button
                          key={item.value}
                          onClick={() => {
                            if (item.value === 'location') {
                              sendLocation();
                            } else if (item.value === 'sticker') {
                              toast('Stiker funksiyasi tez orada');
                              setShowMediaMenu(false);
                            } else {
                              triggerFileSelect(item.value);
                            }
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <item.icon className="h-4 w-4 text-gray-500" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              <div className="flex-1 relative">
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={sending ? 'Yuborilmoqda...' : 'Xabar yozish...'}
                  disabled={sending}
                  rows={1}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 focus:bg-white transition-colors placeholder:text-gray-400 disabled:opacity-50"
                  style={{ minHeight: 38, maxHeight: 120 }}
                  onInput={e => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                  }}
                />
              </div>
              <Button
                onClick={handleSendText}
                disabled={!textInput.trim() || sending}
                className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white shrink-0 disabled:opacity-40"
                size="icon"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className={cn(
        'w-[320px] border-r border-gray-200 shrink-0 bg-white',
        'max-md:absolute max-md:inset-0 max-md:z-10',
        showMobileChat ? 'max-md:hidden' : ''
      )}>
        {leftPanel}
      </div>
      <div className={cn(
        'flex-1 flex flex-col bg-gray-50',
        'max-md:absolute max-md:inset-0 max-md:z-10',
        !showMobileChat ? 'max-md:hidden' : ''
      )}>
        {rightPanel}
      </div>
    </div>
  );
}
