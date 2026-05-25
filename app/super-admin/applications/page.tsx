'use client';

import { useState, useEffect } from 'react';
import { centerApplicationsApi, type CenterApplication } from '@/api/centerApplicationsApi';
import { Loader2, Search, Phone, MapPin, Building2, User, CheckCircle, XCircle, Clock, Trash2, MessageSquare } from 'lucide-react';
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

  const handleDelete = async (id: number) => {
    if (!confirm('Arizani o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await centerApplicationsApi.remove(id);
      toast.success('Ariza o\'chirildi');
      fetchData();
    } catch {
      toast.error('Xatolik yuz berdi');
    }
  };

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zayafkalar</h1>
          <p className="text-sm text-gray-500 mt-1">
            O'quv markazlardan kelgan arizalar ({filtered.length})
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Barcha statuslar</option>
          <option value="new">Yangi</option>
          <option value="contacted">Aloqa qilingan</option>
          <option value="approved">Tasdiqlangan</option>
          <option value="rejected">Rad etilgan</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Arizalar mavjud emas</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(app => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                      {STATUS_LABELS[app.status]}
                    </span>
                    <span className="text-xs text-gray-400">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {new Date(app.created_at).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
                      <Building2 className="h-4 w-4 text-purple-600 shrink-0" />
                      {app.center_name}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4 text-gray-400 shrink-0" />
                      {app.full_name}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                      <a href={`tel:${app.phone}`} className="hover:text-purple-600">{app.phone}</a>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                      {app.region}
                    </div>
                    {app.description && (
                      <p className="text-gray-500 text-sm mt-2 bg-gray-50 rounded-lg p-3">
                        {app.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {app.status === 'new' && (
                    <>
                      <button onClick={() => handleStatusChange(app.id, 'contacted')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200">
                        <Phone className="h-3.5 w-3.5" /> Aloqa qilindi
                      </button>
                      <button onClick={() => handleStatusChange(app.id, 'approved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                        <CheckCircle className="h-3.5 w-3.5" /> Tasdiqlash
                      </button>
                      <button onClick={() => handleStatusChange(app.id, 'rejected')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200">
                        <XCircle className="h-3.5 w-3.5" /> Rad etish
                      </button>
                    </>
                  )}
                  {app.status === 'contacted' && (
                    <>
                      <button onClick={() => handleStatusChange(app.id, 'approved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                        <CheckCircle className="h-3.5 w-3.5" /> Tasdiqlash
                      </button>
                      <button onClick={() => handleStatusChange(app.id, 'rejected')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200">
                        <XCircle className="h-3.5 w-3.5" /> Rad etish
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDelete(app.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200">
                    <Trash2 className="h-3.5 w-3.5" /> O'chirish
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
