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
import { leadSourcesApi, type LeadSource } from '@/api/leadSourcesApi';
import { groupsApi, type Group } from '@/api/groupsApi';
import {
  Users, Phone, Search, RefreshCw, MessageSquare, Loader2, Sparkles, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const statusConfig: Record<string, { label: string; class: string }> = {
  new: { label: 'Yangi', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  contacted: { label: "Bog'ilgan", class: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  interested: { label: 'Qiziqgan', class: 'bg-green-100 text-green-700 border-green-200' },
  not_interested: { label: 'Qiziqmagan', class: 'bg-red-100 text-red-700 border-red-200' },
  trial_registered: { label: 'Probniy dars', class: 'bg-orange-100 text-orange-700 border-orange-200' },
  enrolled: { label: "Ro'yxatdan o'tgan", class: 'bg-purple-100 text-purple-700 border-purple-200' },
  archived: { label: 'Arxiv', class: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [search, setSearch] = useState('');

  // Edit dialog
  const [showEdit, setShowEdit] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState({ status: '', notes: '', callback_date: '' });

  // Trial dialog
  const [showTrial, setShowTrial] = useState<Lead | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [trialLoading, setTrialLoading] = useState(false);

  // Inline status change
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [l, src] = await Promise.all([
        leadsApi.getAll(),
        leadSourcesApi.getAll(),
      ]);
      setAllLeads(l);
      setLeads(l);
      setSources(src);
    } catch { toast.error('Xatolik'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredLeads = useMemo(() => {
    let result = [...allLeads];
    if (filterStatus) {
      result = result.filter(l => l.status === filterStatus);
    }
    if (filterSource) {
      result = result.filter(l => String(l.source_id) === filterSource);
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
  }, [allLeads, filterStatus, filterSource, search]);

  const stats = useMemo(() => {
    const total = filteredLeads.length;
    const counts: Record<string, number> = { total };
    for (const lead of filteredLeads) {
      counts[lead.status] = (counts[lead.status] || 0) + 1;
    }
    return {
      total,
      new: counts['new'] || 0,
      contacted: counts['contacted'] || 0,
      interested: counts['interested'] || 0,
      not_interested: counts['not_interested'] || 0,
      trial_registered: counts['trial_registered'] || 0,
      enrolled: counts['enrolled'] || 0,
      archived: counts['archived'] || 0,
    };
  }, [filteredLeads]);

  useEffect(() => {
    setLeads(filteredLeads);
  }, [filteredLeads]);

  const clearFilters = useCallback(() => {
    setFilterStatus('');
    setFilterSource('');
    setSearch('');
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setStatusLoadingId(id);
    try {
      await leadsApi.update(id, { status: newStatus });
      toast.success(`Holat o'zgartirildi: ${statusConfig[newStatus]?.label || newStatus}`);
      const updated = allLeads.map(l => l.id === id ? { ...l, status: newStatus } : l);
      setAllLeads(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik');
    }
    finally { setStatusLoadingId(null); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    try {
      await leadsApi.update(showEdit.id, {
        status: editForm.status || undefined,
        notes: editForm.notes || undefined,
        callback_date: editForm.callback_date || undefined,
      });
      toast.success('Lead yangilandi');
      setShowEdit(null);
      loadData();
    } catch { toast.error('Xatolik'); }
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
    { label: "Bog'ilgan", value: stats.contacted, color: 'yellow' },
    { label: 'Qiziqgan', value: stats.interested, color: 'green' },
    { label: 'Probniy', value: stats.trial_registered, color: 'orange' },
    { label: "Ro'yxatdan o'tgan", value: stats.enrolled, color: 'purple' },
    { label: 'Qiziqmagan', value: stats.not_interested, color: 'red' },
  ];

  const StatusCell = ({ lead }: { lead: Lead }) => {
    const [changing, setChanging] = useState(false);
    return (
      <div className="flex items-center gap-1.5">
        <Badge className={statusConfig[lead.status]?.class || ''}>
          {statusConfig[lead.status]?.label || lead.status}
        </Badge>
        <Select
          value=""
          onValueChange={async (v) => {
            setChanging(true);
            await handleStatusChange(lead.id, v);
            setChanging(false);
          }}
          disabled={changing}
        >
          <SelectTrigger className="h-6 w-6 p-0 border-0 bg-transparent hover:bg-gray-100 rounded-full">
            <div className="flex items-center justify-center w-full">
              {changing ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="text-xs text-gray-400">✎</span>}
            </div>
          </SelectTrigger>
          <SelectContent align="end">
            {Object.entries(statusConfig).map(([k, v]) => (
              k !== lead.status && (
                <SelectItem key={k} value={k}>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${v.class.split(' ')[0]}`} />
                    {v.label}
                  </span>
                </SelectItem>
              )
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const anyFilterActive = filterStatus || filterSource || search;

  return (
    <Layout>
      <div className="space-y-5 p-6 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" /> CRM - Leadlar
            </h1>
            <p className="text-gray-500 text-sm">Barcha leadlarni boshqarish, holatlarni ozod o'zgartirish</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/leads/call-center')} className="text-green-700 border-green-300 hover:bg-green-50">
              <Phone className="h-4 w-4 mr-1.5" /> Call Center
            </Button>
            <Button variant="outline" onClick={() => router.push('/leads/trial')} className="text-orange-600 border-orange-300 hover:bg-orange-50">
              <Sparkles className="h-4 w-4 mr-1.5" /> Probniy
            </Button>
            <Button variant="outline" onClick={loadData}><RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Yangilash</Button>
          </div>
        </div>

        {/* Stats Cards - filtered stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {statCards.map((s, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className={`text-xl font-bold text-${s.color === 'orange' ? 'orange' : s.color}-600`}>{s.value}</p>
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
                  <SelectTrigger className="h-8 w-32 text-sm"><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Manba</Label>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="h-8 w-32 text-sm"><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {sources.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
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
            ) : leads.length === 0 ? (
              <div className="text-center py-14 text-gray-500">
                <Users className="h-14 w-14 mx-auto text-gray-300 mb-3" />
                <p className="font-medium">Leadlar mavjud emas</p>
                {anyFilterActive && <p className="text-sm mt-1">Filtrni tozalab qayta urinib ko'ring</p>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Ism / Familiya</TableHead>
                      <TableHead className="text-xs">Telefon</TableHead>
                      <TableHead className="text-xs">Manba</TableHead>
                      <TableHead className="text-xs">Izoh</TableHead>
                      <TableHead className="text-xs">Holat</TableHead>
                      <TableHead className="text-xs">Sana</TableHead>
                      <TableHead className="text-xs text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead, idx) => (
                      <TableRow key={lead.id} className="hover:bg-gray-50">
                        <TableCell className="text-gray-400 text-xs">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{lead.first_name} {lead.last_name}</TableCell>
                        <TableCell>
                          <a href={`tel:${lead.phone_number}`} className="text-blue-600 hover:underline flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3" /> {lead.phone_number}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-50 text-xs">{lead.source?.name || lead.source_platform || 'Organic'}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 max-w-[120px] truncate text-xs">{lead.comment || '-'}</TableCell>
                        <TableCell>
                          <StatusCell lead={lead} />
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString('uz-UZ')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => openTrialDialog(lead)}
                              className="text-orange-600 h-7 w-7 p-0"
                              title="Probniy darsga yozish"
                              disabled={lead.status === 'archived'}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => {
                                setShowEdit(lead);
                                setEditForm({ status: lead.status, notes: lead.notes || '', callback_date: lead.callback_date || '' });
                              }}
                              className="text-blue-600 h-7 w-7 p-0"
                              title="Batafsil"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
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

        {/* Edit Dialog */}
        <Dialog open={!!showEdit} onOpenChange={v => !v && setShowEdit(null)}>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <DialogTitle>Leadni boshqarish</DialogTitle>
              {showEdit && <DialogDescription>{showEdit.first_name} {showEdit.last_name} - {showEdit.phone_number}</DialogDescription>}
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Holat</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm({...editForm, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Qayta qo'ng'iroq sanasi</Label>
                <Input type="date" value={editForm.callback_date} onChange={e => setEditForm({...editForm, callback_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Izohlar</Label>
                <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm min-h-[100px]" placeholder="Call center izohlari..." />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEdit(null)}>Bekor qilish</Button>
                <Button type="submit" className="bg-blue-600 text-white">Saqlash</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Trial Dialog */}
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
