"use client";

import { useEffect, useState } from "react";
import { Search, Filter, MoreHorizontal, MessageCircle, Copy, FileText, ChevronRight, Minimize2, Maximize2, Users, Building, Activity, LayoutDashboard } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import api from "@/lib/api";
import toast from "react-hot-toast";

import { DealModal } from "@/components/crm/DealModal";

const COLUMNS = [
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
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [collapsedCols, setCollapsedCols] = useState<string[]>(["disqualified"]); // Desqualificados vem fechado por padrão
  const [neutralMode, setNeutralMode] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  if (loading) return <div className="p-8 text-gray-500">Carregando CRM...</div>;

  return (
    <div className="flex flex-col h-full w-full gap-4">
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
          
          {/* Quick Filters */}
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
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar Negócio..." 
              className="bg-[#0B1224] border border-gray-800 rounded-full pl-9 pr-4 py-2 text-sm text-text-primary outline-none focus:border-primary w-full transition-colors"
            />
          </div>
          
          <button 
            onClick={() => setNeutralMode(!neutralMode)}
            className={`px-3 py-2 rounded-full border text-sm font-bold transition-all whitespace-nowrap ${neutralMode ? 'bg-gray-100 text-black border-gray-100' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}`}
            title="Desativar Cores do Funil"
          >
            Modo Neutro
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start">
          {COLUMNS.map(col => {
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
                
                {/* Header Expandido */}
                <div className={`p-4 rounded-xl border border-gray-800 bg-[#1c1d22] border-t-2 ${borderTopClass} flex flex-col shadow-sm`}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`text-sm font-black uppercase tracking-wider ${colColorClass}`}>
                      {col.title}
                    </h3>
                    <div className="flex gap-1">
                      <button onClick={() => toggleColumn(col.id)} className="text-gray-500 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors" title="Colapsar Coluna">
                        <Minimize2 size={14} />
                      </button>
                      <button className="text-gray-500 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors">
                        <MoreHorizontal size={14}/>
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
                      className={`flex-1 flex flex-col gap-3 overflow-y-auto rounded-xl p-1 transition-colors custom-scrollbar min-h-[150px] ${snapshot.isDraggingOver ? 'bg-gray-800/20 border border-dashed border-gray-700' : ''}`}
                    >
                      {columnDeals.map((deal, index) => {
                        const contactTags = deal.contact?.tags || [];
                        const primaryTag = contactTags.length > 0 ? contactTags[0] : null;

                        return (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{ ...provided.draggableProps.style }}
                                onClick={() => setSelectedDeal(deal)}
                                className={`bg-[#25262c] border border-gray-800 rounded-xl p-4 cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                                  snapshot.isDragging ? 'shadow-2xl shadow-black ring-1 ring-primary z-50 scale-105 opacity-90' : 'hover:border-gray-600 hover:shadow-lg hover:-translate-y-0.5'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400 font-mono bg-gray-800 px-1.5 py-0.5 rounded">
                                      #{deal.id.split('-')[0].toUpperCase()}
                                    </span>
                                    {primaryTag && (
                                      <span className="text-[10px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded">
                                        {primaryTag}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {deal.assignee ? (
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-[#25262c]" title={deal.assignee.name}>
                                      {deal.assignee.name.charAt(0)}
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-gray-500" title="Não atribuído">
                                      ?
                                    </div>
                                  )}
                                </div>
                                
                                <h4 className="text-sm font-bold text-white mb-1 leading-tight group-hover:text-primary transition-colors">{deal.title}</h4>
                                <div className="text-xs text-gray-400 font-medium mb-3">
                                  {deal.contact?.name || 'Sem Contato'} • {deal.contact?.phone || 'Sem número'}
                                </div>
                                
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-800/50">
                                  <span className="text-sm font-black text-white bg-[#1c1d22] px-2 py-1 rounded-md border border-gray-800">
                                    {formatCurrency(Number(deal.value))}
                                  </span>
                                </div>

                                {/* Gaveta Expansível no Hover (Puro CSS) */}
                                <div className="max-h-0 opacity-0 group-hover:max-h-[120px] group-hover:opacity-100 group-hover:mt-4 transition-all duration-300 ease-in-out overflow-hidden border-t border-dashed border-gray-700 flex flex-col gap-2 pt-0 group-hover:pt-3">
                                  <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                    <Activity size={10} />
                                    <span>Criado há 2h por Sistema</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <button 
                                      className="flex-1 bg-gray-800 hover:bg-primary hover:text-white text-gray-300 text-xs py-1.5 rounded-md font-bold transition-colors flex items-center justify-center gap-1"
                                      onClick={(e) => { e.stopPropagation(); setSelectedDeal(deal); }}
                                    >
                                      <FileText size={12} /> Ver Mais
                                    </button>
                                    <button 
                                      className="w-8 h-7 bg-gray-800 hover:bg-[#25D366] hover:text-white text-gray-400 rounded-md flex items-center justify-center transition-colors"
                                      title="WhatsApp"
                                      onClick={(e) => { e.stopPropagation(); /* go to chat */ }}
                                    >
                                      <MessageCircle size={14} />
                                    </button>
                                    <button 
                                      className="w-8 h-7 bg-gray-800 hover:bg-gray-600 text-gray-400 rounded-md flex items-center justify-center transition-colors"
                                      title="Copiar ID"
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        navigator.clipboard.writeText(deal.id); 
                                        toast.success("ID copiado"); 
                                      }}
                                    >
                                      <Copy size={14} />
                                    </button>
                                  </div>
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
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}