'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Loader2 } from 'lucide-react';
import { groupsApi } from '@/api/groupsApi';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  onSuccess?: () => void;
}

export default function GenerateLessonsModal({ open, onOpenChange, groupId, onSuccess }: Props) {
  const [startDate, setStartDate] = useState('');
  const [durationMonths, setDurationMonths] = useState('1');
  const [time, setTime] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [parity, setParity] = useState<'odd' | 'even' | 'both'>('odd');
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!startDate || !time || !parity) {
      toast.error('Start date, vaqt va kun turini kiriting');
      return;
    }

    setSaving(true);
    try {
      const res = await groupsApi.generateLessons(groupId, {
        start_date: startDate,
        duration_months: Number(durationMonths),
        time,
        parity,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
      });
      toast.success(`${res.created} ta dars yaratildi`);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" /> Darslar yaratish
          </DialogTitle>
          <DialogDescription>Guruh uchun avtomatik darslar yaratish</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Boshlanish sanasi</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div>
            <Label>Necha oy davom etadi</Label>
            <Input type="number" min={1} max={36} value={durationMonths} onChange={e => setDurationMonths(e.target.value)} />
          </div>

          <div>
            <Label>Kun turi</Label>
            <Select value={parity} onValueChange={(v: 'odd' | 'even') => setParity(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="odd">Toq kunlar (Dush, Chor, Juma)</SelectItem>
                <SelectItem value="even">Juft kunlar (Sesh, Pay, Shanba)</SelectItem>
                <SelectItem value="both">Har kuni (Dush-Shanba)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Dars vaqti</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
            <div>
              <Label>Boshlanish</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>Tugash</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
          <Button onClick={handleGenerate} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
            Darslar yaratish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
