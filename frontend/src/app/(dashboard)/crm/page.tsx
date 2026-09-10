"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Filter, MoreHorizontal, DollarSign } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import api from "@/lib/api";
import toast from "react-hot-toast";

const COLUMNS = [
  { id: "new", title: "Novos Leads", color: "text-blue-400", bgLight: "bg-blue-400/10", borderLight: "border-blue-400/20" },
  { id: "qualified", title: "Qualificados", color: "text-accent", bgLight: "bg-accent/10", borderLight: "border-accent/20" },
  { id: "proposal", title: "Proposta Enviada", color: "text-yellow-400", bgLight: "bg-yellow-400/10", borderLight: "border-yellow-400/20" },
  { id: "won", title: "Ganhos", color: "text-emerald-500", bgLight: "bg-emerald-500/10", borderLight: "border-emerald-500/20" }
];

export default function CrmPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar Deals do Banco de Dados
  useEffect(() => {
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
    fetchDeals();
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se soltou fora de uma coluna válida, ignora
    if (!destination) return;

    // Se soltou no mesmo lugar, ignora
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatus = destination.droppableId;
    
    // Atualiza otimista no Front-end
    setDeals(prev => prev.map(deal => 
      deal.id === draggableId ? { ...deal, status: newStatus } : deal
    ));

    // Salva no Back-end
    try {
      await api.patch(`/deals/${draggableId}/status`, { status: newStatus });
      toast.success("Fase atualizada!");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao salvar fase.");
      // Se der erro, desfaz a alteração recarregando (fallback)
      const { data } = await api.get('/deals');
      setDeals(data);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Carregando CRM...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full gap-6">
      
      {/* CRM Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide">Pipeline Comercial</h1>
          <p className="text-sm text-text-secondary mt-1">Arraste os cards para atualizar as fases da negociação.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar oportunidade..." 
              className="bg-panel border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary outline-none focus:border-accent/50 w-full md:w-64"
            />
          </div>
          <button className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(0,85,255,0.3)] flex items-center gap-2">
            <Plus size={16} /> Novo Lead
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {COLUMNS.map(col => {
            const columnDeals = deals.filter(d => d.status === col.id);

            return (
              <div key={col.id} className="w-[320px] flex-shrink-0 flex flex-col gap-3">
                
                {/* Column Header */}
                <div className={`p-3 rounded-xl border ${col.borderLight} ${col.bgLight} flex items-center justify-between`}>
                  <h3 className={`text-sm font-bold ${col.color}`}>{col.title}</h3>
                  <span className="text-xs font-bold text-gray-400 bg-gray-900/50 px-2 py-0.5 rounded-full">
                    {columnDeals.length}
                  </span>
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
                              className={`bg-panel border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-gray-600 transition-all group ${
                                snapshot.isDragging ? 'border-primary shadow-[0_0_20px_rgba(0,210,255,0.3)] opacity-90' : 'border-gray-800/60'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                    {deal.contact?.name ? deal.contact.name.charAt(0) : '?'}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate">{deal.contact?.name || 'Lead Desconhecido'}</h4>
                                    <p className="text-[0.65rem] text-accent uppercase tracking-wider truncate">{deal.title}</p>
                                  </div>
                                </div>
                                <button className="text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal size={16} />
                                </button>
                              </div>

                              <div className="text-xs text-gray-400 mb-3 line-clamp-2">
                                {deal.notes || "Nenhum resumo disponível."}
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-gray-800/40">
                                <div className="flex items-center gap-1.5 text-gray-300 text-sm font-semibold">
                                  <DollarSign size={14} className="text-green-400" />
                                  {deal.value || '0'}
                                </div>
                                <div className="flex gap-1 flex-wrap justify-end max-w-[50%]">
                                  {deal.contact?.tags && deal.contact.tags.length > 0 ? (
                                    deal.contact.tags.map((tag: string) => (
                                      <div key={tag} className="text-[0.65rem] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gray-700/50 text-gray-300 border border-gray-600/50 truncate max-w-[80px]" title={tag}>
                                        {tag}
                                      </div>
                                    ))
                                  ) : null}
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