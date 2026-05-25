'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { centerApplicationsApi, type CenterApplication } from '@/api/centerApplicationsApi';
import { Loader2, Search, Phone, MapPin, Building2, User, CheckCircle, XCircle, Clock, MessageSquare, Calendar, TrendingUp, List, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  new: 'Yangi',
  contacted: 'Aloqa qilingan',
  approved: 'Tasdiqlangan',
  rejected: 'Rad etilgan',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<CenterApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const data = await centerApplicationsApi.getAll();
      setApplications(data);
    } catch {
      toast.error('Arizalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await centerApplicationsApi.updateStatus(id, status);
      toast.success('Status yangilandi');
      fetchData();
    } catch {
      toast.error('Xatolik yuz berdi');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const total = applications.length;
    const today = applications.filter(a => a.created_at?.startsWith(todayStr)).length;
    const byStatus: Record<string, number> = {};
    for (const app of applications) {
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    }
    return { total, today, new: byStatus.new || 0, contacted: byStatus.contacted || 0, approved: byStatus.approved || 0, rejected: byStatus.rejected || 0 };
  }, [applications, todayStr]);

  const filtered = applications.filter(app => {
    if (filterStatus && app.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return app.center_name.toLowerCase().includes(q) ||
        app.full_name.toLowerCase().includes(q) ||
        app.phone.includes(q) ||
        app.region.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Statistika */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <List className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Jami arizalar</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Bugun</p>
              <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Yangi</p>
              <p className="text-2xl font-bold text-blue-700">{stats.new}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 rounded-lg">
              <Phone className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Aloqa qilingan</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.contacted}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Tasdiqlangan</p>
              <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Qidiruv va filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
        >
          <option value="">Barcha statuslar</option>
          <option value="new">Yangi</option>
          <option value="contacted">Aloqa qilingan</option>
          <option value="approved">Tasdiqlangan</option>
          <option value="rejected">Rad etilgan</option>
        </select>
      </div>

      {/* Jadval */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Arizalar mavjud emas</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-8 px-2 py-3"></th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Markaz nomi</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">To'liq ism</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Telefon</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Viloyat</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sana</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(app => (
                  <Fragment key={app.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-3">
                        {app.description && (
                          <button onClick={() => setExpandedId(expandedId === app.id ? null : app.id)} className="p-1 hover:bg-gray-100 rounded">
                            {expandedId === app.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-purple-600 shrink-0" />
                          <span className="text-sm font-medium text-gray-900">{app.center_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700">{app.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                          <a href={`tel:${app.phone}`} className="text-sm text-blue-600 hover:underline">{app.phone}</a>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700">{app.region}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {new Date(app.created_at).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                          {STATUS_LABELS[app.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {app.status === 'new' && (
                            <>
                              <button onClick={() => handleStatusChange(app.id, 'contacted')}
                                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 transition-colors whitespace-nowrap">
                                <Phone className="h-3.5 w-3.5 inline mr-1" />Aloqa qilindi
                              </button>
                              <button onClick={() => handleStatusChange(app.id, 'approved')}
                                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors whitespace-nowrap">
                                <CheckCircle className="h-3.5 w-3.5 inline mr-1" />Tasdiqlash
                              </button>
                              <button onClick={() => handleStatusChange(app.id, 'rejected')}
                                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors whitespace-nowrap">
                                <XCircle className="h-3.5 w-3.5 inline mr-1" />Rad etish
                              </button>
                            </>
                          )}
                          {app.status === 'contacted' && (
                            <>
                              <button onClick={() => handleStatusChange(app.id, 'approved')}
                                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors whitespace-nowrap">
                                <CheckCircle className="h-3.5 w-3.5 inline mr-1" />Tasdiqlash
                              </button>
                              <button onClick={() => handleStatusChange(app.id, 'rejected')}
                                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors whitespace-nowrap">
                                <XCircle className="h-3.5 w-3.5 inline mr-1" />Rad etish
                              </button>
                            </>
                          )}
                          {app.status === 'approved' && (
                            <span className="text-xs text-gray-400 italic">Tasdiqlangan</span>
                          )}
                          {app.status === 'rejected' && (
                            <span className="text-xs text-gray-400 italic">Rad etilgan</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {app.description && expandedId === app.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="px-6 py-3">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium text-gray-700">Batafsil:</span> {app.description}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
