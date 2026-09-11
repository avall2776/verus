"use client";

import { X, MessageSquare, ExternalLink, Calendar, CheckSquare, RefreshCw, Trash2, Tag, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { useRouter } from "next/navigation";

interface DealModalProps {
  deal: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (dealId: string, data: any) => Promise<void>;
}

export function DealModal({ deal, isOpen, onClose, onUpdate }: DealModalProps) {
  const router = useRouter();

  if (!isOpen || !deal) return null;

  const handleGoToChat = () => {
    router.push(`/inbox?contact=${deal.contactId}`);
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
            <div className="w-12 h-12 rounded-full border border-[#f37021] flex items-center justify-center bg-[#f37021]/10 text-[#f37021] font-bold text-lg">
              {deal.contact?.name ? deal.contact.name.substring(0, 2).toUpperCase() : '??'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-500 font-mono bg-emerald-500/10 px-1.5 rounded">ID: {deal.id.split('-')[0]}</span>
                <h2 className="text-lg font-bold text-white">{deal.contact?.name || 'Lead Desconhecido'}</h2>
              </div>
              <p className="text-sm text-gray-400">{deal.contact?.phone || 'Sem telefone'}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400">Valor da Oportunidade</span>
              <div className="flex items-center gap-2 bg-[#1c1d22] px-3 py-1.5 rounded-lg border border-gray-800">
                <span className="text-emerald-400 font-bold text-lg">{formatCurrency(deal.value)}</span>
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
            
            <h3 className="text-sm font-bold text-[#f37021] flex items-center gap-2 mb-4">
              <ExternalLink size={16} /> Descrição
            </h3>
            
            <div className="bg-[#25262c] rounded-lg p-4 border border-gray-800 text-sm text-gray-300 mb-8 whitespace-pre-wrap">
              {deal.notes || "Nenhum histórico capturado."}
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
                  value={deal.assignedTo || ""}
                  onChange={(e) => onUpdate(deal.id, { assignedTo: e.target.value || null })}
                >
                  <option value="">Nenhum (Na fila)</option>
                  <option value="me">Eu (Atendente Atual)</option>
                </select>
              </div>
            </div>

            <div className="h-px bg-gray-800 w-full"></div>

            <div className="flex flex-col gap-2">
              <button onClick={handleGoToChat} className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-semibold text-[#f37021] border border-[#f37021]/30 hover:bg-[#f37021]/10 transition-colors">
                <MessageSquare size={16} /> Enviar Mensagem
              </button>
              
              <button onClick={handleGoToChat} className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-semibold text-gray-300 border border-gray-700 hover:bg-gray-800 transition-colors">
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
      </div>
    </div>
  );
}
