"use client";

import { useState, useEffect } from "react";
import { Smartphone, QrCode, Save, RefreshCw, PowerOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useWhatsApp } from "@/components/ui/WhatsAppProvider";

export default function WhatsAppSettingsPage() {
  const { status, refreshStatus, isLoading: contextLoading } = useWhatsApp();
  const [activeTab, setActiveTab] = useState<'meta' | 'qr'>('meta');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    metaToken: "",
    metaPhoneNumberId: "",
    antiBanEnabled: true,
    typingDelayMs: 1500,
    messageDelayMs: 3000
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3001/whatsapp/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({
        metaToken: res.data.metaToken || "",
        metaPhoneNumberId: res.data.metaPhoneNumberId || "",
        antiBanEnabled: res.data.whatsappSettings?.antiBanEnabled ?? true,
        typingDelayMs: res.data.whatsappSettings?.typingDelayMs ?? 1500,
        messageDelayMs: res.data.whatsappSettings?.messageDelayMs ?? 3000,
      });
    } catch (error) {
      toast.error("Erro ao carregar configurações");
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      await axios.patch('http://localhost:3001/whatsapp/config', {
        metaToken: formData.metaToken,
        metaPhoneNumberId: formData.metaPhoneNumberId,
        whatsappSettings: {
          antiBanEnabled: formData.antiBanEnabled,
          typingDelayMs: formData.typingDelayMs,
          messageDelayMs: formData.messageDelayMs
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Configurações salvas com sucesso!");
      refreshStatus();
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  if (contextLoading) return <div className="p-8 text-white">Carregando...</div>;

  return (
    <div className="flex-1 flex flex-col bg-[#050A15] p-8 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <Smartphone className="text-emerald-400" size={32} />
        <div>
          <h1 className="text-2xl font-bold text-white">Conexões WhatsApp</h1>
          <p className="text-gray-400 text-sm">Gerencie instâncias e configurações de envio</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-800 pb-px">
        <button
          onClick={() => setActiveTab('meta')}
          className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'meta' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          Meta Cloud API (Oficial)
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'qr' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          Conexão Web (QR Code)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'meta' ? (
            <div className="bg-[#0B1224] border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Credenciais Oficiais da Meta</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Access Token Permanente</label>
                  <input 
                    type="password" 
                    value={formData.metaToken}
                    onChange={(e) => setFormData({...formData, metaToken: e.target.value})}
                    placeholder="EAAI... ou mascarado"
                    className="w-full bg-[#050A15] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number ID</label>
                  <input 
                    type="text" 
                    value={formData.metaPhoneNumberId}
                    onChange={(e) => setFormData({...formData, metaPhoneNumberId: e.target.value})}
                    placeholder="Ex: 1045938592394"
                    className="w-full bg-[#050A15] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="pt-4">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    <Save size={16} />
                    {isSaving ? 'Salvando...' : 'Salvar Credenciais'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0B1224] border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px]">
              <QrCode size={64} className="text-gray-600 mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">Conectar via Aparelho</h2>
              <p className="text-gray-400 text-sm text-center max-w-md mb-6">
                Abra o WhatsApp no seu celular, vá em "Aparelhos Conectados" e aponte a câmera para o QR Code que aparecerá abaixo (integração via Baileys/Evolution API em breve).
              </p>
              <button disabled className="bg-gray-800 text-gray-400 px-6 py-2 rounded-lg font-medium text-sm cursor-not-allowed">
                Gerar QR Code (Em breve)
              </button>
            </div>
          )}

          <div className="bg-[#0B1224] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="text-blue-400" size={20} />
              <h2 className="text-lg font-bold text-white">Modo Anti-bloqueio (Segurança)</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.antiBanEnabled}
                  onChange={(e) => setFormData({...formData, antiBanEnabled: e.target.checked})}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm text-white">Ativar simulação de comportamento humano</span>
              </label>
              
              <div className={`grid grid-cols-2 gap-4 ${!formData.antiBanEnabled && 'opacity-50 pointer-events-none'}`}>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Delay de Digitação (ms)</label>
                  <input 
                    type="number" 
                    value={formData.typingDelayMs}
                    onChange={(e) => setFormData({...formData, typingDelayMs: parseInt(e.target.value)})}
                    className="w-full bg-[#050A15] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <span className="text-[10px] text-gray-500 mt-1">Tempo simulando "digitando..."</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Pausa entre envios (ms)</label>
                  <input 
                    type="number" 
                    value={formData.messageDelayMs}
                    onChange={(e) => setFormData({...formData, messageDelayMs: parseInt(e.target.value)})}
                    className="w-full bg-[#050A15] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <span className="text-[10px] text-gray-500 mt-1">Tempo antes de disparar a próxima</span>
                </div>
              </div>
              <div className="pt-2">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                >
                  Salvar Regras de Segurança
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0B1224] border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Status da Conexão</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex items-center justify-center w-4 h-4">
                {status.status === 'connected' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                )}
              </div>
              <div>
                <div className={`font-bold ${status.status === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {status.status === 'connected' ? 'Conectado (Meta API)' : 'Desconectado'}
                </div>
                <div className="text-xs text-gray-500">
                  {status.metaPhoneNumberId ? `ID: ${status.metaPhoneNumberId}` : 'Nenhuma instância pareada'}
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-800 pt-4">
              <button 
                onClick={refreshStatus}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
              >
                <RefreshCw size={16} />
                Forçar Sincronização
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-colors font-medium text-sm">
                <PowerOff size={16} />
                Desconectar Instância
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
