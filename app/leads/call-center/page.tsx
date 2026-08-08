'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { leadsApi, type Lead } from '@/api/leadsApi';
import { groupsApi, type Group } from '@/api/groupsApi';
import {
  Phone, Search, RefreshCw, Loader2, Sparkles, X, Users, UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ccStatusConfig: Record<string, { label: string; class: string }> = {
  new: { label: 'Yangi', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  contacted: { label: "Gaplashildi", class: 'bg-green-100 text-green-700 border-green-200' },
  interested: { label: "Keladi", class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  not_interested: { label: "Kelmaydi", class: 'bg-red-100 text-red-700 border-red-200' },
  trial_registered: { label: 'Probniy dars', class: 'bg-orange-100 text-orange-700 border-orange-200' },
  enrolled: { label: "Ro'yxatdan o'tgan", class: 'bg-purple-100 text-purple-700 border-purple-200' },
  archived: { label: 'Arxiv', class: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const ccStatusOrder = ['new', 'contacted', 'interested', 'not_interested', 'trial_registered', 'enrolled', 'archived'];

export default function CallCenterPage() {
  const router = useRouter();
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const [showTrial, setShowTrial] = useState<Lead | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [trialLoading, setTrialLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const l = await leadsApi.getAll({ exclude_status: 'archived' });
      setAllLeads(l);
    } catch { toast.error('Xatolik'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredLeads = useMemo(() => {
    let result = [...allLeads];
    if (filterStatus) {
      result = result.filter(l => l.status === filterStatus);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.first_name.toLowerCase().includes(q) ||
        l.last_name.toLowerCase().includes(q) ||
        l.phone_number.includes(q)
      );
    }
    return result;
  }, [allLeads, filterStatus, search]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const lead of filteredLeads) {
      counts[lead.status] = (counts[lead.status] || 0) + 1;
    }
    return {
      total: filteredLeads.length,
      new: counts['new'] || 0,
      contacted: counts['contacted'] || 0,
      interested: counts['interested'] || 0,
      not_interested: counts['not_interested'] || 0,
      trial_registered: counts['trial_registered'] || 0,
    };
  }, [filteredLeads]);

  const clearFilters = useCallback(() => {
    setFilterStatus('');
    setSearch('');
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setStatusLoadingId(id);
    try {
      await leadsApi.update(id, { status: newStatus });
      toast.success(`Holat o'zgartirildi`);
      setAllLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik');
    }
    finally { setStatusLoadingId(null); }
  };

  const openTrialDialog = async (lead: Lead) => {
    setShowTrial(lead);
    setSelectedGroupId('');
    setTrialLoading(true);
    try {
      const res = await groupsApi.getAll({ limit: 100 });
      setGroups(res.data || []);
    } catch { toast.error('Guruhlarni yuklashda xatolik'); }
    finally { setTrialLoading(false); }
  };

  const handleRegisterTrial = async () => {
    if (!showTrial || !selectedGroupId) return;
    setTrialLoading(true);
    try {
      await leadsApi.registerTrial(showTrial.id, { group_id: Number(selectedGroupId) });
      toast.success('Probniy darsga yozildi');
      setShowTrial(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik');
    }
    finally { setTrialLoading(false); }
  };

  const statCards = [
    { label: 'Jami', value: stats.total, color: 'blue' },
    { label: 'Yangi', value: stats.new, color: 'blue' },
    { label: "Gaplashildi", value: stats.contacted, color: 'green' },
    { label: 'Keladi', value: stats.interested, color: 'emerald' },
    { label: "Kelmaydi", value: stats.not_interested, color: 'red' },
    { label: 'Probniy', value: stats.trial_registered, color: 'orange' },
  ];

  const anyFilterActive = filterStatus || search;

  return (
    <Layout>
      <div className="space-y-5 p-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Phone className="h-6 w-6 text-green-600" /> Call Center
            </h1>
            <p className="text-gray-500 text-sm">Qo'ng'iroq qilish, holatlarni o'zgartirish, probniy darsga yozish</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/leads')} className="text-blue-600 border-blue-300">
              <Users className="h-4 w-4 mr-1.5" /> Barcha leadlar
            </Button>
            <Button variant="outline" onClick={() => router.push('/leads/trial')} className="text-orange-600 border-orange-300 hover:bg-orange-50">
              <Sparkles className="h-4 w-4 mr-1.5" /> Probniy
            </Button>
            <Button variant="outline" onClick={loadData}><RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Yangilash</Button>
          </div>
        </div>

        {/* Stats - filtered */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {statCards.map((s, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className={`text-xl font-bold text-${s.color}-600`}>{s.value}</p>
                <p className="text-[10px] text-gray-500 truncate">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-[10px]">Qidirish</Label>
                <Input
                  placeholder="Ism, familiya, telefon..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-[10px]">Holat</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {ccStatusOrder.map(k => {
                      const v = ccStatusConfig[k];
                      if (!v) return null;
                      return <SelectItem key={k} value={k}>{v.label}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              {anyFilterActive && (
                <Button size="sm" variant="ghost" onClick={clearFilters} className="h-8 text-sm text-gray-500">
                  <X className="h-3.5 w-3.5 mr-1" /> Tozalash
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-14 text-gray-500">
                <Phone className="h-14 w-14 mx-auto text-gray-300 mb-3" />
                <p className="font-medium">Leadlar mavjud emas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Ism / Familiya</TableHead>
                      <TableHead className="text-xs">Telefon</TableHead>
                      <TableHead className="text-xs">Kurslar</TableHead>
                      <TableHead className="text-xs">Holat</TableHead>
                      <TableHead className="text-xs">Sana</TableHead>
                      <TableHead className="text-xs text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead, idx) => (
                      <TableRow key={lead.id} className="hover:bg-green-50/30">
                        <TableCell className="text-gray-400 text-xs">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{lead.first_name} {lead.last_name}</TableCell>
                        <TableCell>
                          <a href={`tel:${lead.phone_number}`} className="text-green-700 font-medium hover:underline flex items-center gap-1 text-sm">
                            <Phone className="h-3.5 w-3.5" /> {lead.phone_number}
                          </a>
                        </TableCell>
                        <TableCell className="text-gray-500 max-w-[140px] truncate text-xs">{lead.courses || lead.comment || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {statusLoadingId === lead.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            ) : (
                              <Badge className={ccStatusConfig[lead.status]?.class || ''}>
                                {ccStatusConfig[lead.status]?.label || lead.status}
                              </Badge>
                            )}
                            <Select
                              value=""
                              onValueChange={(v) => handleStatusChange(lead.id, v)}
                              disabled={statusLoadingId === lead.id}
                            >
                              <SelectTrigger className="h-6 w-6 p-0 border-0 bg-transparent hover:bg-gray-100 rounded-full">
                                <span className="text-xs text-gray-400">✎</span>
                              </SelectTrigger>
                              <SelectContent align="end">
                                {ccStatusOrder.map(k => {
                                  const v = ccStatusConfig[k];
                                  if (!v || k === lead.status) return null;
                                  return (
                                    <SelectItem key={k} value={k}>
                                      <span className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${v.class.split(' ')[0]}`} />
                                        {v.label}
                                      </span>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString('uz-UZ')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => openTrialDialog(lead)}
                              className="text-orange-600 h-7 px-2 text-xs"
                              title="Probniyga o'tkazish"
                              disabled={lead.status === 'archived'}
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1" /> Probniy
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => handleStatusChange(lead.id, 'not_interested')}
                              className="text-red-600 h-7 w-7 p-0"
                              title="Kelmaydi"
                              disabled={lead.status === 'archived' || lead.status === 'not_interested'}
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => {
                                window.open(`tel:${lead.phone_number}`, '_self');
                                handleStatusChange(lead.id, 'contacted');
                              }}
                              className="text-green-600 h-7 w-7 p-0"
                              title="Qo'ng'iroq qilish"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!showTrial} onOpenChange={v => !v && setShowTrial(null)}>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" /> Probniy darsga yozish
              </DialogTitle>
              {showTrial && <DialogDescription>{showTrial.first_name} {showTrial.last_name} - {showTrial.phone_number}</DialogDescription>}
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Guruhni tanlang</Label>
                {trialLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Guruhlar yuklanmoqda...</div>
                ) : (
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger><SelectValue placeholder="Guruhni tanlang" /></SelectTrigger>
                    <SelectContent>
                      {groups.map(g => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.name} {g.level ? `(${g.level.name})` : ''} - {g.student_count || 0} o'quvchi
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTrial(null)}>Bekor qilish</Button>
              <Button onClick={handleRegisterTrial} disabled={!selectedGroupId || trialLoading} className="bg-orange-600 text-white hover:bg-orange-700">
                {trialLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yuklanmoqda...</> : 'Probniy darsga yozish'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
