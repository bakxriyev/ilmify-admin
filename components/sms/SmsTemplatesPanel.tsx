'use client';

import { useState, useEffect } from 'react';
import { FileText, MessageSquare, Eye, Copy, CheckCircle, Smartphone, BookOpen, User, Key, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { smsApi } from '@/api/smsApi';
import type { SmsTemplate } from '@/types/sms.types';
import toast from 'react-hot-toast';

const variableDescriptions: Record<string, string> = {
  ism: "Studentning ismi",
  familiya: "Studentning familiyasi",
  markaz: "O'quv markaz nomi",
  login: "Student login (telefon)",
  password: "Student paroli",
  bot: "Bot havolasi",
  oy: "To'lov oyi (masalan: Yanvar)",
  summa: "To'lov summasi",
};

const templateIcons: Record<string, any> = {
  login_credentials: Key,
  debt_reminder: AlertTriangle,
};

export default function SmsTemplatesPanel() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await smsApi.getTemplates();
        setTemplates(res || []);
      } catch { setTemplates([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const copyTemplate = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success('Shablon nusxalandi');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Shablonlar mavjud emas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-blue-600" /> SMS shablonlari
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Eskizda tasdiqlangan shablonlar. O'zgaruvchilar {'{ism}'}, {'{familiya}'}, {'{markaz}'} kabi joylarga 
            student ma'lumotlari avtomatik qo'yiladi.
          </p>

          <div className="space-y-4">
            {templates.map(t => {
              const Icon = templateIcons[t.id] || MessageSquare;
              return (
                <div key={t.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{t.title}</p>
                        <p className="text-xs text-gray-400">Kategoriya: {t.category}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      {t.variables.length} ta o'zgaruvchi
                    </Badge>
                  </button>

                  {expandedId === t.id && (
                    <div className="px-4 pb-4 space-y-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-700 mb-1 flex items-center gap-1">
                          <Eye className="h-4 w-4" /> Shablon matni:
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.body}</p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">O'zgaruvchilar:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {t.variables.map(v => (
                            <div key={v} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <Badge variant="outline" className="bg-white text-gray-700 font-mono text-xs">
                                {'{'}{v}{'}'}
                              </Badge>
                              <span className="text-xs text-gray-500">{variableDescriptions[v] || v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => copyTemplate(t.body)}>
                          <Copy className="h-4 w-4 mr-1" /> Nusxalash
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
