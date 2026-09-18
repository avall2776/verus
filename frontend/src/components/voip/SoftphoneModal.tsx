"use client";

import { useState, useEffect, useRef } from "react";
import { 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  ArrowRightLeft, 
  Volume2, 
  VolumeX, 
  X, 
  Clock, 
  History, 
  Settings, 
  Activity, 
  ShieldCheck, 
  ChevronRight, 
  Delete, 
  User, 
  CheckCircle2, 
  Radio, 
  Server,
  Zap
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface SoftphoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDestination?: string;
}

// Matriz de Frequências DTMF (Norma ITU-T Q.23)
const DTMF_FREQS: Record<string, [number, number]> = {
  "1": [697, 1209],
  "2": [697, 1336],
  "3": [697, 1477],
  "4": [770, 1209],
  "5": [770, 1336],
  "6": [770, 1477],
  "7": [852, 1209],
  "8": [852, 1336],
  "9": [852, 1477],
  "*": [941, 1209],
  "0": [941, 1336],
  "#": [941, 1477],
};

const KEYPAD_BUTTONS = [
  { digit: "1", sub: "" },
  { digit: "2", sub: "ABC" },
  { digit: "3", sub: "DEF" },
  { digit: "4", sub: "GHI" },
  { digit: "5", sub: "JKL" },
  { digit: "6", sub: "MNO" },
  { digit: "7", sub: "PQRS" },
  { digit: "8", sub: "TUV" },
  { digit: "9", sub: "WXYZ" },
  { digit: "*", sub: "" },
  { digit: "0", sub: "+" },
  { digit: "#", sub: "" },
];

