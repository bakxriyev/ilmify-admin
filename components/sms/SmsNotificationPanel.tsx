'use client';

import { useState } from 'react';
import { Send, Loader2, Smartphone, Users, MessageSquare, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useSendSms } from '@/hooks/useSms';
import type { SmsTemplate } from '@/types/sms.types';
import toast from 'react-hot-toast';

interface Props {
  templates: SmsTemplate[];
  centerId: number;
}

export default function SmsNotificationPanel({ templates, centerId }: Props) {
  const [recipientType, setRecipientType] = useState<'single' | 'bulk'>('single');
  const [phone, setPhone] = useState('');
  const [phones, setPhones] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const { send, sendBulk, sending } = useSendSms();

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  const resolvedMessage = currentTemplate
    ? Object.entries(variables).reduce((msg, [key, val]) => msg.replace(new RegExp(`{${key}}`, 'g'), val || ''), currentTemplate.body)
    : customMessage;

  const charCount = resolvedMessage.length;

  const recipientsList = recipientType === 'single'
    ? [{ phone, message: resolvedMessage }]
    : phones.split('\n').map(line => line.trim()).filter(Boolean).map(p => ({ phone: p, message: resolvedMessage }));

  const handleSend = async () => {
    setShowConfirm(false);
    let res;
    if (recipientType === 'single') {
      res = await send({ phone, message: resolvedMessage });
    } else {
      res = await sendBulk({ messages: recipientsList });
    }
    if (res.success) {
      const data = res.data;
      setResult({ success: data?.success || 0, failed: data?.failed || 0 });
      toast.success(`SMS yuborildi: ${data?.success || 0} ta muvaffaqiyatli`);
    } else {
      toast.error(res.error || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" /> SMS yuborish
          </h3>

          {/* Recipient type toggle */}
          <div className="flex gap-2">
            <Button variant={recipientType === 'single' ? 'default' : 'outline'} size="sm" onClick={() => setRecipientType('single')}>
              <Smartphone className="h-4 w-4 mr-1" /> Bitta
            </Button>
            <Button variant={recipientType === 'bulk' ? 'default' : 'outline'} size="sm" onClick={() => setRecipientType('bulk')}>
              <Users className="h-4 w-4 mr-1" /> Ko'p
            </Button>
          </div>

          {/* Phone input(s) */}
          {recipientType === 'single' ? (
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998901234567" />
          ) : (
            <Textarea value={phones} onChange={e => setPhones(e.target.value)} placeholder="+998901234567&#10;+998907654321&#10;Har bir raqam yangi qatordan" rows={4} />
          )}

          {/* Template selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Shablon tanlash</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {templates.map(t => (
                <Button key={t.id} variant={selectedTemplate === t.id ? 'default' : 'outline'} size="sm" className="justify-start h-auto py-2" onClick={() => { setSelectedTemplate(t.id); setCustomMessage(''); }}>
                  <MessageSquare className="h-4 w-4 mr-1 shrink-0" />
                  <span className="text-xs truncate">{t.title}</span>
                </Button>
              ))}
              <Button variant={selectedTemplate === null ? 'default' : 'outline'} size="sm" onClick={() => { setSelectedTemplate(null); setCustomMessage(''); }}>
                Maxsus xabar
              </Button>
            </div>
          </div>

          {/* Variables form */}
          {currentTemplate && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
              {currentTemplate.variables.map(v => (
                <div key={v}>
                  <label className="text-xs text-gray-500">{v}</label>
                  <Input value={variables[v] || ''} onChange={e => setVariables({ ...variables, [v]: e.target.value })} placeholder={`{${v}}`} className="text-sm" />
                </div>
              ))}
            </div>
          )}

          {/* Custom message */}
          {!currentTemplate && (
            <Textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="SMS matnini kiriting..." rows={3} />
          )}

          {/* Character count + preview */}
          <div className="flex items-center justify-between text-sm">
            <span className={charCount > 160 ? 'text-red-500' : 'text-gray-500'}>
              {charCount}/160 belgi
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-1" /> Ko'rinish
            </Button>
          </div>

          {showPreview && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-medium text-blue-700 mb-1">SMS ko'rinishi:</p>
              <p className="text-gray-700 whitespace-pre-wrap">{resolvedMessage}</p>
              <p className="text-xs text-gray-400 mt-1">~ {recipientsList.length} ta SMS, taxminan {(recipientsList.length * 25).toLocaleString()} so'm</p>
            </div>
          )}

          {/* Send button */}
          <Button onClick={() => setShowConfirm(true)} disabled={!resolvedMessage || recipientsList.length === 0 || sending} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {recipientsList.length} ta qabul qiluvchiga SMS yuborish
          </Button>

          {/* Result */}
          {result && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              {result.failed > 0 ? <XCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
              <span className="text-sm">{result.success} ta muvaffaqiyatli, {result.failed} ta xato</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> SMS yuborilsinmi?</DialogTitle>
            <DialogDescription>
              {recipientsList.length} ta qabul qiluvchiga SMS yuboriladi. Taxminiy narx: {(recipientsList.length * 25).toLocaleString()} so'm
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Bekor qilish</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Ha, yuborish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
