"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingUp, Target, Briefcase } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface CrmMetrics {
  totalRevenue: number;
  wonRevenue: number;
  lostRevenue: number;
  wonCount: number;
  lostCount: number;
  openCount: number;
  winRate: number;
  weeklyComparison: { name: string; ganho: number; perdido: number }[];
  funnelData: { name: string; value: number }[];
}

export default function CrmDashboard() {
  const [metrics, setMetrics] = useState<CrmMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3001/metrics/crm', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMetrics(res.data);
      } catch (error) {
        toast.error("Erro ao carregar métricas de CRM");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (isLoading) {
    return <div className="flex-1 bg-[#050A15] p-6 text-center text-gray-500 pt-20">Carregando dashboards...</div>;
  }

  if (!metrics) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#050A15] p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Briefcase className="text-emerald-500" /> Analytics de Vendas & CRM
        </h1>
        <p className="text-gray-400 text-sm mt-1">Visão financeira, taxa de conversão e saúde do funil.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0B1224] p-6 rounded-xl border border-gray-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Receita Ganha</h3>
            <DollarSign className="text-emerald-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(metrics.wonRevenue)}</p>
        </div>

        <div className="bg-[#0B1224] p-6 rounded-xl border border-gray-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Pipeline Total Aberto</h3>
            <TrendingUp className="text-blue-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(metrics.totalRevenue - metrics.wonRevenue - metrics.lostRevenue)}</p>
        </div>

        <div className="bg-[#0B1224] p-6 rounded-xl border border-gray-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Taxa de Ganho (Win Rate)</h3>
            <Target className="text-purple-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{metrics.winRate}%</p>
          <div className="w-full bg-gray-800 rounded-full h-1.5 mt-4">
             <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${metrics.winRate}%` }}></div>
          </div>
        </div>

        <div className="bg-[#0B1224] p-6 rounded-xl border border-gray-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Oportunidades Ganhos/Perd.</h3>
            <Briefcase className="text-amber-500" size={20} />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-emerald-400">{metrics.wonCount}</p>
            <span className="text-gray-500 text-sm">/</span>
            <p className="text-xl font-bold text-red-400">{metrics.lostCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Comparativo */}
        <div className="bg-[#0B1224] border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-bold mb-6">Comparativo Semanal de Receita</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.weeklyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#6b7280" tick={{fill: '#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px', color: '#fff' }}
                  cursor={{ fill: '#1f2937', opacity: 0.4 }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Legend iconType="circle" />
                <Bar dataKey="ganho" name="Receita Ganha" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="perdido" name="Receita Perdida" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Funil (Simulado via BarChart Horizontal) */}
        <div className="bg-[#0B1224] border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-bold mb-6">Distribuição de Leads no Funil</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#6b7280" tick={{fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px', color: '#fff' }}
                  cursor={{ fill: '#1f2937', opacity: 0.4 }}
                  formatter={(value: any) => [`${value} Leads`, 'Volume']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
