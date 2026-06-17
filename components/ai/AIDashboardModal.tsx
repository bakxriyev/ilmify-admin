'use client';

import { useAI } from './AIContext';
import { X, Users, DollarSign, CheckCircle, AlertTriangle, TrendingUp, BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AIDashboardModal() {
  const { showDashboard, dismissDashboard, dashboardStats, refreshDashboard, toggleOpen } = useAI();
  const [adminName, setAdminName] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      if (admin.full_name) setAdminName(admin.full_name);
    } catch {}
  }, []);

  useEffect(() => {
    if (showDashboard && dashboardStats) {
      setVisible(true);
    }
  }, [showDashboard, dashboardStats]);

  if (!visible || !dashboardStats) return null;

  const items = [
    { label: "Yangi o'quvchilar", value: dashboardStats.today_students, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: "To'lovlar", value: `${dashboardStats.today_payments_count.toLocaleString()} ta / ${dashboardStats.today_payments_total.toLocaleString()} so'm`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Davomat', value: `${dashboardStats.today_attendance_present}/${dashboardStats.today_attendance_total} (${dashboardStats.today_attendance_rate}%)`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Faol guruhlar', value: dashboardStats.active_groups, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Qarzdorlar', value: dashboardStats.debtors_count, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Yangi leads', value: dashboardStats.new_leads, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 relative">
          <button
            onClick={() => { setVisible(false); dismissDashboard(); }}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="text-white text-lg font-bold">Assalomu alaykum, {adminName || 'Admin'}!</h2>
          <p className="text-blue-100 text-sm mt-1">Bugungi statistika va tahlillar</p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            {items.map((item, i) => (
              <div key={i} className={`${item.bg} rounded-xl p-3.5`}>
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                </div>
                <p className={`text-lg font-bold ${item.color}`}>
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">Ilmify AI sizga yordam berishi mumkin:</p>
              <button
                onClick={() => {
                  setVisible(false);
                  dismissDashboard();
                  toggleOpen();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                AI Chatni ochish
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Bugungi statistika", "Qarzdorlar ro'yxati", "Eng yaxshi o'qituvchi", "Davomat tahlili"].map((hint, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setVisible(false);
                    dismissDashboard();
                    toggleOpen();
                    setTimeout(() => {
                      const input = document.querySelector<HTMLInputElement>('[data-ai-input]');
                      if (input) {
                        input.value = hint;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                    }, 300);
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setVisible(false); dismissDashboard(); }}
            className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
          >
            Tushunarli
          </button>
        </div>
      </div>
    </div>
  );
}
