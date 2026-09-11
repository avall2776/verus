"use client";

import { useEffect, useState } from "react";
import { Search, Filter, MoreHorizontal, MessageCircle, Copy, FileText, Maximize2, Minimize2, Activity, Users, Building, LayoutDashboard, Plus, Settings, DollarSign, Target, ChevronDown, ChevronUp, Calendar, CheckSquare, ArrowRight, Clock } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import api from "@/lib/api";
import toast from "react-hot-toast";

import { DealModal } from "@/components/crm/DealModal";

const DEFAULT_COLUMNS = [
  { id: "seed", title: "LEADS SEED", color: "text-gray-400", bgLight: "bg-gray-500/10", borderLight: "border-gray-500/30", borderColor: "border-t-gray-500" },
  { id: "new", title: "Novo Contato", color: "text-blue-500", bgLight: "bg-blue-500/10", borderLight: "border-blue-500/30", borderColor: "border-t-blue-500" },
  { id: "qualified", title: "Em Qualificação", color: "text-purple-500", bgLight: "bg-purple-500/10", borderLight: "border-purple-500/30", borderColor: "border-t-purple-500" },
  { id: "follow-up", title: "Follow-up", color: "text-yellow-500", bgLight: "bg-yellow-500/10", borderLight: "border-yellow-500/30", borderColor: "border-t-yellow-500" },
  { id: "proposal", title: "Proposta", color: "text-emerald-500", bgLight: "bg-emerald-500/10", borderLight: "border-emerald-500/30", borderColor: "border-t-emerald-500" },
  { id: "negotiation", title: "Negociação", color: "text-orange-500", bgLight: "bg-orange-500/10", borderLight: "border-orange-500/30", borderColor: "border-t-orange-500" },
  { id: "won", title: "Fechado/Ganho", color: "text-green-500", bgLight: "bg-green-500/10", borderLight: "border-green-500/30", borderColor: "border-t-green-500" },
  { id: "lost", title: "Fechado/Perdido", color: "text-rose-600", bgLight: "bg-rose-600/10", borderLight: "border-rose-600/30", borderColor: "border-t-rose-600" },
  { id: "disqualified", title: "Duplicados/Desqualificados", color: "text-gray-600", bgLight: "bg-gray-600/10", borderLight: "border-gray-600/30", borderColor: "border-t-gray-600" }
];

