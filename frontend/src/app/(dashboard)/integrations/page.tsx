"use client";

import { MessageCircle, Instagram, Bot, Database, Mail, Link as LinkIcon, CheckCircle2, QrCode } from "lucide-react";

export default function IntegrationsPage() {
  const integrations = [
    {
      id: "whatsapp",
      name: "WhatsApp Oficial",
      description: "Conecte seu número via Cloud API Oficial da Meta.",
      icon: MessageCircle,
      iconColor: "text-green-500",
      bgLight: "bg-green-500/10",
      status: "connected",
      buttonText: "Configurar",
    },
    {
      id: "whatsapp-baileys",
      name: "WhatsApp (QR Code)",
      description: "Conexão alternativa não-oficial via leitura de QR Code.",
      icon: QrCode,
      iconColor: "text-emerald-400",
      bgLight: "bg-emerald-400/10",
      status: "available",
      buttonText: "Ler QR Code",
    },
    {
      id: "instagram",
      name: "Instagram Direct",
      description: "Responda automagicamente às DMs do seu perfil comercial.",
      icon: Instagram,
      iconColor: "text-pink-500",
      bgLight: "bg-pink-500/10",
      status: "available",
      buttonText: "Conectar Conta",
    },
    {
      id: "openai",
      name: "OpenAI (ChatGPT)",
      description: "O cérebro do Agente Vitor. Utilizando modelo GPT-4o.",
      icon: Bot,
      iconColor: "text-accent",
      bgLight: "bg-accent/10",
      status: "connected",
      buttonText: "Gerenciar Chave",
    },
    {
      id: "rdstation",
      name: "RD Station",
      description: "Envie leads qualificados diretamente para o seu RD CRM.",
      icon: Database,
      iconColor: "text-blue-500",
      bgLight: "bg-blue-500/10",
      status: "coming_soon",
      buttonText: "Em Breve",
    },
    {
      id: "webhook",
      name: "Webhooks (API)",
      description: "Receba e envie dados via POST/GET para qualquer sistema.",
      icon: LinkIcon,
      iconColor: "text-gray-400",
      bgLight: "bg-gray-400/10",
      status: "available",
      buttonText: "Criar Webhook",
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-wide">Integrações</h1>
        <p className="text-sm text-text-secondary mt-1">Conecte o VERSUS aos seus canais de atendimento e sistemas favoritos.</p>
      </div>

      {/* Grid de Integrações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((app) => (
          <div key={app.id} className="bg-panel/40 border border-gray-800/60 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between gap-6 hover:border-gray-700 transition-colors group">
            
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${app.bgLight}`}>
                  <app.icon size={24} className={app.iconColor} />
                </div>
                
                {app.status === 'connected' && (
                  <span className="flex items-center gap-1 text-[0.65rem] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full uppercase tracking-wider">
                    <CheckCircle2 size={12} /> Conectado
                  </span>
                )}
                {app.status === 'coming_soon' && (
                  <span className="flex items-center gap-1 text-[0.65rem] font-bold text-gray-500 bg-gray-800 px-2 py-1 rounded-full uppercase tracking-wider">
                    Em breve
                  </span>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-accent transition-colors">{app.name}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{app.description}</p>
              </div>
            </div>

            <button 
              disabled={app.status === 'coming_soon'}
              className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all
                ${app.status === 'connected' ? 'bg-gray-800 text-white hover:bg-gray-700' : 
                  app.status === 'coming_soon' ? 'bg-background border border-gray-800 text-gray-600 cursor-not-allowed' : 
                  'bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white shadow-[0_0_15px_rgba(0,85,255,0.1)] hover:shadow-[0_0_15px_rgba(0,85,255,0.4)]'}
              `}
            >
              {app.buttonText}
            </button>
            
          </div>
        ))}
      </div>

    </div>
  );
}