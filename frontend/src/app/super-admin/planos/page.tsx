"use client";

import { useState } from "react";
import { Check, X, ShieldAlert, Save } from "lucide-react";

export default function SuperAdminPlansPage() {
  // Mock State para os Planos
  const [plans, setPlans] = useState([
    {
      id: "basic",
      name: "Basic",
      price: "R$ 99/mês",
      features: {
        crm: false,
        whatsapp: true,
        instagram: false,
        aiAgent: false,
      },
      limits: {
        users: 1,
        aiMessages: 0,
      }
    },
    {
      id: "pro",
      name: "Pro",
      price: "R$ 299/mês",
      features: {
        crm: true,
        whatsapp: true,
        instagram: true,
        aiAgent: true,
      },
      limits: {
        users: 3,
        aiMessages: 2000,
      }
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "R$ 499/mês",
      features: {
        crm: true,
        whatsapp: true,
        instagram: true,
        aiAgent: true,
      },
      limits: {
        users: 10,
        aiMessages: 10000,
      }
    }
  ]);

  const toggleFeature = (planId: string, featureKey: string) => {
    setPlans(plans.map(plan => {
      if (plan.id === planId) {
        return {
          ...plan,
          features: {
            ...plan.features,
            // @ts-ignore
            [featureKey]: !plan.features[featureKey]
          }
        };
      }
      return plan;
    }));
  };

  const featureList = [
    { key: "crm", label: "Acesso ao Pipeline CRM" },
    { key: "whatsapp", label: "Integração WhatsApp" },
    { key: "instagram", label: "Integração Instagram" },
    { key: "aiAgent", label: "Agente IA (Vitor)" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide">Planos e Permissões</h1>
          <p className="text-sm text-gray-400 mt-1">Configure o que cada assinatura libera dentro da plataforma dos seus clientes.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] flex items-center gap-2">
          <Save size={16} /> Salvar Matriz
        </button>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
        <ShieldAlert size={20} className="text-blue-400 shrink-0" />
        <div className="text-sm text-blue-300">
          <strong className="block mb-1">Atenção Estratégica:</strong>
          As alterações feitas aqui refletem imediatamente na interface de todos os clientes vinculados a estes planos. Módulos desativados sumirão da barra lateral deles.
        </div>
      </div>

      {/* Matriz de Permissões */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {plans.map(plan => (
          <div key={plan.id} className="bg-[#0a0f1c] border border-indigo-900/40 rounded-2xl p-6 flex flex-col relative group">
            
            <div className="border-b border-indigo-900/30 pb-4 mb-4">
              <h2 className="text-xl font-black text-white">{plan.name}</h2>
              <p className="text-sm font-bold text-indigo-400 mt-1">{plan.price}</p>
            </div>

            {/* Configuração de Módulos (Toggles) */}
            <div className="flex flex-col gap-4 flex-1">
              <h3 className="text-[0.7rem] uppercase tracking-widest text-gray-500 font-bold mb-1">Módulos do Sistema</h3>
              
              {featureList.map(feature => (
                <div key={feature.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{feature.label}</span>
                  {/* Switch UI Simples */}
                  <button 
                    // @ts-ignore
                    onClick={() => toggleFeature(plan.id, feature.key)}
                    // @ts-ignore
                    className={`w-10 h-5 rounded-full relative transition-colors ${plan.features[feature.key] ? 'bg-indigo-500' : 'bg-gray-700'}`}
                  >
                    <div 
                      // @ts-ignore
                      className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${plan.features[feature.key] ? 'left-5' : 'left-0.5'}`} 
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Limites Numéricos */}
            <div className="flex flex-col gap-4 border-t border-indigo-900/30 pt-4 mt-4">
              <h3 className="text-[0.7rem] uppercase tracking-widest text-gray-500 font-bold mb-1">Limites de Consumo</h3>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Máximo de Usuários (Atendentes)</label>
                <input 
                  type="number" 
                  value={plan.limits.users} 
                  readOnly
                  className="bg-[#060913] border border-indigo-900/30 rounded-lg p-2 text-sm text-white outline-none w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Cota de Mensagens IA (Mensal)</label>
                <input 
                  type="number" 
                  value={plan.limits.aiMessages} 
                  readOnly
                  className="bg-[#060913] border border-indigo-900/30 rounded-lg p-2 text-sm text-white outline-none w-full"
                />
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
