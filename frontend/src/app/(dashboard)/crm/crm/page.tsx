"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { LayoutDashboard, Phone, Lightbulb, FileText, ChevronRight } from "lucide-react";

export default function CRMPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const res = await api.get("/deals");
        setDeals(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-background text-text-primary p-8 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-panel rounded-xl border border-gray-800 shadow-lg">
          <LayoutDashboard className="text-primary w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Pipeline Comercial</h1>
          <p className="text-text-secondary text-sm">Oportunidades geradas automaticamente pela IA.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {deals.map(deal => (
            <div key={deal.id} className="bg-panel border border-gray-800 rounded-2xl p-6 shadow-xl hover:border-gray-700 transition-colors group relative overflow-hidden">
              
              {/* Canto superior brilhante */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gradient opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-lg font-bold truncate pr-4">{deal.contact?.name || deal.contact?.phone}</h3>
                  <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                    <Phone size={14} />
                    <span>{deal.contact?.phone}</span>
                  </div>
                </div>
                <div className="bg-background border border-gray-800 px-3 py-1 rounded-full text-xs font-medium text-accent">
                  {format(new Date(deal.updatedAt), 'dd/MM/yyyy')}
                </div>
              </div>

              <div className="space-y-4 mt-6 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1 text-accent text-sm font-semibold">
                    <Lightbulb size={16} />
                    Produto de Interesse
                  </div>
                  <p className="text-sm bg-background border border-gray-800 p-3 rounded-lg shadow-inner">
                    {deal.title}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1 text-primary text-sm font-semibold">
                    <FileText size={16} />
                    Resumo do Atendimento
                  </div>
                  <p className="text-sm bg-background border border-gray-800 p-3 rounded-lg shadow-inner text-text-secondary leading-relaxed h-24 overflow-y-auto custom-scrollbar">
                    {deal.notes || "Nenhum resumo fornecido."}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end relative z-10">
                <button className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-white transition-colors">
                  Ver conversa <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}

          {deals.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-gray-800 rounded-2xl bg-panel">
              <p className="text-text-secondary">Nenhuma oportunidade foi gerada pela IA ainda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
