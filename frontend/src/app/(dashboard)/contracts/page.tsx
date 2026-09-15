"use client";

import React, { useState } from "react";
import { 
  ScrollText, Plus, Search, CheckCircle2, Clock, 
  FileText, Download, ShieldCheck, ExternalLink, Calendar,
  Building2, ArrowUpRight
} from "lucide-react";
import toast from "react-hot-toast";

const INITIAL_CONTRACTS = [
  {
    id: "ctr-1",
    code: "CTR-2026-081",
    client: "Nexus Logística e Transportes",
    document: "Contrato de Prestação de Serviços & Licença SaaS Enterprise",
    status: "signed",
    value: 13000,
    validUntil: "2027-09-10",
    signedAt: "2026-09-11",
    signers: ["Roberto Alencar (Diretor)", "Carlos Mendes (Testemunha)"]
  },
  {
    id: "ctr-2",
    code: "CTR-2026-082",
    client: "Inovare Odontologia Digital",
    document: "Contrato de Implementação de Agentes de IA",
    status: "pending_signature",
    value: 9200,
    validUntil: "2027-09-15",
    signedAt: null,
    signers: ["Fernanda Takahashi (Aguardando assinatura)"]
  },
  {
    id: "ctr-3",
    code: "CTR-2026-083",
    client: "Dantas & Filhos Advocacia",
    document: "Termo de Confidencialidade e SLA de Dados (NDA)",
    status: "signed",
    value: 4500,
    validUntil: "2028-09-14",
    signedAt: "2026-09-14",
    signers: ["Marcelo Dantas (Sócio Diretor)"]
  }
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState(INITIAL_CONTRACTS);
  const [search, setSearch] = useState("");

  const filtered = contracts.filter(
    (c) =>
      c.client.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Gestão de Contratos Digitais
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium font-mono">
                {contracts.length} ativos
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Assinatura eletrônica com validade jurídica, trilha de auditoria e controle de vigência
            </p>
          </div>
        </div>

        <button
          onClick={() => toast.success("Módulo de geração de minuta aberto a partir de proposta aceita.")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Emitir Novo Contrato
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Contratos Vigentes
          </span>
          <div className="text-2xl font-extrabold text-white mt-2">
            R$ 26.700,00
          </div>
          <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 2 contratos 100% assinados
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Assinaturas Pendentes
          </span>
          <div className="text-2xl font-extrabold text-amber-400 mt-2">
            R$ 9.200,00
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5" /> 1 minuta aguardando signatário
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Conformidade Jurídica
          </span>
          <div className="text-2xl font-extrabold text-cyan-400 mt-2">
            100% ICP-Brasil
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Carimbo de tempo & SHA-256
          </span>
        </div>
      </div>

      {/* Tabela de Contratos */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
        <div className="flex justify-between items-center">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente ou código..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Código / Documento</th>
                <th className="p-3.5">Cliente / Razão Social</th>
                <th className="p-3.5">Vigência</th>
                <th className="p-3.5 text-right">Valor</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((contract) => (
                <tr key={contract.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5">
                    <div className="font-mono font-bold text-white">{contract.code}</div>
                    <div className="text-[11px] text-slate-400">{contract.document}</div>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-200">
                    {contract.client}
                  </td>
                  <td className="p-3.5 font-mono text-slate-400">
                    até {new Date(contract.validUntil).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-3.5 text-right font-bold text-white font-mono">
                    R$ {contract.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-center">
                    {contract.status === "signed" ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Assinado
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => toast.success(`Download do contrato ${contract.code} iniciado.`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Baixar minuta assinada"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
