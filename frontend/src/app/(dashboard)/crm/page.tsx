"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Filter, MoreHorizontal, DollarSign } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import api from "@/lib/api";
import toast from "react-hot-toast";

import { DealModal } from "@/components/crm/DealModal";

const COLUMNS = [
  { id: "new", title: "Novos Leads", color: "text-[#f37021]", bgLight: "bg-[#f37021]/10", borderLight: "border-[#f37021]/30", borderColor: "border-t-[#f37021]" },
  { id: "qualified", title: "Qualificados", color: "text-blue-500", bgLight: "bg-blue-500/10", borderLight: "border-blue-500/30", borderColor: "border-t-blue-500" },
  { id: "proposal", title: "Proposta Enviada", color: "text-purple-500", bgLight: "bg-purple-500/10", borderLight: "border-purple-500/30", borderColor: "border-t-purple-500" },
  { id: "won", title: "Ganhos", color: "text-emerald-500", bgLight: "bg-emerald-500/10", borderLight: "border-emerald-500/30", borderColor: "border-t-emerald-500" }
];

export default function CrmPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);

  // Buscar Deals do Banco de Dados
  const fetchDeals = async () => {
    try {
      const { data } = await api.get('/deals');
      setDeals(data);
    } catch (error) {
      console.error("Erro ao buscar deals:", error);
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
      // Otimista
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

  if (loading) {
    return <div className="p-8 text-gray-500">Carregando CRM...</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  return (
    <div className="flex flex-col h-full w-full gap-6">
      <DealModal 
        deal={selectedDeal} 
        isOpen={!!selectedDeal} 
        onClose={() => setSelectedDeal(null)} 
        onUpdate={handleUpdateDeal}
      />

      {/* CRM Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide">Funil Principal <span className="text-gray-500 font-normal text-sm">(Padrão)</span></h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar no quadro..." 
              className="bg-[#1c1d22] border border-gray-700 rounded-full pl-9 pr-4 py-2 text-sm text-text-primary outline-none focus:border-[#f37021] w-full md:w-64"
            />
          </div>
          <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold px-4 py-2 rounded-full border border-gray-700 transition-all flex items-center gap-2">
            <Filter size={16} /> Filtros
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {COLUMNS.map(col => {
            const columnDeals = deals.filter(d => d.status === col.id);
            const totalValue = columnDeals.reduce((acc, curr) => acc + Number(curr.value || 0), 0);

            return (
              <div key={col.id} className="w-[320px] flex-shrink-0 flex flex-col gap-3">
                
                {/* Column Header */}
                <div className={`p-3 rounded-lg border border-gray-800 bg-[#25262c] flex flex-col justify-center border-t-2 ${col.borderColor}`}>
                  <div className="flex justify-between items-center">
                    <h3 className={`text-sm font-bold ${col.color}`}>{col.title}</h3>
                    <button className="text-gray-500 hover:text-white"><MoreHorizontal size={16}/></button>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 font-semibold">
                    <span>{columnDeals.length}</span>
                    <span>•</span>
                    <span>{formatCurrency(totalValue)}</span>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex flex-col gap-3 h-full overflow-y-auto rounded-xl p-1 transition-colors ${snapshot.isDraggingOver ? 'bg-gray-800/30 border border-dashed border-gray-700' : ''}`}
                    >
                      {columnDeals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                              onClick={() => setSelectedDeal(deal)}
                              className={`bg-[#25262c] border rounded-lg p-4 cursor-pointer hover:border-gray-500 transition-all group ${
                                snapshot.isDragging ? 'border-primary shadow-lg shadow-black/50 opacity-90' : 'border-gray-800'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  {deal.id.split('-')[0].toUpperCase()}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center font-bold text-sm shrink-0 ${col.color} ${col.bgLight}`}>
                                  {deal.contact?.name ? deal.contact.name.substring(0, 2).toUpperCase() : '??'}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-blue-400 truncate hover:underline">{deal.contact?.name || 'Lead Desconhecido'}</h4>
                                  <p className="text-xs text-gray-500 truncate">{deal.contact?.phone || ''}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-4">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Lead</span>
                              </div>

                              <div className="text-xs text-gray-300 mb-4 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                                {deal.notes || "Sem descrição"}
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-gray-800 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-white text-[10px]">
                                    {deal.assignee?.name ? deal.assignee.name.charAt(0) : '?'}
                                  </div>
                                  <span className="truncate max-w-[100px]">{deal.assignee?.name || 'Nenhum'}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      
                      {provided.placeholder}

                      {columnDeals.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex-1 border-2 border-dashed border-gray-800/50 rounded-xl flex items-center justify-center text-xs text-gray-600 p-6 text-center">
                          Arraste cards para cá
                        </div>
                      )}
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