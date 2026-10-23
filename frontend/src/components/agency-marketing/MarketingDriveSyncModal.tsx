"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FolderArchive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FolderPlus,
  Video,
  Image as ImageIcon,
  Check,
  ChevronRight,
  Sparkles,
  Key,
  HelpCircle,
  Layers,
  ArrowRight,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import ModalPortal from "@/components/ui/ModalPortal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted?: () => void;
}

export default function MarketingDriveSyncModal({
  isOpen,
  onClose,
  onSyncCompleted,
}: Props) {
  const [rootFolderUrl, setRootFolderUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [autoCreateClients, setAutoCreateClients] = useState(true);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);

  // Carregar configurações existentes ao abrir
  useEffect(() => {
    if (isOpen) {
      api
        .get("/agency/marketing/drive/config")
        .then((res) => {
          if (res.data) {
            setRootFolderUrl(res.data.rootFolderUrl || "");
            if (res.data.lastStats) {
              setSyncResult(res.data.lastStats);
            }
          }
          setIsConfigLoaded(true);
        })
        .catch(() => {
          setIsConfigLoaded(true);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = async () => {
    try {
      await api.post("/agency/marketing/drive/config", {
        rootFolderUrl: rootFolderUrl.trim(),
        apiKey: apiKey.trim() || undefined,
        autoSync: true,
      });
      toast.success("Configuração do Google Drive salva!");
    } catch (err: any) {
      toast.error("Erro ao salvar configuração.");
    }
  };

  const handleExecuteSync = async () => {
    if (!rootFolderUrl.trim()) {
      toast.error("Informe a URL ou ID da pasta raiz do Google Drive.");
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      // 1. Salvar configuração primeiro se houve alteração
      await api.post("/agency/marketing/drive/config", {
        rootFolderUrl: rootFolderUrl.trim(),
        apiKey: apiKey.trim() || undefined,
        autoSync: true,
      });

      // 2. Executar sincronização
      const res = await api.post("/agency/marketing/drive/sync", {
        rootFolderUrl: rootFolderUrl.trim(),
        apiKey: apiKey.trim() || undefined,
        autoCreateClients,
      });

      setSyncResult(res.data?.stats || null);
      toast.success(res.data?.message || "Sincronização concluída com sucesso!");

      if (onSyncCompleted) {
        onSyncCompleted();
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Falha ao sincronizar pastas do Google Drive. Verifique a URL e a chave de API.";
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0f141c] border border-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-white dark:bg-[#161c28]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <FolderArchive size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Monitoramento Automático de Pastas do Google Drive
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-semibold">
                  5 TB Pro
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                O sistema lê suas pastas, cria os clientes automaticamente e importa todos os vídeos e fotos para aprovação.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* CORPO / CONTEÚDO */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* COMO FUNCIONA - CARD EXPLICATIVO */}
          <div className="bg-slate-100 dark:bg-[#121824] border border-cyan-900/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-cyan-400" />
                Como a Automação Funciona na Prática:
              </span>
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-[11px] text-gray-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <HelpCircle size={12} />
                <span>{showHelp ? "Ocultar detalhes" : "Instruções Google API"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-[#0b0f17] border border-gray-800/80 p-3 rounded-xl flex flex-col gap-1">
                <span className="font-bold text-white flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full bg-cyan-900/80 text-cyan-300 text-[10px] flex items-center justify-center font-mono">1</span>
                  Pasta Raiz Agência
                </span>
                <span className="text-gray-400 text-[11px] leading-relaxed">
                  Crie uma pasta principal no Drive (ex: <i>"Clientes Marketing"</i>).
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-[#0b0f17] border border-gray-800/80 p-3 rounded-xl flex flex-col gap-1">
                <span className="font-bold text-white flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full bg-cyan-900/80 text-cyan-300 text-[10px] flex items-center justify-center font-mono">2</span>
                  Pastas dos Clientes
                </span>
                <span className="text-gray-400 text-[11px] leading-relaxed">
                  Crie subpastas com o nome de cada cliente (ex: <i>"Cliente A"</i>, <i>"Barbearia VIP"</i>).
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-[#0b0f17] border border-gray-800/80 p-3 rounded-xl flex flex-col gap-1">
                <span className="font-bold text-white flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full bg-cyan-900/80 text-cyan-300 text-[10px] flex items-center justify-center font-mono">3</span>
                  Vídeos e Fotos
                </span>
                <span className="text-gray-400 text-[11px] leading-relaxed">
                  Sua equipe solta os arquivos nas pastas. O sistema puxa e cria as demandas sozinho!
                </span>
              </div>
            </div>

            {showHelp && (
              <div className="mt-2 p-3 bg-slate-50 dark:bg-[#0a0d14] border border-gray-800 rounded-xl text-[11px] text-gray-300 space-y-1.5 leading-relaxed">
                <p className="font-bold text-white">Como obter sua Chave da Google Drive API (Gratuita):</p>
                <ol className="list-decimal pl-4 space-y-1 text-gray-400">
                  <li>Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Google Cloud Console</a>.</li>
                  <li>Crie um projeto ou selecione o atual, vá em <b>APIs e Serviços &gt; Biblioteca</b> e ative a <b>Google Drive API</b>.</li>
                  <li>Vá em <b>Credenciais &gt; Criar Credenciais &gt; Chave de API</b>.</li>
                  <li>Cole a Chave de API gerada no campo abaixo. Pronto! Suas pastas estarão 100% monitoradas.</li>
                </ol>
              </div>
            )}
          </div>

          {/* FORMULÁRIO DE CONFIGURAÇÃO */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center justify-between">
                <span>Link ou ID da Pasta Raiz no Google Drive *</span>
                {rootFolderUrl && (
                  <a
                    href={rootFolderUrl.startsWith("http") ? rootFolderUrl : `https://drive.google.com/drive/folders/${rootFolderUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Abrir pasta no Drive</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={rootFolderUrl}
                  onChange={(e) => setRootFolderUrl(e.target.value)}
                  placeholder="Ex: https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ..."
                  className="w-full bg-slate-100 dark:bg-[#121824] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-500 transition-colors font-mono"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Cole o link da pasta principal onde você cria as pastas dos clientes (o compartilhamento deve estar como "Qualquer pessoa com o link pode ver" ou concedido à sua API).
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                <Key size={13} className="text-cyan-400" />
                <span>Chave de API do Google Cloud (Google Drive API v3)</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-100 dark:bg-[#121824] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-500 transition-colors font-mono"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Permite que o sistema leia a lista de subpastas e arquivos automaticamente em segundo plano.
              </p>
            </div>

            {/* OPÇÕES DA SINCRONIZAÇÃO */}
            <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoCreateClients}
                  onChange={(e) => setAutoCreateClients(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-500"
                />
                <span className="text-xs text-gray-200 font-medium">
                  Criar clientes automaticamente ao encontrar novas subpastas no Drive
                </span>
              </label>
            </div>
          </div>

          {/* RESULTADO DA ÚLTIMA SINCRONIZAÇÃO */}
          {syncResult && (
            <div className="bg-slate-100 dark:bg-[#121824] border border-gray-800 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Resultado da Sincronização
                </span>
                <span className="text-[10px] text-gray-400">
                  {syncResult.details?.length || 0} pastas processadas
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 dark:bg-[#0b0f17] border border-gray-800/80 rounded-lg">
                  <span className="text-[10px] text-gray-400 block uppercase">Pastas Lidas</span>
                  <span className="text-sm font-bold text-white font-mono">{syncResult.clientsScanned}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-[#0b0f17] border border-emerald-950/50 rounded-lg">
                  <span className="text-[10px] text-emerald-400 block uppercase">Clientes Criados</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">+{syncResult.clientsCreated}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-[#0b0f17] border border-gray-800/80 rounded-lg">
                  <span className="text-[10px] text-gray-400 block uppercase">Arquivos Lidos</span>
                  <span className="text-sm font-bold text-white font-mono">{syncResult.cardsScanned}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-[#0b0f17] border border-cyan-950/50 rounded-lg">
                  <span className="text-[10px] text-cyan-400 block uppercase">Novas Peças / Cards</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono">+{syncResult.cardsCreated}</span>
                </div>
              </div>

              {/* LISTAGEM DE PASTAS SINCRONIZADAS */}
              {Array.isArray(syncResult.details) && syncResult.details.length > 0 && (
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pt-1">
                  {syncResult.details.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f17] border border-gray-800/60 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FolderArchive size={12} className="text-cyan-400" />
                        <span className="font-semibold text-white">{item.clientName}</span>
                        {item.isNewClient && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/50">
                            NOVO CLIENTE
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {item.filesFound} arquivos ({item.cardsCreated} novos cards)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RODAPÉ DE AÇÕES */}
        <div className="px-6 py-4 border-t border-gray-800 bg-white dark:bg-[#161c28] flex items-center justify-between">
          <button
            type="button"
            onClick={handleSaveConfig}
            className="text-xs text-gray-400 hover:text-white font-medium transition-colors"
          >
            Apenas Salvar Configurações
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleExecuteSync}
              disabled={syncing}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800/50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-cyan-950/40"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              <span>{syncing ? "Sincronizando Google Drive..." : "Sincronizar Pastas Agora"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
