"use client";

import { X, MessageSquare, ExternalLink, Calendar, CheckSquare, RefreshCw, Trash2, Tag, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface DealModalProps {
  deal: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (dealId: string, data: any) => Promise<void>;
}

export function DealModal({ deal, isOpen, onClose, onUpdate }: DealModalProps) {
  const router = useRouter();

  const [chatMode, setChatMode] = useState<'none' | 'send' | 'view'>('none');
  const [chatData, setChatData] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // States for Edits
  const [users, setUsers] = useState<any[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [tempValue, setTempValue] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setChatMode('none');
      setChatData(null);
      api.get('/deals/users').then(res => setUsers(res.data)).catch(console.error);
    }
  }, [isOpen, deal?.id]);

  if (!isOpen || !deal) return null;

  const loadChat = async (mode: 'send' | 'view') => {
    setChatMode(mode);
    setIsLoadingChat(true);
    try {
      const { data } = await api.get(`/conversations/contact/${deal.contactId}`);
      setChatData(data);
    } catch (err) {
      toast.error("Nenhuma conversa ativa encontrada ou sem histórico.");
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSendMsg = async () => {
    if (!chatInput.trim()) return;
    try {
      if (chatData?.id) {
        const { data } = await api.post(`/conversations/${chatData.id}/messages`, {
          content: chatInput,
          isInternal,
          type: 'text'
        });
        setChatData((prev: any) => ({ ...prev, messages: [...(prev?.messages || []), data] }));
      } else {
        await api.post(`/conversations/contact/${deal.contactId}/messages`, {
          content: chatInput,
          isInternal,
          type: 'text'
        });
        await loadChat('send');
      }
      setChatInput("");
      toast.success("Mensagem enviada com sucesso!");
    } catch (err) {
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleUpdateContact = async () => {
    if (tempName.trim() === deal.contact.name) {
      setIsEditingName(false);
      return;
    }
    try {
      await api.patch(`/contacts/${deal.contactId}`, { name: tempName });
      deal.contact.name = tempName; // Optimistic
      setIsEditingName(false);
      toast.success("Nome atualizado");
    } catch (err) {
      toast.error("Erro ao atualizar nome");
    }
  };

  const handleUpdateValue = async () => {
    const numericValue = parseFloat(tempValue.replace(/\D/g, '')) / 100;
    if (isNaN(numericValue) || numericValue === deal.value) {
      setIsEditingValue(false);
      return;
    }
    try {
      await onUpdate(deal.id, { value: numericValue });
      setIsEditingValue(false);
      toast.success("Valor atualizado");
    } catch (err) {
      toast.error("Erro ao atualizar valor");
    }
  };

  const handleUpdateNotes = async () => {
    if (tempNotes === deal.notes) {
      setIsEditingNotes(false);
      return;
    }
    try {
      await onUpdate(deal.id, { notes: tempNotes });
      setIsEditingNotes(false);
      toast.success("Anotações salvas");
    } catch (err) {
      toast.error("Erro ao salvar anotações");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleOverlayClick}>
      <div className="bg-[#1c1d22] border border-gray-800 w-full max-w-4xl max-h-[90vh] rounded-xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60 bg-[#25262c] rounded-t-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border border-[#f37021] flex items-center justify-center bg-[#f37021]/10 text-[#f37021] font-bold text-lg shrink-0">
              {deal.contact?.name ? deal.contact.name.substring(0, 2).toUpperCase() : '??'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-emerald-500 font-mono bg-emerald-500/10 px-1.5 rounded">ID: {deal.id.split('-')[0]}</span>
                {isEditingName ? (
                  <input 
                    autoFocus
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    onBlur={handleUpdateContact}
                    onKeyDown={e => e.key === 'Enter' && handleUpdateContact()}
                    className="text-lg font-bold text-white bg-gray-800 border border-primary px-2 rounded outline-none"
                  />
                ) : (
                  <h2 
                    className="text-lg font-bold text-white hover:text-primary cursor-pointer transition-colors"
                    onClick={() => { setTempName(deal.contact?.name || ''); setIsEditingName(true); }}
                    title="Clique para editar"
                  >
                    {deal.contact?.name || 'Lead Desconhecido'}
                  </h2>
                )}
              </div>
              {deal.contact?.phone ? (
                <a href={`tel:${deal.contact.phone}`} className="text-sm text-gray-400 hover:text-[#f37021] transition-colors">{deal.contact.phone}</a>
              ) : (
                <p className="text-sm text-gray-400">Sem telefone</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400">Valor da Oportunidade</span>
              <div className="flex items-center gap-2 bg-[#1c1d22] px-3 py-1.5 rounded-lg border border-gray-800 min-w-[120px] justify-end">
                {isEditingValue ? (
                  <input 
                    autoFocus
                    value={tempValue}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      val = (parseInt(val) / 100).toFixed(2);
                      if (val === 'NaN') val = '0.00';
                      setTempValue(val.replace('.', ','));
                    }}
                    onBlur={handleUpdateValue}
                    onKeyDown={e => e.key === 'Enter' && handleUpdateValue()}
                    className="w-24 bg-transparent text-emerald-400 font-bold text-lg text-right outline-none"
                  />
                ) : (
                  <span 
                    className="text-emerald-400 font-bold text-lg cursor-pointer hover:text-emerald-300 transition-colors"
                    onClick={() => { setTempValue((deal.value || 0).toFixed(2).replace('.', ',')); setIsEditingValue(true); }}
                  >
                    {formatCurrency(deal.value)}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Column - Details */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-gray-800/60 custom-scrollbar">
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#f37021] flex items-center gap-2">
                <ExternalLink size={16} /> Descrição
              </h3>
              {!isEditingNotes && (
                <button 
                  onClick={() => { setTempNotes(deal.notes || ''); setIsEditingNotes(true); }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  ✏️ Editar
                </button>
              )}
            </div>
            
            <div className="bg-[#25262c] rounded-lg border border-gray-800 mb-8 overflow-hidden flex flex-col">
              {isEditingNotes ? (
                <div className="flex flex-col h-full">
                  <textarea 
                    value={tempNotes}
                    onChange={e => setTempNotes(e.target.value)}
                    className="w-full bg-transparent p-4 min-h-[150px] text-sm text-white resize-y outline-none"
                    placeholder="Digite as anotações sobre o lead..."
                  />
                  <div className="bg-gray-800 p-2 flex justify-end gap-2">
                    <button onClick={() => setIsEditingNotes(false)} className="px-3 py-1 text-xs text-gray-400 hover:text-white">Cancelar</button>
                    <button onClick={handleUpdateNotes} className="px-3 py-1 text-xs bg-[#f37021] text-white font-bold rounded hover:bg-[#f37021]/80">Salvar</button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-sm text-gray-300 whitespace-pre-wrap">
                  {deal.notes || "Nenhum histórico capturado."}
                </div>
              )}
            </div>

            <h3 className="text-sm font-bold text-[#f37021] flex items-center gap-2 mb-4">
              <UserIcon size={16} /> Informações do Contato
            </h3>
            
            <div className="bg-[#25262c] rounded-lg p-4 border border-gray-800 text-sm text-gray-300 mb-8">
              <div className="mb-2 text-xs text-gray-500">Tags Atribuídas</div>
              <div className="flex flex-wrap gap-2">
                {deal.contact?.tags?.length ? (
                  deal.contact.tags.map((tag: string) => (
                    <span key={tag} className="bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded text-xs font-bold uppercase">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-xs">Nenhuma tag atribuída</span>
                )}
              </div>
            </div>

            <h3 className="text-sm font-bold text-[#f37021] flex items-center gap-2 mb-4">
              <RefreshCw size={16} /> Timeline do Card
            </h3>
            
            <div className="relative pl-6 border-l border-gray-800 space-y-6">
              <div className="relative">
                <div className="absolute -left-[29px] top-1 w-3 h-3 bg-blue-500 rounded-full border-[3px] border-[#1c1d22]"></div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-300"><span className="text-white font-bold">Card criado</span> na etapa <span className="font-mono text-gray-400 text-xs bg-gray-800 px-1 rounded">{deal.status.toUpperCase()}</span></div>
                  <div className="text-xs text-gray-500">{format(new Date(deal.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[8px] text-white">IA</div>
                  Sistema (Automático)
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Actions */}
          <div className="w-full md:w-[320px] bg-[#25262c]/50 p-6 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Etapa</label>
                <select 
                  className="w-full bg-[#1c1d22] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  value={deal.status}
                  onChange={(e) => onUpdate(deal.id, { status: e.target.value })}
                >
                  <option value="seed">LEADS SEED</option>
                  <option value="new">Novo Contato</option>
                  <option value="qualified">Em Qualificação</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="proposal">Proposta</option>
                  <option value="negotiation">Negociação</option>
                  <option value="won">Fechado/Ganho</option>
                  <option value="lost">Fechado/Perdido</option>
                  <option value="disqualified">Duplicados/Desqualificados</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Responsável</label>
                <select 
                  className="w-full bg-[#1c1d22] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  value={deal.assignedTo?.id || (typeof deal.assignedTo === 'string' ? deal.assignedTo : "")}
                  onChange={(e) => onUpdate(deal.id, { assignedTo: e.target.value || null })}
                >
                  <option value="">Nenhum (Na fila)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-px bg-gray-800 w-full"></div>

            <div className="flex flex-col gap-2">
              <button onClick={() => loadChat('send')} className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-semibold text-[#f37021] border border-[#f37021]/30 hover:bg-[#f37021]/10 transition-colors">
                <MessageSquare size={16} /> Enviar Mensagem
              </button>
              
              <button onClick={() => loadChat('view')} className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-semibold text-gray-300 border border-gray-700 hover:bg-gray-800 transition-colors">
                <ExternalLink size={16} /> Ver Conversa
              </button>
              
              <button disabled className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-semibold text-gray-500 border border-gray-800 bg-gray-900/30 cursor-not-allowed">
                <CheckSquare size={16} /> Criar Tarefa (Em breve)
              </button>
              
              <button disabled className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-semibold text-gray-500 border border-gray-800 bg-gray-900/30 cursor-not-allowed">
                <Calendar size={16} /> Criar Evento (Em breve)
              </button>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-4 text-center">Criado em: {format(new Date(deal.createdAt), "dd/MM/yy HH:mm")}</p>
              
              <button className="flex items-center justify-center gap-2 w-full p-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/30">
                <Trash2 size={14} /> Excluir Card
              </button>
            </div>

          </div>

        </div>

        {/* INNER CHAT MODAL / DRAWER */}
        {chatMode !== 'none' && (
          <div className="absolute inset-0 z-50 bg-[#1c1d22] rounded-xl flex flex-col animate-in slide-in-from-bottom-10 duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#25262c] rounded-t-xl shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {chatMode === 'send' ? <MessageSquare size={20} className="text-[#f37021]" /> : <ExternalLink size={20} className="text-gray-400" />}
                  {chatMode === 'send' ? 'Enviar Mensagem' : 'Espiar Conversa'}
                </h2>
                <span className="text-sm text-gray-400">| {deal.contact?.name}</span>
              </div>
              <button onClick={() => setChatMode('none')} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {isLoadingChat ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">Carregando conversa...</div>
            ) : (!chatData || !chatData.messages || chatData.messages.length === 0) && chatMode === 'view' ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-2">
                <MessageSquare size={40} className="opacity-50" />
                Nenhum histórico prévio. Inicie o contato abaixo.
              </div>
            ) : (
              <div className="flex-1 flex overflow-hidden">
                
                {/* View Mode (or Right Panel of Send Mode) */}
                <div className="flex-1 flex flex-col border-r border-gray-800 bg-[#0B1224] relative overflow-hidden">
                  
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 relative z-10 custom-scrollbar">
                    {chatData.messages?.map((msg: any, i: number) => {
                      const isMe = msg.direction === 'OUTBOUND';
                      return (
                        <div key={i} className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                          <div className={`p-3 text-sm border shadow-sm relative ${
                            msg.isInternal
                              ? 'bg-amber-500/10 text-amber-100 rounded-2xl rounded-tr-sm border-amber-500/30'
                              : isMe 
                                ? 'bg-primary/20 text-blue-100 rounded-2xl rounded-tr-sm border-primary/30 shadow-[0_0_15px_rgba(0,85,255,0.1)]' 
                                : 'bg-gray-800/80 text-white rounded-2xl rounded-tl-sm border-gray-700/50'
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-[0.65rem] text-gray-500 mx-1">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Left Panel (Composer) for Send Mode */}
                {chatMode === 'send' && (
                  <div className="w-[380px] bg-[#25262c] flex flex-col border-l border-gray-800 shrink-0">
                    <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                      <div className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">Novo Envio</div>
                      <div className="text-sm text-gray-300">Enviando como: <span className="font-bold text-white">Equipe</span></div>
                    </div>
                    <div className="p-4 flex flex-col gap-4 flex-1">
                      
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setIsInternal(false)}
                          className={`text-xs uppercase tracking-wider font-bold pb-1 transition-all ${!isInternal ? 'text-[#f37021] border-b-2 border-[#f37021]' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          Externa (WhatsApp)
                        </button>
                        <button 
                          onClick={() => setIsInternal(true)}
                          className={`text-xs uppercase tracking-wider font-bold pb-1 transition-all ${isInternal ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          Nota Interna
                        </button>
                      </div>

                      <textarea 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={isInternal ? "Anotação privada..." : "Sua mensagem..."}
                        className={`w-full flex-1 min-h-[150px] resize-none rounded-lg p-3 outline-none text-sm border focus:border-primary transition-colors ${
                          isInternal ? 'bg-amber-500/10 border-amber-500/40 text-amber-100 placeholder:text-amber-500/50' : 'bg-[#1c1d22] border-gray-700 text-white placeholder:text-gray-500'
                        }`}
                      />
                      
                      <button onClick={handleSendMsg} className={`w-full py-3 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                        isInternal ? 'bg-amber-500 hover:bg-amber-600 text-amber-950' : 'bg-[#f37021] hover:bg-[#f37021]/90 text-white'
                      }`}>
                        <MessageSquare size={16} /> Enviar Agora
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
