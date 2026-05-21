'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bot, Send, FileText, MessageSquare, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Layout from '@/components/Layout';

const subNav = [
  { label: 'Bot ulash', path: '/telegram-bot', icon: Bot },
  { label: 'Foydalanuvchilar', path: '/telegram-bot/users', icon: Users },
  { label: 'Xabar yuborish', path: '/telegram-bot/send', icon: Send },
  { label: 'Shablonlar', path: '/telegram-bot/templates', icon: FileText },
  { label: 'Xabarlar', path: '/telegram-bot/inbox', icon: MessageSquare },
  { label: 'Tarix', path: '/telegram-bot/history', icon: Clock },
];

export default function TelegramBotLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Bot className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Telegram Bot</h1>
        </div>

        <nav className="flex gap-1 border-b border-gray-200 pb-1 overflow-x-auto">
          {subNav.map(item => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </Layout>
  );
}
