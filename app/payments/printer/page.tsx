'use client';

import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { printerAgentApi, type PrinterAgent, type PrinterJob, type AgentStatusResponse } from '@/api/printerAgentApi';
import {
  PrinterIcon, Download, RefreshCw, Wifi, WifiOff, Monitor,
  Cpu, HardDrive, Globe, Monitor as MonitorIcon, Clock,
  Trash2, Play, XCircle, RotateCcw, Plug, Zap, AlertTriangle,
  CheckCircle, XCircle as XIcon, Loader2, List, Activity,
  Settings2, ChevronLeft, ChevronRight, CornerUpLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  online: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  offline: 'bg-red-100 text-red-700 border-red-200',
  not_installed: 'bg-gray-100 text-gray-500 border-gray-200',
};

const statusLabels: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  not_installed: "O'rnatilmagan",
};

const jobStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  printing: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const printerModels = ['XP-80TS', 'XP-T80', 'XP-58', 'XP-365B', 'XP-370B'];

export default function PrinterManagementPage() {
  const [agents, setAgents] = useState<PrinterAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusInfo, setStatusInfo] = useState<AgentStatusResponse | null>(null);
  const [jobs, setJobs] = useState<PrinterJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsTotalPages, setJobsTotalPages] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<PrinterAgent | null>(null);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrinterModel, setEditPrinterModel] = useState('');
  const [editEnabled, setEditEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('agents');

  const loadAgents = async () => {
    setLoading(true);
    try {
      const data = await printerAgentApi.getAll();
      setAgents(data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const loadStatus = async () => {
    try {
      const data = await printerAgentApi.getStatus();
      setStatusInfo(data);
    } catch { /* ignore */ }
  };

  const loadJobs = async (page = 1) => {
    setJobsLoading(true);
    try {
      const data = await printerAgentApi.getJobs({ page, limit: 15 });
      setJobs(data.rows || []);
      setJobsPage(data.page);
      setJobsTotalPages(data.totalPages);
    } catch { /* ignore */ }
    setJobsLoading(false);
  };

  useEffect(() => {
    loadAgents();
    loadStatus();
    loadJobs();
  }, []);

  const openEdit = (agent: PrinterAgent) => {
    setSelectedAgent(agent);
    setEditName(agent.computer_name || '');
    setEditPrinterModel(agent.printer_model || '');
    setEditEnabled(agent.enabled);
    setShowAgentDialog(true);
  };

  const handleSave = async () => {
    if (!selectedAgent) return;
    setSaving(true);
    try {
      await printerAgentApi.update(selectedAgent.id, {
        name: editName,
        printer_model: editPrinterModel,
        enabled: editEnabled,
      });
      toast.success('Agent yangilandi');
      setShowAgentDialog(false);
      loadAgents();
    } catch { toast.error('Xatolik yuz berdi'); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await printerAgentApi.remove(id);
      toast.success('Agent o\'chirildi');
      setShowDeleteConfirm(null);
      loadAgents();
      loadStatus();
    } catch { toast.error('Xatolik yuz berdi'); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = printerAgentApi.downloadUrl();
      const a = document.createElement('a');
      a.href = url;
      a.download = 'EduCRM-Print-Agent-Setup.exe';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Yuklab olish boshlandi');
    } catch {
      toast.error('Fayl topilmadi. Administratorga murojaat qiling.');
    }
    setDownloading(false);
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      await printerAgentApi.testPrint(id);
      toast.success('Test chek yuborildi');
    } catch {
      toast.error('Test chek yuborishda xatolik');
    }
    setTestingId(null);
  };

  const handleRestart = async (id: number) => {
    try {
      await printerAgentApi.restartAgent(id);
      toast.success('Qayta ishga tushirish buyrug\'i yuborildi');
    } catch { toast.error('Xatolik'); }
  };

  const handleReconnect = async (id: number) => {
    try {
      await printerAgentApi.reconnectAgent(id);
      toast.success('Qayta ulanish buyrug\'i yuborildi');
    } catch { toast.error('Xatolik'); }
  };

  const handleUpdate = async (id: number) => {
    try {
      await printerAgentApi.updateAgent(id);
      toast.success('Yangilash buyrug\'i yuborildi');
    } catch { toast.error('Xatolik'); }
  };

  const handleRetryJob = async (id: number) => {
    try {
      await printerAgentApi.retryJob(id);
      toast.success('Job qayta urinishga yuborildi');
      loadJobs(jobsPage);
    } catch { toast.error('Xatolik'); }
  };

  const handleCancelJob = async (id: number) => {
    try {
      await printerAgentApi.cancelJob(id);
      toast.success('Job bekor qilindi');
      loadJobs(jobsPage);
    } catch (e: any) { toast.error(e?.message || 'Xatolik'); }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    const dt = new Date(d);
    const months = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek'];
    return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  };

  const agentCount = statusInfo?.total || 0;
  const onlineCount = statusInfo?.online || 0;
  const offlineCount = statusInfo?.offline || 0;

  const handleRefreshAll = () => {
    loadAgents();
    loadStatus();
    loadJobs(jobsPage);
    toast.success('Yangilandi');
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 w-full max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-sm">
              <PrinterIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Printer sozlamalari</h1>
              <p className="text-gray-400 text-xs mt-0.5">Print Agent orqali printerlarni boshqarish</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefreshAll} className="h-8 text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Yangilash
            </Button>
            <Button onClick={handleDownload} disabled={downloading} className="h-8 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white">
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Print Agent yuklash
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2">
              <MonitorIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">Jami agentlar</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{agentCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-gray-500">Online</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{onlineCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-red-400" />
              <span className="text-xs text-gray-500">Offline</span>
            </div>
            <p className="text-2xl font-bold text-red-500 mt-1">{offlineCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-gray-500">Navbatdagi joblar</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">{jobs.filter(j => j.status === 'pending' || j.status === 'printing').length}</p>
          </div>
        </div>

        {/* Download Agent Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 md:p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">EduCRM Print Agent</h3>
                <p className="text-purple-100 text-xs mt-0.5 max-w-md">
                  Windows kompyuteringizga Print Agent dasturini o'rnating. Printerlarni CRM orqali boshqaring.
                  Agent USB va LAN printerlarni qo'llab-quvvatlaydi.
                </p>
              </div>
            </div>
            <Button onClick={handleDownload} disabled={downloading} className="shrink-0 bg-white text-purple-700 hover:bg-purple-50 h-10 text-sm font-semibold gap-2 px-6">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Yuklab olish
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 text-[11px] text-purple-200">
            <span>• Windows Service</span>
            <span>• Avtomatik ulanish</span>
            <span>• ESC/POS qo'llab-quvvatlash</span>
            <span>• QR Code</span>
            <span>• Offline navbat</span>
            <span>• Avtomatik yangilanish</span>
          </div>
        </div>

        {/* Main Tabs: Agents | Jobs | Logs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
            <TabsTrigger value="agents" className="text-xs data-[state=active]:bg-white rounded-md gap-1.5">
              <MonitorIcon className="h-3.5 w-3.5" /> Agentlar
            </TabsTrigger>
            <TabsTrigger value="jobs" className="text-xs data-[state=active]:bg-white rounded-md gap-1.5">
              <List className="h-3.5 w-3.5" /> Print navbati
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs data-[state=active]:bg-white rounded-md gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Loglar
            </TabsTrigger>
          </TabsList>

          {/* ─── Agents Tab ─── */}
          <TabsContent value="agents" className="mt-4 space-y-4">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
            ) : agents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <PrinterIcon className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-semibold">Agentlar mavjud emas</p>
                <p className="text-gray-300 text-xs mt-1">Print Agent dasturini yuklab o'rnating</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {agents.map(agent => (
                  <div key={agent.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Agent Info */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className={`p-3 rounded-xl ${
                          agent.status === 'online' ? 'bg-emerald-50' :
                          agent.status === 'offline' ? 'bg-red-50' : 'bg-gray-50'
                        }`}>
                          {agent.status === 'online'
                            ? <Wifi className="h-5 w-5 text-emerald-600" />
                            : <WifiOff className="h-5 w-5 text-gray-400" />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900">{agent.computer_name || agent.agent_id}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusColors[agent.status] || ''}`}>
                              {statusLabels[agent.status] || agent.status}
                            </span>
                            {!agent.enabled && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">O'chirilgan</span>}
                            {agent.update_available && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">Yangilanish mavjud</span>}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 mt-2 text-[11px] text-gray-500">
                            <span>Windows: {agent.windows_user || '-'}</span>
                            <span>OS: {agent.os_version || '-'}</span>
                            <span>IP: {agent.local_ip || '-'}</span>
                            <span>Agent: v{agent.agent_version || '-'}</span>
                            <span>CPU: {agent.cpu_usage || 0}%</span>
                            <span>RAM: {agent.memory_usage || 0}%</span>
                            <span>Printer: {agent.connected_printer || agent.printer_model || '-'}</span>
                            <span>Oxirgi: {formatDate(agent.last_heartbeat)}</span>
                          </div>
                          {agent.last_error && (
                            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                              <AlertTriangle className="h-3 w-3" /> {agent.last_error}
                            </div>
                          )}
                          {/* Status indicators */}
                          <div className="flex items-center gap-3 mt-2 text-[10px]">
                            {agent.paper_out && <Badge variant="outline" className="text-[10px] h-5 border-amber-200 text-amber-700 bg-amber-50">Qog'oz yo'q</Badge>}
                            {agent.cover_open && <Badge variant="outline" className="text-[10px] h-5 border-red-200 text-red-700 bg-red-50">Qopqoq ochiq</Badge>}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        {agent.status === 'online' && (
                          <button onClick={() => handleTest(agent.id)} disabled={testingId === agent.id}
                            className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium transition-colors flex items-center gap-1">
                            {testingId === agent.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                            Test
                          </button>
                        )}
                        <button onClick={() => handleRestart(agent.id)}
                          className="h-8 px-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-medium transition-colors flex items-center gap-1">
                          <RotateCcw className="h-3 w-3" /> Qayta ishga tushirish
                        </button>
                        <button onClick={() => handleReconnect(agent.id)}
                          className="h-8 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors flex items-center gap-1">
                          <Plug className="h-3 w-3" /> Qayta ulash
                        </button>
                        {agent.update_available && (
                          <button onClick={() => handleUpdate(agent.id)}
                            className="h-8 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-colors flex items-center gap-1">
                            <Zap className="h-3 w-3" /> Yangilash
                          </button>
                        )}
                        <button onClick={() => openEdit(agent)}
                          className="h-8 px-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium transition-colors flex items-center gap-1">
                          <Settings2 className="h-3 w-3" /> Sozlamalar
                        </button>
                        <button onClick={() => setShowDeleteConfirm(agent.id)}
                          className="h-8 w-8 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors flex items-center justify-center">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Printer monitoring */}
                    {agent.status === 'online' && (
                      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] text-gray-500">
                        <div className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} /> Online</div>
                        <div className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${agent.paper_out ? 'bg-red-500' : 'bg-emerald-500'}`} /> Qog'oz {agent.paper_out ? 'yo\'q' : 'bor'}</div>
                        <div className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${agent.cover_open ? 'bg-red-500' : 'bg-emerald-500'}`} /> Qopqoq {agent.cover_open ? 'ochiq' : 'yopiq'}</div>
                        <div className="flex items-center gap-1"><Cpu className="h-3 w-3" /> CPU {agent.cpu_usage || 0}%</div>
                        <div className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> RAM {agent.memory_usage || 0}%</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Jobs Tab ─── */}
          <TabsContent value="jobs" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Print joblari</h3>
              <Button variant="outline" size="sm" onClick={() => loadJobs(jobsPage)} className="h-7 text-xs">
                <RefreshCw className={`h-3 w-3 mr-1 ${jobsLoading ? 'animate-spin' : ''}`} /> Yangilash
              </Button>
            </div>

            {/* Job status filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'pending', 'printing', 'completed', 'failed', 'cancelled'].map(s => (
                <button key={s} onClick={() => { setJobsPage(1); loadJobs(1); /* filter not implemented in API */ }}
                  className={`text-[10px] px-2.5 py-1 rounded-full font-medium border transition-colors ${
                    s === 'all' ? 'bg-gray-100 text-gray-600 border-gray-200' : `${jobStatusColors[s] || 'bg-gray-50 text-gray-500'} border-transparent`
                  }`}>
                  {s === 'all' ? 'Barchasi' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {jobsLoading ? (
              <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                <List className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Joblar mavjud emas</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-2.5 px-3 text-gray-400 font-semibold">ID</th>
                        <th className="text-left py-2.5 px-3 text-gray-400 font-semibold">Chek</th>
                        <th className="text-left py-2.5 px-3 text-gray-400 font-semibold">Status</th>
                        <th className="text-left py-2.5 px-3 text-gray-400 font-semibold">Xatolik</th>
                        <th className="text-left py-2.5 px-3 text-gray-400 font-semibold">Urinish</th>
                        <th className="text-left py-2.5 px-3 text-gray-400 font-semibold">Sana</th>
                        <th className="text-right py-2.5 px-3 text-gray-400 font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map(job => (
                        <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 font-mono text-gray-800">#{job.id}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium">{job.receipt_number || '-'}</span>
                            {job.amount && <span className="text-gray-400 ml-1">{Number(job.amount).toLocaleString()} so'm</span>}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${jobStatusColors[job.status] || ''}`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 max-w-[200px] truncate text-gray-400">{job.error_message || '-'}</td>
                          <td className="py-2.5 px-3 text-gray-500">{job.retry_count}/{job.max_retries}</td>
                          <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{formatDate(job.created_at)}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {job.status === 'failed' && (
                                <button onClick={() => handleRetryJob(job.id)}
                                  className="w-6 h-6 rounded hover:bg-blue-50 text-blue-500 flex items-center justify-center"
                                  title="Qayta urinish">
                                  <CornerUpLeft className="h-3 w-3" />
                                </button>
                              )}
                              {(job.status === 'pending' || job.status === 'printing') && (
                                <button onClick={() => handleCancelJob(job.id)}
                                  className="w-6 h-6 rounded hover:bg-red-50 text-red-400 flex items-center justify-center"
                                  title="Bekor qilish">
                                  <XCircle className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {jobsTotalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                <span className="text-xs text-gray-400">{jobsPage} / {jobsTotalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => loadJobs(jobsPage - 1)} disabled={jobsPage <= 1}
                    className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-100">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => loadJobs(jobsPage + 1)} disabled={jobsPage >= jobsTotalPages}
                    className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-100">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── Logs Tab ─── */}
          <TabsContent value="logs" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Print loglari (oxirgi 50 ta)</h3>
              <Button variant="outline" size="sm" onClick={() => loadJobs(jobsPage)} className="h-7 text-xs">
                <RefreshCw className="h-3 w-3 mr-1" /> Yangilash
              </Button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Loglar mavjud emas</div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                  {jobs.slice(0, 50).map(job => (
                    <div key={job.id} className="flex items-start gap-3 p-3 hover:bg-gray-50/50">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        job.status === 'completed' ? 'bg-emerald-500' :
                        job.status === 'failed' ? 'bg-red-500' :
                        job.status === 'printing' ? 'bg-blue-500' :
                        job.status === 'cancelled' ? 'bg-gray-400' : 'bg-amber-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-gray-800">Job #{job.id}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${jobStatusColors[job.status] || ''}`}>
                            {job.status}
                          </span>
                          {job.agent_id && <span className="text-[10px] text-gray-400">Agent: {job.agent_id}</span>}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {job.receipt_number && <span>Chek: {job.receipt_number} | </span>}
                          {job.amount && <span>{Number(job.amount).toLocaleString()} so'm | </span>}
                          <span>{formatDate(job.created_at)}</span>
                        </div>
                        {job.error_message && (
                          <div className="text-[11px] text-red-500 mt-0.5 bg-red-50 px-2 py-0.5 rounded inline-block">
                            {job.error_message}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatDate(job.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ─── Agent Edit Dialog ─── */}
        <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
          <DialogContent className="sm:max-w-md bg-white rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <Settings2 className="h-4 w-4 text-purple-600" />
                Agent sozlamalari
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {selectedAgent && (
                <>
                  <div className="bg-purple-50 rounded-lg p-3 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Agent ID:</span><span className="font-mono font-semibold">{selectedAgent.agent_id}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Kompyuter:</span><span>{selectedAgent.computer_name || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Windows foydalanuvchi:</span><span>{selectedAgent.windows_user || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Agent versiyasi:</span><span>v{selectedAgent.agent_version || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Oxirgi ulanish:</span><span>{formatDate(selectedAgent.last_connection)}</span></div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Kompyuter nomi</Label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="mt-1 h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Printer modeli</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {printerModels.map(m => (
                        <button key={m} onClick={() => setEditPrinterModel(m)}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                            editPrinterModel === m
                              ? 'bg-purple-100 text-purple-700 border-purple-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-200'
                          }`}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={editEnabled} onCheckedChange={setEditEnabled} />
                    <span className="text-xs text-gray-600">Agent faol</span>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAgentDialog(false)} className="text-xs h-8">Bekor qilish</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-xs h-8 gap-1">
                {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                <CheckCircle className="h-3 w-3" /> Saqlash
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Delete Dialog ─── */}
        <Dialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-sm bg-white rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-sm">Agentni o'chirish</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">Agent va uning barcha joblari o'chiriladi. Davom etasizmi?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} className="text-xs h-8">Bekor qilish</Button>
              <Button onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} className="bg-red-600 hover:bg-red-700 text-xs h-8">
                <Trash2 className="h-3 w-3 mr-1" /> O'chirish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
