'use client';

import { type AIMessage } from './AIContext';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function AIChatMessage({ message }: { message: AIMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
              AI
            </div>
            <span className="text-xs font-medium text-gray-500">Ilmify AI Yordamchi </span>
          </div>
        )}

        <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>

        {message.type === 'table' && message.data && Array.isArray(message.data) && message.data.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  {Object.keys(message.data[0]).map(col => (
                    <th key={col} className="text-left py-1.5 px-2 font-medium text-gray-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {message.data.slice(0, 15).map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="py-1.5 px-2 text-gray-700">
                        {typeof val === 'number' ? val.toLocaleString() : String(val ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {message.type === 'stats' && message.data && typeof message.data === 'object' && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {Object.entries(message.data).slice(0, 8).map(([key, val]: [string, any]) => (
              <div key={key} className="bg-white/50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500 uppercase">{key.replace(/_/g, ' ')}</p>
                <p className="text-sm font-bold text-gray-900">{typeof val === 'number' ? val.toLocaleString() : String(val)}</p>
              </div>
            ))}
          </div>
        )}

        {message.type === 'chart' && message.data && (
          <div className="mt-3 h-48">
            <ChartRenderer data={message.data} chartType={message.chartType || 'bar'} />
          </div>
        )}
      </div>
    </div>
  );
}

function ChartRenderer({ data, chartType }: { data: any; chartType: string }) {
  const chartData = Array.isArray(data) ? data : [];

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={Object.keys(chartData[0] || {})[0]} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey={Object.keys(chartData[0] || {})[1]} stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey={Object.keys(chartData[0] || {})[1]}
            nameKey={Object.keys(chartData[0] || {})[0]}
            cx="50%" cy="50%" outerRadius={70}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((_: any, i: number) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={Object.keys(chartData[0] || {})[0]} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey={Object.keys(chartData[0] || {})[1]} fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
