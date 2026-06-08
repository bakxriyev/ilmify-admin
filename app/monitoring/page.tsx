'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { auditApi, type AuditLog } from '@/api/auditApi';
import { useNotificationSocket } from '@/lib/useNotificationSocket';
import {
  Activity, Search, RefreshCw, ChevronLeft, ChevronRight, Clock, User, Hash, X, Radio,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700 border-green-200',
  update: 'bg-blue-100 text-blue-700 border-blue-200',
  delete: 'bg-red-100 text-red-700 border-red-200',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Yaratish',
  update: 'Tahrirlash',
  delete: "O'chirish",
};

const PAGE_SIZE = 20;

export default function MonitoringPage() {
  const [data, setData] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [liveCount, setLiveCount] = useState(0);
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());
  const tableRef = useRef<HTMLDivElement>(null);

  // Filters
  const [actions, setActions] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [filterAction, setFilterAction] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const loadFilters = async () => {
    try {
      const [acts, types] = await Promise.all([
        auditApi.getActions(),
        auditApi.getEntityTypes(),
      ]);
      setActions(acts);
      setEntityTypes(types);
    } catch { /* ignore */ }
  };

  const loadData = async (p: number) => {
    try {
      setLoading(true);
      setLiveCount(0);
      const res = await auditApi.getAll({
        page: p,
        limit: PAGE_SIZE,
        sort_order: sortOrder,
        ...(filterAction !== 'all' ? { action: filterAction } : {}),
        ...(filterEntity !== 'all' ? { entity_type: filterEntity } : {}),
        ...(search ? { search } : {}),
        ...(fromDate ? { from_date: fromDate } : {}),
        ...(toDate ? { to_date: toDate } : {}),
      });
      setData(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
      setPage(res.pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Real-time audit events
  const onAudit = useCallback((log: AuditLog) => {
    setData(prev => [log, ...prev].slice(0, PAGE_SIZE));
    setTotal(prev => prev + 1);
    setLiveCount(prev => prev + 1);
    setHighlightedIds(prev => new Set(prev).add(log.id));

    // Remove highlight after 3 seconds
    setTimeout(() => {
      setHighlightedIds(prev => {
        const next = new Set(prev);
        next.delete(log.id);
        return next;
      });
    }, 3000);

    const actionLabel = ACTION_LABELS[log.action] || log.action;
    const msg = log.description || `${actionLabel}: ${log.entity_type}`;
    toast.custom(
      (t) => (
        <div
          onClick={() => toast.dismiss(t.id)}
          className={`px-4 py-3 rounded-xl shadow-lg border cursor-pointer transition-all
            ${log.action === 'create' ? 'bg-green-50 border-green-200' :
              log.action === 'delete' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {log.action === 'create' ? '✅' : log.action === 'delete' ? '🗑️' : '✏️'}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">{log.admin_name}</p>
              <p className="text-xs text-gray-600">{msg}</p>
            </div>
          </div>
        </div>
      ),
      { duration: 3000, position: 'top-right' }
    );
  }, []);

  const onNotif = useCallback(() => {}, []);
  useNotificationSocket(onNotif, onAudit);

  useEffect(() => { loadFilters(); }, []);

  useEffect(() => {
    loadData(page);
  }, [page, filterAction, filterEntity, sortOrder]);

  const handleSearch = () => {
    setPage(1);
    loadData(1);
  };

  const handleReset = () => {
    setFilterAction('all');
    setFilterEntity('all');
    setSearch('');
    setFromDate('');
    setToDate('');
    setSortOrder('desc');
    setPage(1);
    setLiveCount(0);
    loadData(1);
  };

  const handleRefresh = () => {
    setPage(1);
    setLiveCount(0);
    loadData(1);
  };

  const formatDateTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatTimeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 10) return 'hozir';
    if (sec < 60) return `${sec} soniya oldin`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} daqiqa oldin`;
    return formatDateTime(d);
  };

  const hasFilters = filterAction !== 'all' || filterEntity !== 'all' || search || fromDate || toDate;

  const renderPagination = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 2);
      let end = Math.min(totalPages - 1, page + 2);
      if (page <= 3) { start = 2; end = Math.min(totalPages - 1, 5); }
      if (page >= totalPages - 2) { start = Math.max(2, totalPages - 4); end = totalPages - 1; }
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" /> Monitoring
            </h1>
            <p className="text-gray-500">Tizimdagi barcha amallar kuzatuvi</p>
          </div>
          <div className="flex gap-2">
            {liveCount > 0 && (
              <Button
                variant="outline"
                onClick={() => { setPage(1); setLiveCount(0); }}
                className="border-green-300 bg-green-50 text-green-700 animate-pulse hover:bg-green-100"
              >
                <Radio className="h-4 w-4 mr-2" />
                {liveCount} ta yangi
              </Button>
            )}
            <Button variant="outline" onClick={handleRefresh} className="border-gray-300">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Yangilash
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Amal turi</Label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {actions.map(a => (
                      <SelectItem key={a} value={a}>{ACTION_LABELS[a] || a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Ob'yekt turi</Label>
                <Select value={filterEntity} onValueChange={setFilterEntity}>
                  <SelectTrigger><SelectValue placeholder="Barchasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {entityTypes.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Admin nomi</Label>
                <Input
                  placeholder="Qidirish..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Sanadan</Label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Sanagacha</Label>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                  <Search className="h-4 w-4 mr-2" /> Qidirish
                </Button>
                {hasFilters && (
                  <Button variant="outline" onClick={handleReset} className="border-gray-300">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0" ref={tableRef}>
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Activity className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>Hech qanday log topilmadi</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" /> ID
                          </div>
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" /> Admin
                          </div>
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Amal</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Ob'yekt</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Tavsif</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Vaqt
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.map((log) => (
                        <tr
                          key={log.id}
                          className={`transition-all duration-1000 ${
                            highlightedIds.has(log.id)
                              ? 'bg-blue-50/70 shadow-inner scale-[1.002]'
                              : 'hover:bg-gray-50/50'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {highlightedIds.has(log.id) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              )}
                              <span className="text-gray-400 font-mono text-xs">{log.id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900">{log.admin_name}</span>
                              {highlightedIds.has(log.id) && (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                                  LIVE
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                              {ACTION_LABELS[log.action] || log.action}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-gray-900 font-medium">{log.entity_name || '-'}</span>
                              <span className="text-gray-400 text-xs">{log.entity_type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.description || '-'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1" title={formatDateTime(log.created_at)}>
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(log.created_at)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                      Jami: <strong>{total}</strong> ta
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {renderPagination().map((p, i) =>
                        typeof p === 'string' ? (
                          <span key={`ellipsis-${i}`} className="px-1 text-gray-400">...</span>
                        ) : (
                          <Button
                            key={p}
                            variant={p === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(p)}
                            className={`h-8 min-w-[32px] px-2 ${p === page ? 'bg-blue-600 text-white' : ''}`}
                          >
                            {p}
                          </Button>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