export default function CrmPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [collapsedCols, setCollapsedCols] = useState<string[]>(["disqualified"]);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [neutralMode, setNeutralMode] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const [showStageModal, setShowStageModal] = useState(false);
  const [showManageStagesModal, setShowManageStagesModal] = useState(false);

  useEffect(() => {
    const savedCols = localStorage.getItem('crm_columns');
    if (savedCols) {
      setColumns(JSON.parse(savedCols));
    } else {
      setColumns(DEFAULT_COLUMNS);
      localStorage.setItem('crm_columns', JSON.stringify(DEFAULT_COLUMNS));
    }
  }, []);

  const fetchDeals = async () => {
    try {
      const { data } = await api.get('/deals');
      setDeals(data);
    } catch (error) {
      toast.error("Erro ao carregar Pipeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleUpdateDeal = async (dealId: string, data: any) => {
    try {
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, ...data } : d));
      if (selectedDeal && selectedDeal.id === dealId) {
        setSelectedDeal({ ...selectedDeal, ...data });
      }
      await api.patch(`/deals/${dealId}`, data);
      toast.success("Atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar");
      fetchDeals();
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    handleUpdateDeal(draggableId, { status: newStatus });
  };

  const toggleColumn = (colId: string) => {
    setCollapsedCols(prev => 
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const toggleCardAccordion = (e: React.MouseEvent, dealId: string) => {
    e.stopPropagation();
    setExpandedCards(prev => 
      prev.includes(dealId) ? prev.filter(id => id !== dealId) : [...prev, dealId]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  if (loading) return <div className="p-8 text-gray-500">Carregando CRM...</div>;

  return (
    <div className="flex flex-col h-full w-full gap-4 relative">
      <DealModal 
        deal={selectedDeal} 
        isOpen={!!selectedDeal} 
        onClose={() => setSelectedDeal(null)} 
        onUpdate={handleUpdateDeal}
      />

      {/* Toolbar Superior */}
      <div className="bg-[#1c1d22] border border-gray-800 rounded-xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-3 pr-4 border-r border-gray-800">
            <LayoutDashboard className="text-primary" size={24} />
            <select className="bg-transparent text-white font-bold text-lg outline-none cursor-pointer appearance-none">
              <option value="main">Funil Principal (Padrão)</option>
              <option value="sales">Vendas B2B</option>
            </select>
          </div>
          
          <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800 overflow-x-auto">
            {[
              { id: 'all', label: 'Tudo', icon: Activity },
              { id: 'negotiation', label: 'Minhas', icon: FileText },
              { id: 'contact', label: 'Contatos', icon: Users },
              { id: 'company', label: 'Empresas', icon: Building }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar Negócio..." 
              className="bg-[#0B1224] border border-gray-800 rounded-full pl-9 pr-4 py-1.5 text-sm text-text-primary outline-none focus:border-primary w-full transition-colors"
            />
          </div>
          
          <button 
            onClick={() => setNeutralMode(!neutralMode)}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${neutralMode ? 'bg-gray-100 text-black border-gray-100' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}`}
          >
            Neutro
          </button>
          
          <div className="h-6 w-px bg-gray-800"></div>

          <button onClick={() => setShowStageModal(true)} className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1">
            <Plus size={14}/> Nova Etapa
          </button>
          
          <button onClick={() => setShowManageStagesModal(true)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1">
            <Settings size={14}/> Gerenciar Etapas
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start">
          {columns.map(col => {
            const isCollapsed = collapsedCols.includes(col.id);
            const columnDeals = deals.filter(d => d.status === col.id);
            const totalValue = columnDeals.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
            
            const colColorClass = neutralMode ? 'text-gray-300' : col.color;
            const borderTopClass = neutralMode ? 'border-t-gray-600' : col.borderColor;

            if (isCollapsed) {
              return (
                <div key={col.id} className={`w-[48px] h-full flex-shrink-0 flex flex-col bg-[#1c1d22] border border-gray-800 border-t-2 ${borderTopClass} rounded-xl items-center py-4 cursor-pointer hover:bg-gray-800/50 transition-colors group`} onClick={() => toggleColumn(col.id)}>
                   <button className="text-gray-500 group-hover:text-white mb-6">
                     <Maximize2 size={16} />
                   </button>
                   <div className="flex-1 relative w-full">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-top-left -rotate-90 whitespace-nowrap font-bold text-sm text-gray-500 tracking-widest uppercase">
                       {col.title} ({columnDeals.length})
                     </div>
                   </div>
                </div>
              )
            }

            return (
              <div key={col.id} className="w-[320px] flex-shrink-0 flex flex-col h-full gap-3">
                {/* Column Header */}
                <div className={`p-4 rounded-xl border border-gray-800 bg-[#1c1d22] border-t-2 ${borderTopClass} flex flex-col shadow-sm shrink-0`}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`text-sm font-black uppercase tracking-wider ${colColorClass}`}>
                      {col.title}
                    </h3>
                    <div className="flex gap-1">
                      <button onClick={() => toggleColumn(col.id)} className="text-gray-500 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors">
                        <Minimize2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 font-semibold bg-[#0B1224] px-3 py-1.5 rounded-lg border border-gray-800/50">
                    <span className="bg-gray-800 px-2 py-0.5 rounded-full text-white">{columnDeals.length} cards</span>
                    <span className="text-gray-300">{formatCurrency(totalValue)}</span>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 flex flex-col gap-3 overflow-y-auto rounded-xl p-1 transition-colors custom-scrollbar min-h-[150px] ${snapshot.isDraggingOver ? 'bg-gray-800/20 ring-2 ring-dashed ring-gray-700' : ''}`}
                    >
                      {columnDeals.map((deal, index) => {
                        const contactTags = deal.contact?.tags || [];
                        const primaryTag = contactTags.length > 0 ? contactTags[0] : null;
                        const isExpanded = expandedCards.includes(deal.id);

                        return (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{ ...provided.draggableProps.style }}
                                onClick={() => setSelectedDeal(deal)}
                                className={`bg-[#161b22] border rounded-xl p-4.5 cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col gap-3 ${
                                  snapshot.isDragging ? `shadow-2xl shadow-black/80 rotate-3 scale-105 opacity-90 ring-1 ${col.borderLight} bg-gray-800` : 'border-gray-800 hover:border-gray-600 hover:-translate-y-0.5 shadow-sm'
                                }`}
                              >
                                {/* Topo: ID + Tag */}
                                <div className="flex justify-between items-start">
                                  <span className="text-[11px] text-gray-400 font-bold bg-gray-800/80 px-2 py-0.5 rounded-md font-mono">
                                    #{deal.id.split('-')[0].toUpperCase()}
                                  </span>
                                  {primaryTag && (
                                    <span className="text-[10px] bg-primary/20 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-md uppercase">
                                      {primaryTag}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Linha 1: Nome + WA + Telefone */}
                                <div>
                                  <h4 className="text-base font-semibold text-white leading-tight mb-1">{deal.contact?.name || 'Sem Contato'}</h4>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                    <MessageCircle size={13} className="text-[#25D366]" />
                                    {deal.contact?.phone || 'Sem número'}
                                  </div>
                                </div>

                                {/* Linha 2: Entidade */}
                                <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Lead
                                </div>

                                {/* Accordion / Box de Metadados */}
                                <div className="bg-[#0d1117] rounded-lg p-3 flex flex-col gap-2 border border-gray-800/80 mt-1">
                                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase">
                                    <span>Origem: <span className="text-gray-400 font-bold ml-1">[{deal.contact?.source || 'ORGÂNICO'}]</span></span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase">
                                    <span>Formulário: <span className="text-gray-400 font-bold ml-1">VERSÁTIL</span></span>
                                  </div>
                                  
                                  <p className="text-xs text-gray-400 leading-relaxed mt-1 line-clamp-2">
                                    Lead recebido pelo formulário nativo da Meta Ads solicitando contato comercial urgente.
                                  </p>

                                  {/* expanded content */}
                                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 mt-2 border-t border-gray-800 pt-3' : 'max-h-0 opacity-0'}`}>
                                    <div className="flex flex-col gap-2">
                                      <div className="text-xs text-gray-300"><span className="text-gray-500 font-bold">Email:</span> {deal.contact?.name.toLowerCase().replace(' ', '')}@email.com</div>
                                      <div className="text-xs text-gray-300"><span className="text-gray-500 font-bold">Equipamento:</span> Elevador Monta Carga</div>
                                      <div className="text-xs text-gray-300"><span className="text-gray-500 font-bold">Cidade:</span> São Paulo - SP</div>
                                    </div>
                                    <button 
                                      className="mt-3 w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-1.5 rounded flex items-center justify-center gap-1.5 font-semibold transition-colors"
                                      onClick={(e) => { e.stopPropagation(); toast.success("Descrição copiada!"); }}
                                    >
                                      <Copy size={12} /> Copiar descrição
                                    </button>
                                  </div>
                                  
                                  <button 
                                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-1 w-fit"
                                    onClick={(e) => toggleCardAccordion(e, deal.id)}
                                  >
                                    {isExpanded ? (
                                      <><ChevronUp size={14} /> Menos</>
                                    ) : (
                                      <><ChevronDown size={14} /> Mais</>
                                    )}
                                  </button>
                                </div>
                                
                                {/* Barra de Ícones de Ação */}
                                <div className="flex items-center gap-2 mt-1">
                                  <button onClick={(e) => { e.stopPropagation(); /* go to chat */ }} className="p-1.5 bg-[#161b22] border border-gray-800 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title="Enviar mensagem">
                                    <MessageCircle size={14} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 bg-[#161b22] border border-gray-800 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title="Criar evento">
                                    <Calendar size={14} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 bg-[#161b22] border border-gray-800 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title="Criar tarefa">
                                    <CheckSquare size={14} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 bg-[#161b22] border border-gray-800 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ml-auto" title="Ir para o atendimento">
                                    <ArrowRight size={14} />
                                  </button>
                                </div>

                                {/* Auditoria de tempo */}
                                <div className="text-[10px] text-gray-500 font-medium">
                                  Criado há cerca de 2 horas
                                </div>

                                {/* Linha 4: Valor */}
                                <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 w-fit px-2 py-1 rounded-md border border-emerald-500/20 my-1">
                                  <DollarSign size={14} />
                                  <span className="text-sm font-black">{formatCurrency(Number(deal.value))}</span>
                                </div>

                                {/* Rodapé: Avatar */}
                                <div className="flex items-center gap-2 mt-1 pt-3 border-t border-gray-800/50">
                                  {deal.assignee ? (
                                    <>
                                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-white shadow-sm ring-2 ring-[#161b22]" title={deal.assignee.name}>
                                        {deal.assignee.name.charAt(0)}
                                      </div>
                                      <span className="text-xs text-gray-400 font-semibold">{deal.assignee.name.split(' ')[0]}</span>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500" title="Não atribuído">
                                        ?
                                      </div>
                                      <span className="text-xs text-gray-600 font-semibold italic">Sem responsável</span>
                                    </>
                                  )}
                                </div>

                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      
                    </div>
                  )}
                </Droppable>

                {/* Add Card Button (Footer da coluna) */}
                <button className="mt-auto shrink-0 w-full bg-[#161b22] border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white rounded-xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <Plus size={16} /> Adicionar novo cartão
                </button>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* MODAL NOVA ETAPA (Mock) */}
      {showStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1c1d22] border border-gray-800 w-full max-w-sm rounded-xl shadow-2xl flex flex-col p-6 animate-in zoom-in-95">
            <h2 className="text-lg font-bold text-white mb-4">Nova Etapa</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Nome da Etapa</label>
                <input type="text" className="w-full bg-[#0B1224] border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-primary" placeholder="Ex: Demonstração" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {['bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500'].map(color => (
                    <button key={color} className={`w-8 h-8 rounded-full ${color} cursor-pointer hover:scale-110 transition-transform ring-2 ring-transparent focus:ring-white`}></button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowStageModal(false)} className="text-gray-400 text-sm font-bold">Cancelar</button>
              <button onClick={() => { setShowStageModal(false); toast.success("Etapa Criada (Simulado)"); }} className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-lg">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GERENCIAR ETAPAS (Mock) */}
      {showManageStagesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1c1d22] border border-gray-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col p-6 animate-in zoom-in-95 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Settings size={18} className="text-primary" /> Gerenciar Etapas do Funil
            </h2>
            <p className="text-xs text-gray-400 mb-4">Arraste para reordenar, ou altere as propriedades abaixo.</p>
            
            <div className="flex flex-col gap-2">
              {columns.map((col, idx) => (
                <div key={col.id} className="bg-[#25262c] border border-gray-800 rounded-lg p-3 flex items-center justify-between group cursor-move hover:border-gray-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${col.color.replace('text-', 'bg-')}`}></div>
                    <span className="text-sm font-bold text-white">{col.title}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-gray-800 rounded text-gray-400 hover:text-white" title="Alerta de estagnação">
                      <Clock size={14} />
                    </button>
                    {idx === columns.length - 2 && (
                       <button className="p-1.5 bg-green-500/10 rounded text-green-500" title="Marcar como Ganho">
                         <Target size={14} />
                       </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowManageStagesModal(false)} className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold px-4 py-2 rounded-lg">Concluído</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}