"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Clock, MessageSquare, CheckCircle, Headphones, Activity } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface AtendimentoMetrics {
  tma: string;
  tmr: string;
  totalConversations: number;
  resolvedConversations: number;
  weeklyVolume: { name: string; volume: number }[];
  operators: { id: string; name: string; resolved: number }[];
}

export default function AtendimentoDashboard() {
  const [metrics, setMetrics] = useState<AtendimentoMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3001/metrics/atendimento', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMetrics(res.data);
      } catch (error) {
        toast.error("Erro ao carregar métricas de atendimento");
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

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#050A15] p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Headphones className="text-blue-500" /> Dashboard de Atendimento
        </h1>
        <p className="text-gray-400 text-sm mt-1">Métricas de suporte, SLA e triagem em tempo real.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0B1224] p-6 rounded-xl border border-gray-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">TMA (Tempo Méd. Atendimento)</h3>
            <Clock className="text-blue-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{metrics.tma}</p>
        </div>

        <div className="bg-[#0B1224] p-6 rounded-xl border border-gray-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">TMR (Tempo Méd. Resposta)</h3>
            <Activity className="text-amber-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{metrics.tmr}</p>
        </div>

        <div className="bg-[#0B1224] p-6 rounded-xl border border-gray-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Chamados Resolvidos</h3>
            <CheckCircle className="text-emerald-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{metrics.resolvedConversations}</p>
        </div>

        <div className="bg-[#0B1224] p-6 rounded-xl border border-gray-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Total de Tickets Gerados</h3>
            <MessageSquare className="text-purple-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{metrics.totalConversations}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Volume */}
        <div className="lg:col-span-2 bg-[#0B1224] border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-bold mb-6">Volume de Atendimentos (Últimos 7 dias)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.weeklyVolume}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#6b7280" tick={{fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking de Operadores */}
        <div className="bg-[#0B1224] border border-gray-800 rounded-xl p-6 flex flex-col">
          <h3 className="text-white font-bold mb-6">Top Operadores (Resolvidos)</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {metrics.operators.length === 0 ? (
              <p className="text-gray-500 text-center mt-10">Nenhum operador com tickets.</p>
            ) : metrics.operators.map((op, idx) => (
              <div key={op.id} className="flex items-center justify-between p-3 bg-[#050A15] rounded-lg border border-gray-800/50 hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-500/20 text-amber-500' : idx === 1 ? 'bg-gray-400/20 text-gray-300' : idx === 2 ? 'bg-amber-700/20 text-amber-700' : 'bg-blue-500/20 text-blue-400'}`}>
                    #{idx + 1}
                  </div>
                  <span className="text-white font-medium text-sm">{op.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span className="text-emerald-400 font-bold">{op.resolved}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
