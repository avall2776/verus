"use client";

import React from "react";
import { 
  X, TrendingUp, Users, DollarSign, FileCheck, Target, 
  Download, ArrowUpRight, Share2, Layers, CheckCircle2,
  Percent, ArrowRight
} from "lucide-react";
import { ChannelStat } from "@/types/analytics";
import toast from "react-hot-toast";

interface ChannelDetailModalProps {
  channel: ChannelStat | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChannelDetailModal({
  channel,
  isOpen,
  onClose,
}: ChannelDetailModalProps) {
  if (!isOpen || !channel) return null;

  const handleExportChannelData = () => {
    const csvContent = "\uFEFF" + [
      "Metrica,Valor",
      `Canal,${channel.name}`,
      `Tipo,${channel.type}`,
      `Total de Leads,${channel.leadsCount}`,
      `Oportunidades no CRM,${channel.dealsCount}`,
      `Propostas Emitidas,${channel.proposalsCount}`,
      `Contratos Assinados,${channel.contractsSignedCount}`,
      `Faturamento Total,R$ ${channel.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      `Ticket Medio,R$ ${channel.avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      `Taxa de Conversao,${channel.conversionRate}%`,
      `Participacao na Receita,${channel.percentOfTotalRevenue}%`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `analytics-canal-${channel.id}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Relatório de ${channel.name} exportado com sucesso!`);
  };

  const steps = [
    { label: "Leads Captados", value: channel.leadsCount, sub: "100% de entrada" },
    { label: "Oportunidades (CRM)", value: channel.dealsCount, sub: `${channel.leadsCount > 0 ? ((channel.dealsCount / channel.leadsCount) * 100).toFixed(0) : 0}% de avanço` },
    { label: "Propostas Emitidas", value: channel.proposalsCount, sub: `${channel.dealsCount > 0 ? ((channel.proposalsCount / channel.dealsCount) * 100).toFixed(0) : 0}% de avanço` },
    { label: "Contratos Fechados", value: channel.contractsSignedCount, sub: `${channel.conversionRate}% conversão final` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#0B1224] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner"
              style={{ 
                backgroundColor: `${channel.color}20`,
                borderColor: `${channel.color}40`,
                color: channel.color,
              }}
            >
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{channel.name}</h3>
                <span 
                  className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border"
                  style={{ 
                    backgroundColor: `${channel.color}15`,
                    borderColor: `${channel.color}30`,
                    color: channel.color,
                  }}
                >
                  {channel.type}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detalhamento analítico de performance comercial e ROI do canal
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" /> Leads
              </span>
              <p className="text-xl font-black font-mono text-white">{channel.leadsCount.toLocaleString("pt-BR")}</p>
              <span className="text-[10px] text-slate-400">Origens captadas</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Receita
              </span>
              <p className="text-lg font-black font-mono text-emerald-400">
                R$ {channel.totalRevenue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-slate-400">{channel.percentOfTotalRevenue}% da receita</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-blue-400" /> Conversão
              </span>
              <p className="text-xl font-black font-mono text-blue-400">{channel.conversionRate}%</p>
              <span className="text-[10px] text-slate-400">Lead p/ Contrato</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-purple-400" /> Ticket Médio
              </span>
              <p className="text-lg font-black font-mono text-white">
                R$ {channel.avgTicket.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-slate-400">Por fechamento</span>
            </div>
          </div>

          {/* Micro-Funnel do Canal */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Progressão do Funil neste Canal
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {steps.map((step, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 relative flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">{step.label}</span>
                    <span className="text-lg font-bold font-mono text-white">{step.value}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{step.sub}</span>
                    {idx < steps.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-600 hidden sm:block" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnóstico de Eficiência */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Diagnóstico de Qualidade do Tráfego</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              O canal <strong className="text-white">{channel.name}</strong> gera atualmente um ticket médio de <strong className="text-white">R$ {channel.avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>, representando <strong className="text-white">{channel.percentOfTotalRevenue}%</strong> de todo o faturamento da operação comercial. Com uma taxa de conversão de <strong className="text-emerald-400">{channel.conversionRate}%</strong>, é recomendado manter a escala de atendimento rápido via robô de triagem e encaminhamento direto.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between gap-3">
          <button
            onClick={handleExportChannelData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Exportar CSV deste Canal
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