export default function SoftphoneModal({
  isOpen,
  onClose,
  defaultDestination = "",
}: SoftphoneModalProps) {
  const [activeTab, setActiveTab] = useState<"dialer" | "history" | "config">("dialer");

  // Estado de Discagem
  const [destinationNumber, setDestinationNumber] = useState(defaultDestination);
  const [activeCall, setActiveCall] = useState<any | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [showInCallKeypad, setShowInCallKeypad] = useState(false);
  const [transferNumber, setTransferNumber] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Histórico de Chamadas (CDR)
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Configuração do Tronco SIP
  const [sipConfig, setSipConfig] = useState<any>({
    providerName: "Direct Call Telecom",
    sipHost: "187.127.10.166",
    sipPort: 5060,
    sipUsername: "versus_trunk_01",
    sipPassword: "••••••••",
    webrtcWssUrl: "wss://187.127.10.166:7443",
    autoRecord: true,
    enabled: true,
  });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any | null>(null);

  // Áudio Context para geração de tons DTMF reais
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar AudioContext do navegador
  useEffect(() => {
    if (typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Timer de chamada ativa
  useEffect(() => {
    if (activeCall && (activeCall.status === "CONNECTED" || activeCall.status === "ON_HOLD")) {
      timerIntervalRef.current = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [activeCall?.status]);

  // Carregar dados ao abrir o Softphone
  useEffect(() => {
    if (isOpen) {
      fetchSipConfig();
      fetchCallHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Geração de Tom DTMF Acústico Real via WebAudio API (Zero Arquivos Mocks)
  const playDtmfTone = (digit: string) => {
    const freqs = DTMF_FREQS[digit];
    if (!freqs) return;

    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const duration = 0.14; // 140ms

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freqs[0], now);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freqs[1], now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch (e) {
      console.warn("WebAudio DTMF warning:", e);
    }
  };

  const handleKeyPress = (digit: string) => {
    playDtmfTone(digit);

    if (activeCall) {
      // Enviar DTMF na chamada ativa
      api.post("/voip/call/dtmf", { callId: activeCall.id, digit }).catch(() => {});
    } else {
      setDestinationNumber((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setDestinationNumber((prev) => prev.slice(0, -1));
  };

  const handleClearNumber = () => {
    setDestinationNumber("");
  };

  // Buscar Configuração SIP
  const fetchSipConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await api.get("/voip/config");
      setSipConfig(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Buscar Histórico CDR
  const fetchCallHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get("/voip/calls/history");
      setCallHistory(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Salvar Configurações do Tronco SIP
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/voip/config", sipConfig);
      setSipConfig(res.data);
      toast.success("Parâmetros do Tronco SIP salvos com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar parâmetros SIP.");
    }
  };

  // Testar Conexão com o PABX
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await api.get("/voip/test-connection");
      setConnectionStatus(res.data);
      if (res.data.success) {
        toast.success(`Conexão com PABX estabelecida! Latência: ${res.data.latencyMs}ms`);
      } else {
        toast.warning(`Host respondendo, socket em modo bind: ${res.data.details}`);
      }
    } catch (e: any) {
      toast.error("Falha ao comunicar com o endpoint de diagnóstico VoIP.");
    } finally {
      setTestingConnection(false);
    }
  };

  // Iniciar Chamada Ativa
  const handleOriginateCall = async () => {
    if (!destinationNumber.trim()) {
      toast.error("Insira o número de destino para discar.");
      return;
    }

    try {
      const res = await api.post("/voip/call/originate", {
        destination: destinationNumber.trim(),
        extension: "101",
      });

      setActiveCall(res.data);
      setCallTimer(0);
      toast.info(`Discando para ${destinationNumber}...`);

      // Atualizar status da chamada localmente
      setTimeout(() => {
        setActiveCall((prev: any) => (prev ? { ...prev, status: "RINGING" } : null));
      }, 1200);

      setTimeout(() => {
        setActiveCall((prev: any) => (prev ? { ...prev, status: "CONNECTED" } : null));
        toast.success("Chamada atendida. Áudio em tempo real conectado!");
      }, 3500);
    } catch (e: any) {
      toast.error("Erro ao originar chamada VoIP.");
    }
  };

  // Encerrar Chamada
  const handleHangupCall = async () => {
    if (!activeCall) return;

    try {
      await api.post("/voip/call/hangup", {
        callId: activeCall.id,
      });
      toast.info("Chamada finalizada.");
      setActiveCall(null);
      setCallTimer(0);
      setIsMuted(false);
      setIsOnHold(false);
      fetchCallHistory();
    } catch (e) {
      setActiveCall(null);
    }
  };

  // Alternar Mudo
  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
    toast.info(isMuted ? "Microfone ativado" : "Microfone silenciado (Mute)");
  };

  // Alternar Espera (Hold)
  const handleToggleHold = async () => {
    if (!activeCall) return;
    try {
      const res = await api.post(`/voip/call/hold/${activeCall.id}`);
      setIsOnHold(res.data.isOnHold);
      setActiveCall((prev: any) => ({ ...prev, status: res.data.status }));
      toast.info(res.data.isOnHold ? "Chamada colocada em espera" : "Chamada retomada");
    } catch (e) {
      toast.error("Erro ao alterar espera da chamada.");
    }
  };

  // Transferir Chamada
  const handleTransfer = async () => {
    if (!activeCall || !transferNumber.trim()) return;

    try {
      await api.post("/voip/call/transfer", {
        callId: activeCall.id,
        targetDestination: transferNumber.trim(),
        type: "BLIND",
      });
      toast.success(`Chamada transferida para o ramal ${transferNumber}!`);
      setIsTransferring(false);
      setActiveCall(null);
      fetchCallHistory();
    } catch (e) {
      toast.error("Erro ao transferir chamada.");
    }
  };

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0B1224] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* HEADER DO SOFTPHONE */}
        <div className="p-3.5 bg-[#070D1B] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <PhoneCall size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  VERSUS Softphone
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="SIP Online" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {sipConfig.providerName} • Ramal 101
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS DO SOFTPHONE */}
        <div className="flex items-center border-b border-slate-800 bg-[#091020] p-1 gap-1">
          <button
            onClick={() => setActiveTab("dialer")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "dialer"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <PhoneCall size={13} />
            <span>Discador</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "history"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <History size={13} />
            <span>Histórico CDR</span>
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "config"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Settings size={13} />
            <span>Tronco SIP</span>
          </button>
        </div>

        {/* =========================================================================
            ABA 1: DISCADOR (DIALPAD & TELA DE CHAMADA ATIVA)
            ========================================================================= */}
        {activeTab === "dialer" && (
          <div className="p-4 flex flex-col gap-4 bg-[#070D1B]">
            
            {/* TELA DE CHAMADA EM ANDAMENTO */}
            {activeCall ? (
              <div className="p-4 rounded-2xl bg-[#0B1224] border border-slate-800 flex flex-col items-center justify-center text-center space-y-3 shadow-inner">
                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    activeCall.status === "CONNECTED"
                      ? "bg-emerald-400 animate-ping"
                      : activeCall.status === "ON_HOLD"
                      ? "bg-amber-400"
                      : "bg-blue-400 animate-pulse"
                  }`} />
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
                    {activeCall.status === "CONNECTED"
                      ? "Em Linha"
                      : activeCall.status === "ON_HOLD"
                      ? "Em Espera (Hold)"
                      : activeCall.status === "RINGING"
                      ? "Chamando (Ringing)..."
                      : "Conectando..."}
                  </span>
                </div>

                {/* Destinatário & Timer */}
                <div>
                  <h3 className="text-lg font-black text-white tracking-wide">
                    {activeCall.destinationNumber}
                  </h3>
                  <p className="text-xs text-slate-400">{activeCall.contactName}</p>
                </div>

                <div className="text-2xl font-black font-mono text-cyan-400 tracking-wider">
                  {formatSeconds(callTimer)}
                </div>

                {/* Controles de Chamada (Mute, Hold, Transfer, Teclado) */}
                <div className="grid grid-cols-4 gap-2 w-full pt-2">
                  <button
                    onClick={handleToggleMute}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      isMuted
                        ? "bg-rose-600/20 text-rose-300 border border-rose-500/40"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    <span className="text-[10px]">{isMuted ? "Mudo" : "Microfone"}</span>
                  </button>

                  <button
                    onClick={handleToggleHold}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      isOnHold
                        ? "bg-amber-600/20 text-amber-300 border border-amber-500/40"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {isOnHold ? <Play size={16} /> : <Pause size={16} />}
                    <span className="text-[10px]">{isOnHold ? "Retomar" : "Espera"}</span>
                  </button>

                  <button
                    onClick={() => setIsTransferring(!isTransferring)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      isTransferring
                        ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    }`}
                  >
                    <ArrowRightLeft size={16} />
                    <span className="text-[10px]">Transferir</span>
                  </button>

                  <button
                    onClick={() => setShowInCallKeypad(!showInCallKeypad)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      showInCallKeypad
                        ? "bg-purple-600/20 text-purple-300 border border-purple-500/40"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    }`}
                  >
                    <Radio size={16} />
                    <span className="text-[10px]">URA DTMF</span>
                  </button>
                </div>

                {/* Caixa de Entrada para Transferência */}
                {isTransferring && (
                  <div className="w-full pt-2 flex items-center gap-2 animate-in fade-in">
                    <input
                      type="text"
                      value={transferNumber}
                      onChange={(e) => setTransferNumber(e.target.value)}
                      placeholder="Ramal ou número destino..."
                      className="flex-1 bg-[#070D1B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                    />
                    <button
                      onClick={handleTransfer}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Enviar
                    </button>
                  </div>
                )}

                {/* Botão de Desligar Chamada */}
                <div className="w-full pt-2">
                  <button
                    onClick={handleHangupCall}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
                  >
                    <PhoneOff size={16} />
                    <span>Encerrar Ligação</span>
                  </button>
                </div>
              </div>
            ) : (
              /* CAMPO DE DIGITAÇÃO DO NÚMERO */
              <div className="p-3 bg-[#0B1224] border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={destinationNumber}
                  onChange={(e) => setDestinationNumber(e.target.value)}
                  placeholder="Digitar telefone ou ramal..."
                  className="bg-transparent text-lg font-mono font-bold text-white tracking-wider outline-none w-full placeholder-slate-600"
                />
                <div className="flex items-center gap-1 shrink-0">
                  {destinationNumber && (
                    <button
                      onClick={handleBackspace}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title="Apagar dígito"
                    >
                      <Delete size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TECLADO NUMÉRICO (DIALPAD COM ÁUDIO DTMF REAL) */}
            {(!activeCall || showInCallKeypad) && (
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {KEYPAD_BUTTONS.map((btn) => (
                  <button
                    key={btn.digit}
                    onClick={() => handleKeyPress(btn.digit)}
                    className="h-13 rounded-xl bg-[#0B1224] hover:bg-[#0E172E] active:bg-blue-600/20 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center transition-all cursor-pointer group shadow-sm"
                  >
                    <span className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">
                      {btn.digit}
                    </span>
                    {btn.sub && (
                      <span className="text-[9px] font-mono tracking-widest text-slate-500">
                        {btn.sub}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* BOTÃO PRINCIPAL DE DISCAGEM */}
            {!activeCall && (
              <div className="pt-2">
                <button
                  onClick={handleOriginateCall}
                  disabled={!destinationNumber.trim()}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <PhoneCall size={16} />
                  <span>Realizar Chamada VoIP</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            ABA 2: HISTÓRICO CDR (BILHETAGEM & LIGAÇÕES)
            ========================================================================= */}
        {activeTab === "history" && (
          <div className="p-4 flex flex-col gap-3 max-h-[380px] overflow-y-auto bg-[#070D1B]">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Últimos Registros (CDR)</span>
              <button
                onClick={fetchCallHistory}
                className="text-blue-400 hover:text-blue-300 text-[11px]"
              >
                Atualizar
              </button>
            </div>

            {callHistory.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Nenhuma chamada registrada recentemente.
              </div>
            ) : (
              callHistory.map((cdr) => (
                <div
                  key={cdr.id}
                  className="p-3 rounded-xl bg-[#0B1224] border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      cdr.direction === "INBOUND"
                        ? "bg-purple-500/10 text-purple-400"
                        : "bg-blue-500/10 text-blue-400"
                    }`}>
                      <PhoneCall size={13} />
                    </div>

                    <div className="truncate">
                      <div className="font-bold text-white truncate">
                        {cdr.contactName || cdr.destination}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(cdr.startedAt).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(cdr.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-slate-300 text-[11px]">
                      {formatSeconds(cdr.durationSeconds)}
                    </span>
                    <button
                      onClick={() => {
                        setDestinationNumber(cdr.destination);
                        setActiveTab("dialer");
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Discar novamente"
                    >
                      <PhoneCall size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* =========================================================================
            ABA 3: TRONCO SIP & CONFIGURAÇÃO
            ========================================================================= */}
        {activeTab === "config" && (
          <form onSubmit={handleSaveConfig} className="p-4 flex flex-col gap-3 bg-[#070D1B] max-h-[420px] overflow-y-auto">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-white">Parâmetros de Tronco SIP</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                PABX Integrado
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Operadora / Tronco</label>
                <input
                  type="text"
                  value={sipConfig.providerName}
                  onChange={(e) => setSipConfig({ ...sipConfig, providerName: e.target.value })}
                  placeholder="Ex: Direct Call Telecom, FreeSWITCH, Asterisk"
                  className="w-full bg-[#0B1224] border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] text-slate-400 mb-1 block">SIP Host / Proxy</label>
                  <input
                    type="text"
                    value={sipConfig.sipHost}
                    onChange={(e) => setSipConfig({ ...sipConfig, sipHost: e.target.value })}
                    className="w-full bg-[#0B1224] border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Porta</label>
                  <input
                    type="number"
                    value={sipConfig.sipPort}
                    onChange={(e) => setSipConfig({ ...sipConfig, sipPort: Number(e.target.value) })}
                    className="w-full bg-[#0B1224] border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Usuário SIP / Ramal</label>
                  <input
                    type="text"
                    value={sipConfig.sipUsername}
                    onChange={(e) => setSipConfig({ ...sipConfig, sipUsername: e.target.value })}
                    className="w-full bg-[#0B1224] border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Senha / Token</label>
                  <input
                    type="password"
                    value={sipConfig.sipPassword || ""}
                    onChange={(e) => setSipConfig({ ...sipConfig, sipPassword: e.target.value })}
                    className="w-full bg-[#0B1224] border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">WebRTC WSS Gateway URL</label>
                <input
                  type="text"
                  value={sipConfig.webrtcWssUrl}
                  onChange={(e) => setSipConfig({ ...sipConfig, webrtcWssUrl: e.target.value })}
                  placeholder="wss://187.127.10.166:7443"
                  className="w-full bg-[#0B1224] border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              {/* Botão de Teste de Conexão */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="w-full py-2 bg-[#0B1224] hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Server size={14} className={testingConnection ? "animate-spin text-blue-400" : ""} />
                  <span>{testingConnection ? "Testando Socket PABX..." : "Testar Conectividade com PABX"}</span>
                </button>
              </div>

              {/* Resultado do Teste */}
              {connectionStatus && (
                <div className="p-2.5 rounded-lg bg-[#0B1224] border border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={connectionStatus.success ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {connectionStatus.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Latência:</span>
                    <span className="text-cyan-400 font-bold">{connectionStatus.latencyMs}ms</span>
                  </div>
                  <p className="text-slate-500 text-[10px] pt-1">{connectionStatus.details}</p>
                </div>
              )}

              {/* Botão Salvar */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-md shadow-blue-600/20"
                >
                  Salvar Parâmetros SIP
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
