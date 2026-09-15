"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  Award,
  DollarSign,
  Kanban,
  MessageSquare,
  Tag,
  Clock,
  Send,
  Sparkles,
  Layers,
  Bell,
  CheckSquare,
  AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { TriggerType, ActionType, DynamicVariable } from "@/types/automation";

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DYNAMIC_VARIABLES: DynamicVariable[] = [
  { tag: "{{clientName}}", label: "Nome do Cliente", example: "Dr. Roberto Santos" },
  { tag: "{{proposalCode}}", label: "Cód. Proposta", example: "PROP-8821" },
  { tag: "{{dealTitle}}", label: "Título do Negócio", example: "Implementação Enterprise" },
  { tag: "{{value}}", label: "Valor Total", example: "R$ 15.000,00" },
  { tag: "{{userEmail}}", label: "E-mail do Consultor", example: "comercial@versus.io" },
  { tag: "{{phone}}", label: "Telefone do Cliente", example: "+55 11 98765-4321" },
  { tag: "{{companyName}}", label: "Empresa do Cliente", example: "Santos & Associados" }
];

export function AutomationModal({ isOpen, onClose, onSuccess }: AutomationModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Passo 1: Informações Básicas
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Passo 2: Gatilho
  const [triggerType, setTriggerType] = useState<TriggerType>("PROPOSAL_ACCEPTED");
  const [triggerConditions, setTriggerConditions] = useState<{
    minValue?: string;
    stage?: string;
    tag?: string;
    timeoutMinutes?: number;
  }>({});

  // Passo 3: Ação
  const [actionType, setActionType] = useState<ActionType>("SEND_WHATSAPP");
  const [messageTemplate, setMessageTemplate] = useState(
    "Olá {{clientName}}! 🎉 Recebemos o aceite da proposta {{proposalCode}} no valor de {{value}}. Já iniciamos a preparação do seu onboarding!"
  );
  const [targetStage, setTargetStage] = useState("ganho");
  const [actionTag, setActionTag] = useState("cliente-fechado");
  const [taskTitle, setTaskTitle] = useState("Realizar onboarding do cliente {{clientName}}");
  const [notifyMsg, setNotifyMsg] = useState("Nova proposta {{proposalCode}} aceita por {{clientName}}!");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const insertVariable = (variableTag: string) => {
    if (!textareaRef.current) {
      setMessageTemplate(prev => prev + " " + variableTag);
      return;
    }
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = messageTemplate;
    const updated = current.substring(0, start) + variableTag + current.substring(end);
    setMessageTemplate(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableTag.length, start + variableTag.length);
    }, 50);
  };

  const getInterpolatedPreview = () => {
    let preview = messageTemplate;
    DYNAMIC_VARIABLES.forEach(v => {
      preview = preview.replaceAll(v.tag, v.example);
    });
    return preview;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        toast.error("Por favor, informe o nome da automação.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const handleSaveAutomation = async () => {
    if (!name.trim()) {
      toast.error("Por favor, dê um nome para a automação.");
      return;
    }

    setIsSubmitting(true);
    try {
      let actionPayload: Record<string, any> = {};
      if (actionType === "SEND_WHATSAPP") {
        actionPayload = { message: messageTemplate };
      } else if (actionType === "UPDATE_DEAL_STAGE") {
        actionPayload = { stage: targetStage };
      } else if (actionType === "ADD_TAG") {
        actionPayload = { tag: actionTag };
      } else if (actionType === "CREATE_TASK") {
        actionPayload = { title: taskTitle };
      } else if (actionType === "NOTIFY_USER") {
        actionPayload = { alert: notifyMsg };
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        triggerType,
        triggerConditions,
        conditions: triggerConditions,
        actionType,
        actionPayload,
        actions: [{ type: actionType, ...actionPayload }],
        isActive: true
      };

      await api.post("/automations", payload);
      toast.success("Automação criada e ativada com sucesso!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao criar automação:", err);
      toast.error(err.response?.data?.message || "Erro ao salvar automação no servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggersList: {
    type: TriggerType;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      type: "PROPOSAL_ACCEPTED",
      title: "Proposta Aceita",
      description: "Dispara assim que o cliente aceita e assina a proposta comercial.",
      icon: <FileCheck className="text-emerald-400" size={20} />,
      color: "border-emerald-500/40 bg-emerald-500/10"
    },
    {
      type: "CONTRACT_SIGNED",
      title: "Contrato Assinado",
      description: "Dispara no momento em que um contrato é rubricado digitalmente.",
      icon: <Award className="text-purple-400" size={20} />,
      color: "border-purple-500/40 bg-purple-500/10"
    },
    {
      type: "DEAL_CREATED",
      title: "Nova Oportunidade Criada",
      description: "Dispara quando um novo card de negócio entra no CRM de vendas.",
      icon: <DollarSign className="text-cyan-400" size={20} />,
      color: "border-cyan-500/40 bg-cyan-500/10"
    },
    {
      type: "DEAL_STAGE_CHANGED",
      title: "Etapa de Funil Alterada",
      description: "Dispara quando um card é arrastado para uma coluna específica no CRM.",
      icon: <Kanban className="text-blue-400" size={20} />,
      color: "border-blue-500/40 bg-blue-500/10"
    },
    {
      type: "MESSAGE_RECEIVED",
      title: "Mensagem Recebida",
      description: "Dispara quando um contato envia uma nova mensagem no WhatsApp.",
      icon: <MessageSquare className="text-amber-400" size={20} />,
      color: "border-amber-500/40 bg-amber-500/10"
    },
    {
      type: "TAG_ADDED",
      title: "Tag Adicionada",
      description: "Dispara quando uma etiqueta é atribuída ao lead ou contato.",
      icon: <Tag className="text-pink-400" size={20} />,
      color: "border-pink-500/40 bg-pink-500/10"
    },
    {
      type: "INACTIVITY_TIMEOUT",
      title: "Inatividade sem Resposta",
      description: "Dispara após X tempo de inatividade esperando retorno do lead.",
      icon: <Clock className="text-orange-400" size={20} />,
      color: "border-orange-500/40 bg-orange-500/10"
    }
  ];

  const actionsList: {
    type: ActionType;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      type: "SEND_WHATSAPP",
      title: "Enviar Mensagem no WhatsApp",
      description: "Disparo instantâneo com texto dinâmico e variáveis personalizadas.",
      icon: <Send className="text-emerald-400" size={18} />
    },
    {
      type: "UPDATE_DEAL_STAGE",
      title: "Mover Card de Funil (CRM)",
      description: "Altera automaticamente a coluna/status do negócio no funil de vendas.",
      icon: <Kanban className="text-blue-400" size={18} />
    },
    {
      type: "CREATE_TASK",
      title: "Criar Tarefa para a Equipe",
      description: "Agenda uma atividade obrigatória no CRM com prazo determinado.",
      icon: <CheckSquare className="text-cyan-400" size={18} />
    },
    {
      type: "ADD_TAG",
      title: "Adicionar Tag ao Contato",
      description: "Etiqueta o cliente para segmentação e automações subsequentes.",
      icon: <Tag className="text-pink-400" size={18} />
    },
    {
      type: "NOTIFY_USER",
      title: "Notificar Consultor Comercial",
      description: "Gera um alerta imediato na central de notificações da equipe.",
      icon: <Bell className="text-yellow-400" size={18} />
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B1224] border border-slate-800/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Construtor de Automação Comercial
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  Enterprise
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure gatilhos inteligentes e ações instantâneas sem intervenção humana
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* STEPPER PROGRESS */}
        <div className="px-8 py-3 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-8 w-full max-w-2xl mx-auto">
            {/* Step 1 */}
            <div
              onClick={() => setStep(1)}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 1
                    ? "bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20 shadow-lg shadow-cyan-500/30"
                    : step > 1
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {step > 1 ? <CheckCircle2 size={14} /> : "1"}
              </div>
              <span
                className={`text-xs font-semibold ${
                  step === 1 ? "text-cyan-400" : step > 1 ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                Identificação
              </span>
            </div>

            <div className="flex-1 h-[2px] bg-slate-800">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
              />
            </div>

            {/* Step 2 */}
            <div
              onClick={() => step >= 2 && setStep(2)}
              className={`flex items-center gap-2.5 ${step >= 2 ? "cursor-pointer" : "opacity-60"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 2
                    ? "bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20 shadow-lg shadow-cyan-500/30"
                    : step > 2
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {step > 2 ? <CheckCircle2 size={14} /> : "2"}
              </div>
              <span
                className={`text-xs font-semibold ${
                  step === 2 ? "text-cyan-400" : step > 2 ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                Gatilho (QUANDO)
              </span>
            </div>

            <div className="flex-1 h-[2px] bg-slate-800">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: step === 3 ? "100%" : "0%" }}
              />
            </div>

            {/* Step 3 */}
            <div
              onClick={() => step === 3 && setStep(3)}
              className={`flex items-center gap-2.5 ${step === 3 ? "cursor-pointer" : "opacity-60"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 3
                    ? "bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20 shadow-lg shadow-cyan-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                3
              </div>
              <span
                className={`text-xs font-semibold ${
                  step === 3 ? "text-cyan-400" : "text-slate-400"
                }`}
              >
                Ação (ENTÃO)
              </span>
            </div>
          </div>
        </div>

        {/* MODAL CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* PASSO 1: IDENTIFICAÇÃO */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150 max-w-2xl mx-auto py-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Nome da Automação <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Boas-vindas pós aceite de proposta comercial"
                    className="w-full bg-[#050A15] border border-slate-700/70 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium text-sm"
                  />
                  <Zap
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Dê um nome claro para que sua equipe identifique facilmente a finalidade do fluxo.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Descrição / Objetivo (Opcional)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Envia WhatsApp com link de onboarding e move o card do CRM para 'Ganho'."
                  rows={4}
                  className="w-full bg-[#050A15] border border-slate-700/70 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <Sparkles className="text-cyan-400 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Dica Enterprise:</strong> Automações bem descritas
                  facilitam a governança entre consultores comerciais, supervisores de vendas e
                  equipes de implantação.
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2: GATILHO (QUANDO) */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-2">
                  <Zap size={16} /> 1. Escolha o Evento Disparador (QUANDO)
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Selecione o acontecimento comercial que irá iniciar o fluxo de automação:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {triggersList.map(t => {
                    const isSelected = triggerType === t.type;
                    return (
                      <div
                        key={t.type}
                        onClick={() => setTriggerType(t.type)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 relative ${
                          isSelected
                            ? `${t.color} ring-1 ring-cyan-400 shadow-lg shadow-cyan-500/10`
                            : "bg-[#050A15]/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40"
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 shrink-0 mt-0.5">
                          {t.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white">{t.title}</h4>
                            {isSelected && (
                              <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {t.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CONDIÇÕES ESPECÍFICAS DE REFINAMENTO */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers size={14} className="text-cyan-400" />
                  Condições de Refinamento (Opcionais)
                </h4>

                {(triggerType === "PROPOSAL_ACCEPTED" || triggerType === "DEAL_CREATED") && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Disparar apenas se o valor for maior ou igual a (R$):
                    </label>
                    <input
                      type="number"
                      value={triggerConditions.minValue || ""}
                      onChange={e =>
                        setTriggerConditions(prev => ({ ...prev, minValue: e.target.value }))
                      }
                      placeholder="Ex: 5000 (Deixe em branco para qualquer valor)"
                      className="w-full bg-[#050A15] border border-slate-700/70 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {triggerType === "DEAL_STAGE_CHANGED" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Quando for movido especificamente para a etapa:
                    </label>
                    <select
                      value={triggerConditions.stage || ""}
                      onChange={e =>
                        setTriggerConditions(prev => ({ ...prev, stage: e.target.value }))
                      }
                      className="w-full bg-[#050A15] border border-slate-700/70 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">Qualquer Etapa</option>
                      <option value="leads">Novos Leads</option>
                      <option value="qualificacao">Qualificação</option>
                      <option value="proposta">Proposta Apresentada</option>
                      <option value="negociacao">Negociação</option>
                      <option value="ganho">Negócio Ganho (Fechado)</option>
                      <option value="perdido">Negócio Perdido</option>
                    </select>
                  </div>
                )}

                {triggerType === "TAG_ADDED" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Disparar apenas quando a tag adicionada for:
                    </label>
                    <input
                      type="text"
                      value={triggerConditions.tag || ""}
                      onChange={e =>
                        setTriggerConditions(prev => ({ ...prev, tag: e.target.value }))
                      }
                      placeholder="Ex: vip, prioridade-alta, retorno-agendado"
                      className="w-full bg-[#050A15] border border-slate-700/70 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {triggerType === "INACTIVITY_TIMEOUT" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Tempo de tolerância aguardando resposta (em minutos):
                    </label>
                    <input
                      type="number"
                      value={triggerConditions.timeoutMinutes || 60}
                      onChange={e =>
                        setTriggerConditions(prev => ({
                          ...prev,
                          timeoutMinutes: Number(e.target.value)
                        }))
                      }
                      className="w-full bg-[#050A15] border border-slate-700/70 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Exemplo: 60 = 1 hora de silêncio do contato antes de disparar o lembrete.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASSO 3: AÇÃO (ENTÃO) */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-2">
                  <Zap size={16} /> 2. O que o sistema deve fazer? (ENTÃO)
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Selecione a ação automatizada que será executada imediatamente:
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-6">
                  {actionsList.map(a => {
                    const isSelected = actionType === a.type;
                    return (
                      <button
                        key={a.type}
                        type="button"
                        onClick={() => setActionType(a.type)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-400"
                            : "bg-[#050A15]/60 border-slate-800 hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                            {a.icon}
                          </div>
                          {isSelected && <CheckCircle2 size={16} className="text-emerald-400" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{a.title}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                            {a.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CONFIGURAÇÃO DA AÇÃO ESPECÍFICA */}
              {actionType === "SEND_WHATSAPP" && (
                <div className="space-y-4 p-5 rounded-2xl bg-[#050A15] border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Send size={14} className="text-emerald-400" />
                      Mensagem do WhatsApp (Template Dinâmico)
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Clique nas tags abaixo para inserir
                    </span>
                  </div>

                  {/* PÍLULAS DE VARIÁVEIS DINÂMICAS */}
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    {DYNAMIC_VARIABLES.map(v => (
                      <button
                        key={v.tag}
                        type="button"
                        onClick={() => insertVariable(v.tag)}
                        title={`Exemplo: ${v.example}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-700/60 text-slate-300 text-xs font-mono transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <Sparkles size={11} className="text-cyan-400" />
                        <span>{v.label}</span>
                        <span className="text-slate-500 text-[10px]">({v.tag})</span>
                      </button>
                    ))}
                  </div>

                  {/* TEXTAREA COM REF */}
                  <div>
                    <textarea
                      ref={textareaRef}
                      value={messageTemplate}
                      onChange={e => setMessageTemplate(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none leading-relaxed"
                      placeholder="Digite a mensagem..."
                    />
                  </div>

                  {/* PREVIEW DO WHATSAPP AO VIVO */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/20 relative overflow-hidden">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> Pré-visualização com dados reais interpolados
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-emerald-200 text-xs font-sans leading-relaxed whitespace-pre-wrap">
                      {getInterpolatedPreview()}
                    </div>
                  </div>
                </div>
              )}

              {actionType === "UPDATE_DEAL_STAGE" && (
                <div className="p-5 rounded-2xl bg-[#050A15] border border-slate-800 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Selecione a Etapa de Destino no CRM:
                  </label>
                  <select
                    value={targetStage}
                    onChange={e => setTargetStage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="ganho">🏆 Negócio Ganho (Fechado)</option>
                    <option value="proposta">📄 Proposta Apresentada</option>
                    <option value="negociacao">🤝 Em Negociação</option>
                    <option value="qualificacao">🎯 Qualificação</option>
                    <option value="perdido">❌ Negócio Perdido</option>
                  </select>
                </div>
              )}

              {actionType === "CREATE_TASK" && (
                <div className="p-5 rounded-2xl bg-[#050A15] border border-slate-800 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Título da Tarefa:
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-xs text-slate-500">
                    Você pode usar variáveis como <code className="text-cyan-400">{"{{clientName}}"}</code> no título da tarefa.
                  </p>
                </div>
              )}

              {actionType === "ADD_TAG" && (
                <div className="p-5 rounded-2xl bg-[#050A15] border border-slate-800 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Tag a ser adicionada no Contato:
                  </label>
                  <input
                    type="text"
                    value={actionTag}
                    onChange={e => setActionTag(e.target.value)}
                    placeholder="Ex: cliente-vip"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
              )}

              {actionType === "NOTIFY_USER" && (
                <div className="p-5 rounded-2xl bg-[#050A15] border border-slate-800 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Mensagem de Alerta para o Time:
                  </label>
                  <input
                    type="text"
                    value={notifyMsg}
                    onChange={e => setNotifyMsg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-6 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                Avançar <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveAutomation}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>Salvando Automação...</>
                ) : (
                  <>
                    <Zap size={16} fill="currentColor" /> Salvar e Ativar Automação
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
