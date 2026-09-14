"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Smartphone, QrCode, Save, RefreshCw, PowerOff, ShieldCheck, 
  Plus, History, User, CheckCircle2, AlertCircle, Trash2, Globe, Sparkles, Clock, Check
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useWhatsApp, WhatsAppInstance } from "@/components/ui/WhatsAppProvider";

export default function WhatsAppSettingsPage() {
  const { instances, activeInstance, setActiveInstance, refreshInstances, isLoading: contextLoading } = useWhatsApp();
  const [activeTab, setActiveTab] = useState<'meta' | 'qr' | 'safety' | 'history'>('meta');
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showNewInstanceModal, setShowNewInstanceModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [newInstancePhone, setNewInstancePhone] = useState("");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState<number>(30);

  // Formulário da instância ativa
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    profileName: "",
    profilePicUrl: "",
    metaToken: "",
    metaPhoneNumberId: "",
    antiBanEnabled: true,
    typingDelayMs: 1500,
    messageDelayMs: 3000
  });

  // Atualiza formData sempre que a instância ativa mudar
  useEffect(() => {
    if (activeInstance) {
      setFormData({
        name: activeInstance.name || "",
        phoneNumber: activeInstance.phoneNumber || "",
        profileName: activeInstance.profileName || "",
        profilePicUrl: activeInstance.profilePicUrl || "",
        metaToken: (activeInstance as any).token || "",
        metaPhoneNumberId: activeInstance.phoneNumberId || "",
        antiBanEnabled: activeInstance.settings?.antiBanEnabled ?? true,
        typingDelayMs: activeInstance.settings?.typingDelayMs ?? 1500,
        messageDelayMs: activeInstance.settings?.messageDelayMs ?? 3000,
      });
      if (activeInstance.qrCode) {
        setQrCodeData(activeInstance.qrCode);
      }
    }
  }, [activeInstance]);

  // Contagem regressiva do QR Code
  useEffect(() => {
    let timer: any;
    if (activeTab === 'qr' && activeInstance?.status === 'qrcode') {
      timer = setInterval(() => {
        setQrCountdown(prev => (prev > 1 ? prev - 1 : 30));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTab, activeInstance?.status]);

  const handleSave = async () => {
    if (!activeInstance) return;
    try {
      setIsSaving(true);
      await api.patch(`/whatsapp/instances/${activeInstance.id}`, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        profileName: formData.profileName,
        profilePicUrl: formData.profilePicUrl,
        token: formData.metaToken,
        phoneNumberId: formData.metaPhoneNumberId,
        settings: {
          antiBanEnabled: formData.antiBanEnabled,
          typingDelayMs: formData.typingDelayMs,
          messageDelayMs: formData.messageDelayMs
        }
      });
      toast.success("Instância atualizada com sucesso!");
      await refreshInstances();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim()) return;

    try {
      setIsSaving(true);
      const res = await api.post('/whatsapp/instances', {
        name: newInstanceName.trim(),
        phoneNumber: newInstancePhone.trim() || undefined
      });
      toast.success("Nova linha do WhatsApp criada!");
      setShowNewInstanceModal(false);
      setNewInstanceName("");
      setNewInstancePhone("");
      await refreshInstances();
      setActiveInstance(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao criar instância");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInstance = async () => {
    if (!activeInstance) return;
    if (activeInstance.isDefault) {
      toast.error("Não é possível remover a instância padrão do workspace");
      return;
    }
    if (!confirm(`Deseja realmente remover a instância "${activeInstance.name}"?`)) return;

    try {
      await api.delete(`/whatsapp/instances/${activeInstance.id}`);
      toast.success("Instância removida com sucesso");
      await refreshInstances();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao remover instância");
    }
  };

  const handleConnect = async (mode: 'meta' | 'qr') => {
    if (!activeInstance) return;
    try {
      setIsConnecting(true);
      const res = await api.post(`/whatsapp/instances/${activeInstance.id}/connect`, { mode });
      if (mode === 'qr') {
        setQrCodeData(res.data.qrCode);
        setQrCountdown(30);
      }
      toast.success(res.data.message || "Conexão processada!");
      await refreshInstances();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao conectar instância");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!activeInstance) return;
    try {
      setIsDisconnecting(true);
      await api.post(`/whatsapp/instances/${activeInstance.id}/disconnect`);
      setQrCodeData(null);
      toast.success("Instância desconectada com sucesso");
      await refreshInstances();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao desconectar instância");
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (contextLoading) return <div className="p-8 text-white font-sans">Carregando instâncias...</div>;

  return (
    <div className="flex-1 flex flex-col bg-[#050A15] p-6 md:p-8 overflow-y-auto font-sans">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Smartphone size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Conexões WhatsApp (Multi-Tenant)</h1>
            <p className="text-gray-400 text-xs md:text-sm">Gerencie instâncias dinâmicas, sessões e regras de envio por workspace</p>
          </div>
        </div>

        <button
          onClick={() => setShowNewInstanceModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Nova Instância</span>
        </button>
      </div>

      {/* SELETOR DE INSTÂNCIAS DINÂMICAS POR WORKSPACE */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-3 mb-6">
        {instances.map(inst => {
          const isSelected = activeInstance?.id === inst.id;
          const isConn = inst.status === 'connected';

          return (
            <button
              key={inst.id}
              onClick={() => setActiveInstance(inst)}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#161b22] border-emerald-500/60 text-white shadow-md'
                  : 'bg-[#0B1224] border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              <div className="relative flex items-center justify-center w-2.5 h-2.5">
                {isConn ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                )}
              </div>
              <span>{inst.name}</span>
              {inst.isDefault && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800/40">
                  Principal
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CARD PRINCIPAL DA INSTÂNCIA SELECIONADA */}
      {activeInstance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUNA ESQUERDA: Configurações, Abas e Credenciais */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Bloco de Perfil e Identificação da Instância */}
            <div className="bg-[#0B1224] border border-gray-800 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-gray-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0 relative">
                    {formData.profilePicUrl ? (
                      <img src={formData.profilePicUrl} alt={formData.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{formData.name[0]?.toUpperCase() || "W"}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      {formData.name}
                      {activeInstance.isDefault && (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                          Linha Padrão
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-gray-400 font-mono">
                      {formData.phoneNumber || "Número não vinculado"}
                    </p>
                  </div>
                </div>

                {!activeInstance.isDefault && (
                  <button
                    onClick={handleDeleteInstance}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg border border-rose-900/30 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Excluir Linha</span>
                  </button>
                )}
              </div>

              {/* Edição Básica de Perfil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Nome da Instância</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#050A15] border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-blue-500/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Nome de Exibição WhatsApp</label>
                  <input
                    type="text"
                    value={formData.profileName}
                    onChange={e => setFormData({ ...formData, profileName: e.target.value })}
                    placeholder="Ex: Suporte Oficial"
                    className="w-full bg-[#050A15] border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-blue-500/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Telefone Vinculado</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="Ex: 5549999999999"
                    className="w-full bg-[#050A15] border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-blue-500/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">URL da Foto de Perfil</label>
                  <input
                    type="text"
                    value={formData.profilePicUrl}
                    onChange={e => setFormData({ ...formData, profilePicUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-[#050A15] border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-blue-500/60 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Abas Secundárias de Configuração */}
            <div className="flex gap-2 border-b border-gray-800 pb-2 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('meta')}
                className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
                  activeTab === 'meta'
                    ? 'bg-[#161b22] text-emerald-400 border border-emerald-800/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Meta Cloud API (Oficial)
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
                  activeTab === 'qr'
                    ? 'bg-[#161b22] text-emerald-400 border border-emerald-800/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Conexão Web (QR Code)
              </button>
              <button
                onClick={() => setActiveTab('safety')}
                className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
                  activeTab === 'safety'
                    ? 'bg-[#161b22] text-blue-400 border border-blue-800/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Modo Anti-bloqueio
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-[#161b22] text-purple-400 border border-purple-800/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Histórico de Conexões
              </button>
            </div>

            {/* CONTEÚDO DAS ABAS */}
            {activeTab === 'meta' && (
              <div className="bg-[#0B1224] border border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe size={16} className="text-emerald-400" />
                  Credenciais Oficiais da Meta
                </h3>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Access Token Permanente</label>
                  <input
                    type="password"
                    value={formData.metaToken}
                    onChange={e => setFormData({ ...formData, metaToken: e.target.value })}
                    placeholder="EAAI... ou chave mascarada"
                    className="w-full bg-[#050A15] border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-emerald-500/60 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={formData.metaPhoneNumberId}
                    onChange={e => setFormData({ ...formData, metaPhoneNumberId: e.target.value })}
                    placeholder="Ex: 1045938592394"
                    className="w-full bg-[#050A15] border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-emerald-500/60 transition-colors font-mono"
                  />
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>{isSaving ? "Salvando..." : "Salvar Configurações"}</span>
                  </button>
                  <button
                    onClick={() => handleConnect('meta')}
                    disabled={isConnecting}
                    className="flex items-center gap-2 bg-[#161b22] hover:bg-[#21262d] text-emerald-400 border border-emerald-800/50 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} className={isConnecting ? "animate-spin" : ""} />
                    <span>Testar & Conectar Meta API</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="bg-[#0B1224] border border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-52 h-52 bg-white rounded-2xl p-3 shadow-2xl flex items-center justify-center mb-4 relative overflow-hidden">
                  {qrCodeData || activeInstance.qrCode ? (
                    <div className="flex flex-col items-center justify-center w-full h-full text-black">
                      <QrCode size={170} />
                      <span className="text-[10px] font-mono font-bold mt-1 text-gray-700">VERSUS-QR-SYNC</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
                      <QrCode size={48} className="text-gray-400" />
                      <span className="text-xs font-semibold">QR Code não gerado</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                  <Clock size={13} className="text-emerald-400" />
                  <span>Código expira em <strong className="text-white font-mono">{qrCountdown}s</strong></span>
                </div>

                <p className="text-xs text-gray-400 max-w-sm mb-4">
                  Abra o WhatsApp no seu celular, acesse <strong>Aparelhos Conectados</strong> e aponte a câmera para parear esta instância.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleConnect('qr')}
                    disabled={isConnecting}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isConnecting ? "animate-spin" : ""} />
                    <span>{isConnecting ? "Gerando..." : "Gerar Novo QR Code"}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'safety' && (
              <div className="bg-[#0B1224] border border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Modo Anti-bloqueio & Ritmo Humano</h3>
                </div>
                <p className="text-xs text-gray-400">
                  Configure tempos de espera para simular digitação e intervalos naturais entre envios, reduzindo riscos de banimento pelo WhatsApp.
                </p>

                <label className="flex items-center gap-2.5 cursor-pointer bg-[#050A15] p-3 rounded-xl border border-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.antiBanEnabled}
                    onChange={e => setFormData({ ...formData, antiBanEnabled: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Ativar Simulação de Comportamento Humano</span>
                    <span className="text-[11px] text-gray-500">Exibe 'digitando...' e introduz pequenos delays randômicos</span>
                  </div>
                </label>

                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${!formData.antiBanEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Delay de Digitação (ms)</label>
                    <input
                      type="number"
                      value={formData.typingDelayMs}
                      onChange={e => setFormData({ ...formData, typingDelayMs: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#050A15] border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-blue-500/60 font-mono"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">Tempo simulando 'digitando...'</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Pausa Entre Envios (ms)</label>
                    <input
                      type="number"
                      value={formData.messageDelayMs}
                      onChange={e => setFormData({ ...formData, messageDelayMs: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#050A15] border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-blue-500/60 font-mono"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">Intervalo antes da próxima mensagem</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-950/40 cursor-pointer disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>Salvar Regras de Segurança</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-[#0B1224] border border-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <History size={16} className="text-purple-400" />
                    Histórico de Conexões da Instância
                  </h3>
                  <span className="text-[10px] text-gray-500">Últimos eventos registrados</span>
                </div>

                <div className="space-y-2 pt-2">
                  {(!activeInstance.history || activeInstance.history.length === 0) ? (
                    <p className="text-xs text-gray-500 italic text-center py-6">Nenhum evento registrado ainda.</p>
                  ) : (
                    activeInstance.history.map(h => (
                      <div key={h.id} className="p-3 rounded-xl bg-[#050A15] border border-gray-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          {h.status === 'connected' ? (
                            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                          ) : h.status === 'error' ? (
                            <AlertCircle size={15} className="text-rose-400 shrink-0" />
                          ) : (
                            <PowerOff size={15} className="text-gray-400 shrink-0" />
                          )}
                          <div>
                            <span className="font-semibold text-white block">{h.details || "Evento de conexão"}</span>
                            <span className="text-[10px] text-gray-500 font-mono uppercase">{h.status}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(h.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* COLUNA DIREITA: Card de Status em Tempo Real & Ações Imediatas */}
          <div className="space-y-6">
            <div className="bg-[#0B1224] border border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status em Tempo Real</h2>
              
              <div className="flex items-center gap-3.5 p-3.5 bg-[#050A15] rounded-xl border border-gray-800">
                <div className="relative flex items-center justify-center w-3 h-3">
                  {activeInstance.status === 'connected' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </>
                  ) : activeInstance.status === 'qrcode' ? (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 animate-pulse"></span>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  )}
                </div>
                <div>
                  <div className={`text-sm font-bold ${
                    activeInstance.status === 'connected' 
                      ? 'text-emerald-400' 
                      : activeInstance.status === 'qrcode' 
                      ? 'text-amber-400' 
                      : 'text-rose-400'
                  }`}>
                    {activeInstance.status === 'connected' 
                      ? 'Conectado' 
                      : activeInstance.status === 'qrcode' 
                      ? 'Aguardando Leitura QR' 
                      : 'Desconectado'}
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {activeInstance.phoneNumberId ? `ID: ${activeInstance.phoneNumberId}` : 'Sessão Web QR'}
                  </span>
                </div>
              </div>

              {/* Botões de Ação Imediata */}
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <button
                  onClick={refreshInstances}
                  className="w-full flex items-center justify-center gap-2 bg-[#161b22] hover:bg-[#21262d] text-gray-300 hover:text-white px-4 py-2.5 rounded-xl border border-gray-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Sincronizar Conexão</span>
                </button>

                {activeInstance.status === 'connected' ? (
                  <button
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="w-full flex items-center justify-center gap-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/40 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <PowerOff size={13} />
                    <span>{isDisconnecting ? "Desconectando..." : "Desconectar Sessão"}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect('meta')}
                    disabled={isConnecting}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} />
                    <span>{isConnecting ? "Conectando..." : "Reconectar Instância"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Guia Rápido */}
            <div className="bg-[#0B1224] border border-gray-800 rounded-2xl p-5 shadow-sm text-xs text-gray-400 space-y-2">
              <span className="font-bold text-white block uppercase tracking-wider text-[10px]">Sobre Multi-Instâncias</span>
              <p>Cada workspace pode ter múltiplas linhas de atendimento dedicadas para diferentes setores ou filiais.</p>
              <p>A linha marcada como <strong>Principal</strong> é utilizada como canal prioritário para disparo da IA e novos transbordos.</p>
            </div>
          </div>

        </div>
      )}

      {/* MODAL PARA CRIAR NOVA INSTÂNCIA */}
      {showNewInstanceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B1224] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Criar Nova Linha de WhatsApp</h3>
            <p className="text-xs text-gray-400">Adicione uma nova instância dedicada para este workspace.</p>

            <form onSubmit={handleCreateInstance} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Nome da Linha</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: WhatsApp Vendas São Paulo"
                  value={newInstanceName}
                  onChange={e => setNewInstanceName(e.target.value)}
                  className="w-full bg-[#050A15] border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Número de Telefone (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: 554999999999"
                  value={newInstancePhone}
                  onChange={e => setNewInstancePhone(e.target.value)}
                  className="w-full bg-[#050A15] border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-emerald-500/60"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewInstanceModal(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white rounded-xl bg-gray-800/60 hover:bg-gray-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Criando..." : "Criar Linha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
