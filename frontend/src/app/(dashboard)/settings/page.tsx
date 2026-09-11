"use client";

import { useState } from "react";
import { User, Building, Users, CreditCard, Save, Upload, Plus, Shield, CheckCircle2, MessageSquare, Network } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", name: "Perfil de Admin", icon: User },
    { id: "company", name: "Dados da Empresa", icon: Building },
    { id: "team", name: "Equipe e Usuários", icon: Users },
    { id: "billing", name: "Assinatura", icon: CreditCard },
    { id: "departments", name: "Departamentos e Filas", icon: Network, href: "/settings/departments" },
    { id: "quick-replies", name: "Respostas Rápidas", icon: MessageSquare, href: "/settings/quick-replies" },
  ];

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto gap-6 pb-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-wide">Configurações Globais</h1>
        <p className="text-sm text-text-secondary mt-1">Gerencie sua conta, equipe e informações de faturamento.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        
        {/* Menu Lateral das Abas */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
          {tabs.map((tab) => {
            if (tab.href) {
              return (
                <a
                  key={tab.id}
                  href={tab.href}
                  className="flex items-center gap-3 w-full p-3 rounded-xl transition-all font-semibold text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent"
                >
                  <tab.icon size={18} />
                  {tab.name}
                </a>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all font-semibold text-sm
                  ${activeTab === tab.id 
                    ? 'bg-primary/20 text-accent border border-primary/30 shadow-[0_0_15px_rgba(0,85,255,0.15)]' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent'}
                `}
              >
                <tab.icon size={18} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div className="flex-1 bg-panel/40 border border-gray-800/60 rounded-2xl p-6 md:p-8 backdrop-blur-md min-h-[500px]">
          
          {/* ================= ABA 1: PERFIL ADMIN ================= */}
          {activeTab === "profile" && (
            <div className="flex flex-col gap-8 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h2 className="text-lg font-bold text-white">Meu Perfil</h2>
                <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-[0_0_10px_rgba(0,85,255,0.3)] flex items-center gap-2">
                  <Save size={14} /> Salvar Alterações
                </button>
              </div>

              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-black text-3xl shadow-lg relative group">
                  A
                  <button className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={20} className="text-white" />
                  </button>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Foto de Perfil</h3>
                  <p className="text-xs text-gray-400 mt-1 mb-2">Recomendado: 256x256px, formato PNG ou JPG.</p>
                  <button className="text-xs font-bold text-accent hover:underline">Remover foto</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome Completo</label>
                  <input type="text" defaultValue="Admin VERSUS" className="bg-background border border-gray-800 rounded-lg p-3 text-sm text-white outline-none focus:border-accent" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">E-mail Corporativo</label>
                  <input type="email" defaultValue="admin@versus.com" disabled className="bg-background/50 border border-gray-800 rounded-lg p-3 text-sm text-gray-500 outline-none cursor-not-allowed" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nova Senha</label>
                  <input type="password" placeholder="••••••••" className="bg-background border border-gray-800 rounded-lg p-3 text-sm text-white outline-none focus:border-accent" />
                </div>
              </div>
            </div>
          )}

          {/* ================= ABA 2: EMPRESA ================= */}
          {activeTab === "company" && (
            <div className="flex flex-col gap-8 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h2 className="text-lg font-bold text-white">Dados da Empresa</h2>
                <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-[0_0_10px_rgba(0,85,255,0.3)] flex items-center gap-2">
                  <Save size={14} /> Salvar Dados
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome Fantasia</label>
                  <input type="text" placeholder="Sua Empresa LTDA" className="bg-background border border-gray-800 rounded-lg p-3 text-sm text-white outline-none focus:border-accent" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">CNPJ</label>
                    <input type="text" placeholder="00.000.000/0001-00" className="bg-background border border-gray-800 rounded-lg p-3 text-sm text-white outline-none focus:border-accent" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Telefone Comercial</label>
                    <input type="text" placeholder="+55 (00) 00000-0000" className="bg-background border border-gray-800 rounded-lg p-3 text-sm text-white outline-none focus:border-accent" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= ABA 3: EQUIPE ================= */}
          {activeTab === "team" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Equipe e Usuários</h2>
                  <p className="text-xs text-gray-400 mt-1">Gerencie quem tem acesso à sua plataforma.</p>
                </div>
                <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-[0_0_10px_rgba(0,85,255,0.3)] flex items-center gap-2">
                  <Plus size={14} /> Convidar Membro
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {/* User Card */}
                <div className="flex items-center justify-between p-4 bg-background/50 border border-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold">
                      A
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Admin VERSUS <span className="bg-accent/20 text-accent text-[0.6rem] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Você</span>
                      </h4>
                      <p className="text-xs text-gray-400">admin@versus.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-bold bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700">
                    <Shield size={14} /> Administrador
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-background/50 border border-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                      M
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Maria Vendedora</h4>
                      <p className="text-xs text-gray-400">maria@versus.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700">
                      <User size={14} /> Atendente
                    </div>
                    <button className="text-xs text-red-400 hover:underline">Remover</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= ABA 4: ASSINATURA ================= */}
          {activeTab === "billing" && (
            <div className="flex flex-col gap-8 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h2 className="text-lg font-bold text-white">Assinatura e Uso</h2>
              </div>

              {/* Current Plan Card */}
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-accent/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 blur-3xl rounded-full" />
                
                <h3 className="text-accent text-sm font-bold uppercase tracking-widest mb-1">Seu Plano Atual</h3>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-3xl font-black text-white">Enterprise</span>
                  <span className="text-sm text-gray-300 pb-1">/ ilimitado</span>
                </div>
                
                <ul className="flex flex-col gap-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle2 size={16} className="text-accent" /> Leads ilimitados</li>
                  <li className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle2 size={16} className="text-accent" /> Agente IA com GPT-4o</li>
                  <li className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle2 size={16} className="text-accent" /> Equipe ilimitada</li>
                </ul>

                <button className="bg-background text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-gray-900 transition-colors border border-gray-700">
                  Gerenciar Faturamento (Stripe)
                </button>
              </div>

              {/* API Usage */}
              <div className="bg-background/50 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Consumo da IA (Mês Atual)</h3>
                <div className="w-full bg-gray-900 rounded-full h-3 mb-2 border border-gray-800">
                  <div className="bg-accent h-full rounded-full w-[45%]" />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>4.500 mensagens processadas</span>
                  <span>10.000 (Limite)</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}