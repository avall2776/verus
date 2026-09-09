"use client";

import { Search, Filter, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";

export default function SuperAdminClientsPage() {
  const tenants = [
    { id: 1, name: "Clínica Harmonize", plan: "Enterprise", status: "active", mrr: "R$ 499", users: 5 },
    { id: 2, name: "Tech Solutions Brasil", plan: "Pro", status: "active", mrr: "R$ 299", users: 2 },
    { id: 3, name: "Loja do José", plan: "Basic", status: "blocked", mrr: "R$ 99", users: 1 },
    { id: 4, name: "Imobiliária Prime", plan: "Enterprise", status: "active", mrr: "R$ 499", users: 12 },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide">Gestão de Clientes</h1>
          <p className="text-sm text-gray-400 mt-1">Administre as empresas (tenants) que utilizam a plataforma.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por empresa..." 
              className="bg-[#0a0f1c] border border-indigo-900/40 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-indigo-500/50 w-full"
            />
          </div>
          <button className="flex items-center gap-2 p-2 px-4 border border-indigo-900/40 rounded-lg text-gray-400 font-semibold text-sm hover:text-white hover:bg-[#0a0f1c] transition-colors">
            <Filter size={16} /> Filtros
          </button>
        </div>
      </div>

      {/* Tabela de Tenants */}
      <div className="bg-[#0a0f1c] border border-indigo-900/40 rounded-2xl flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#060913] border-b border-indigo-900/30 text-[0.7rem] uppercase tracking-widest text-indigo-500/70 font-bold">
                <th className="p-4 font-bold">Empresa (Tenant)</th>
                <th className="p-4 font-bold">Plano Assinado</th>
                <th className="p-4 font-bold">MRR</th>
                <th className="p-4 font-bold">Usuários Ativos</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="group hover:bg-indigo-900/10 transition-colors border-b border-indigo-900/20 last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{tenant.name}</h4>
                        <span className="text-[0.65rem] text-gray-500">ID: tenant_{tenant.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[0.7rem] font-bold px-2 py-1 rounded-md border
                      ${tenant.plan === 'Enterprise' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                        tenant.plan === 'Pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        'bg-gray-800 text-gray-300 border-gray-700'}
                    `}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-bold text-emerald-400">{tenant.mrr}</td>
                  <td className="p-4 text-sm text-gray-300">{tenant.users} assentos</td>
                  <td className="p-4">
                    {tenant.status === 'active' ? (
                      <span className="flex items-center gap-1 text-[0.7rem] font-bold text-green-400 uppercase tracking-wider">
                        <CheckCircle2 size={12} /> Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[0.7rem] font-bold text-red-400 uppercase tracking-wider">
                        <XCircle size={12} /> Bloqueado
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline mr-3">Login As</button>
                    <button className="p-1 text-gray-500 hover:text-white rounded transition-colors inline-flex align-middle">
                      <MoreHorizontal size={16} />
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
