"use client";

import React, { useState } from "react";
import { 
  X, AlertTriangle, Clock, Activity, CheckCircle2, 
  Flame, Download, Copy, ShieldAlert, Sparkles, TrendingDown,
  ArrowUpRight, Users, Bell
} from "lucide-react";
import { BottlenecksResponse } from "@/types/analytics";
import toast from "react-hot-toast";

interface BottleneckAuditModalProps {
  data: BottlenecksResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BottleneckAuditModal({
  data,
  isOpen,
  onClose,
}: BottleneckAuditModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const handleCopyRecommendations = () => {
    const text = data.recommendations
      .map((r, i) => `${i + 1}. [${r.title}] ${r.description} -> Impacto estimado: ${r.impact}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Plano de otimização de gargalos copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleExportAuditCSV = () => {
    const lines = [
      "\uFEFFDepartamento,FRT (Minutos),TMA (Minutos),SLA (%),Fila Ativa,Saude",
      ...data.departmentBottlenecks.map(
        d => `"${d.name}",${d.frtMin},${d.tmaMin},${d.sla}%,${d.queue},"${d.health}"`
      ),
      "",
      "Horario,FRT (Minutos),TMA (Minutos),Volume Chamados,Nivel de Gargalo",
      ...data.hourlyBottlenecks.map(
        h => `"${h.hour}",${h.frtMin},${h.tmaMin},${h.volume},"${h.bottleneckLevel}"`
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `auditoria-gargalos-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório de auditoria de gargalos exportado com sucesso!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-[#0B1224] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Auditoria & Matriz de Gargalos Operacionais</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  Diagnóstico IA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditoria preditiva de tempos de espera, saturação de filas e distribuição de equipe por setor
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Alert Banner */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-300">Ponto Crítico de Atenção Detectado</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {data.criticalBottleneck}. Há uma concentração severa no turno da tarde que estica o tempo de espera do lead para além do limite de tolerância recomendado.
              </p>
            </div>
          </div>

          {/* Department Breakdown Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              SLA e Performance por Departamento
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Departamento</th>
                    <th className="px-4 py-3">1ª Resposta (FRT)</th>
                    <th className="px-4 py-3">Tempo Médio (TMA)</th>
                    <th className="px-4 py-3">Conformidade SLA</th>
                    <th className="px-4 py-3">Fila Ativa</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.departmentBottlenecks.map((dept, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: dept.fillTma }} 
                        />
                        {dept.name}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">
                        {dept.frtMin} min
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-200">
                        {dept.tmaMin} min
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                        {dept.sla}%
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {dept.queue} leads
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span 
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            dept.health === 'good'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : dept.health === 'regular'
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          }`}
                        >
                          {dept.health === 'good' ? 'Excelente' : dept.health === 'regular' ? 'Estável' : 'Atenção'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hourly Heatmap Distribution */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Saturação de Fila por Faixa de Horário
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
              {data.hourlyBottlenecks.map((hour, idx) => (
                <div 
                  key={idx}
                  className={`p-2.5 rounded-xl border text-center space-y-1 ${
                    hour.bottleneckLevel === 'high'
                      ? 'bg-red-500/10 border-red-500/30 text-red-300'
                      : hour.bottleneckLevel === 'medium'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-mono text-slate-400 block">{hour.hour}</span>
                  <span className="text-base font-black font-mono block text-white">{hour.volume}</span>
                  <span className="text-[9px] block uppercase font-bold">
                    {hour.bottleneckLevel === 'high' ? '🔥 Pico' : hour.bottleneckLevel === 'medium' ? 'Médio' : 'Leve'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommended Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Plano de Ação Recomendado pelo VERSUS AI
            </h4>
            <div className="space-y-2">
              {data.recommendations.map((rec) => (
                <div 
                  key={rec.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span 
                        className={`w-2 h-2 rounded-full ${
                          rec.type === 'critical' ? 'bg-red-400' : rec.type === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                        }`} 
                      />
                      <h5 className="text-xs font-bold text-white">{rec.title}</h5>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full block">
                      {rec.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAuditCSV}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Exportar Auditoria
            </button>
            <button
              onClick={handleCopyRecommendations}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-purple-400" />
              {copied ? "Copiado!" : "Copiar Ações"}
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
          >
            Fechar Auditoria
          </button>
        </div>
      </div>
    </div>
  );
}
