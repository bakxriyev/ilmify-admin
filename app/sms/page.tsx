'use client';

import { useState, useEffect } from 'react';
import { MessageSquareText, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import SmsNotificationPanel from '@/components/sms/SmsNotificationPanel';
import SmsLogTable from '@/components/sms/SmsLogTable';
import SmsStatsDashboard from '@/components/sms/SmsStatsDashboard';
import SmsSettings from '@/components/sms/SmsSettings';
import SmsTemplatesPanel from '@/components/sms/SmsTemplatesPanel';
import { smsApi } from '@/api/smsApi';
import { getCenterIdOrThrow } from '@/api/telegramBotApi';
import type { SmsTemplate } from '@/types/sms.types';

type Tab = 'send' | 'templates' | 'history' | 'stats' | 'settings';

export default function SmsPage() {
  const [centerId, setCenterId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('send');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cid = await getCenterIdOrThrow();
        setCenterId(cid);
        const tmpl = await smsApi.getTemplates();
        setTemplates(tmpl || []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
    </Layout>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'send', label: 'Yuborish' },
    { key: 'templates', label: 'Shablonlar' },
    { key: 'history', label: 'Tarix' },
    { key: 'stats', label: 'Statistika' },
    { key: 'settings', label: 'Sozlamalar' },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquareText className="h-6 w-6 text-blue-600" /> SMS xabarnoma
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b pb-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === t.key ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'send' && centerId && <SmsNotificationPanel templates={templates} centerId={centerId} />}
        {activeTab === 'templates' && <SmsTemplatesPanel />}
        {activeTab === 'history' && <SmsLogTable />}
        {activeTab === 'stats' && <SmsStatsDashboard />}
        {activeTab === 'settings' && <SmsSettings templates={templates} />}
      </div>
    </Layout>
  );
}
