"use client";

import { Search, Filter, Download, MoreHorizontal, User, Mail, Phone, Tag } from "lucide-react";

export default function ContactsPage() {
  const contacts = [
    { id: 1, name: "Maria Silva", phone: "+55 11 99999-1111", email: "maria@email.com", tags: ["B2B", "Quente"], source: "WhatsApp", lastActive: "10 min atrás" },
    { id: 2, name: "João Carlos", phone: "+55 21 98888-2222", email: "joao@empresa.com", tags: ["Frio"], source: "Instagram", lastActive: "Ontem" },
    { id: 3, name: "Tech Solutions Corp", phone: "+55 41 97777-3333", email: "contato@techsol.com", tags: ["Enterprise", "Quente"], source: "Site", lastActive: "2 horas atrás" },
    { id: 4, name: "Ana Beatriz", phone: "+55 31 96666-4444", email: "ana.b@gmail.com", tags: ["Morno"], source: "WhatsApp", lastActive: "Hoje, 09:15" },
    { id: 5, name: "Roberto Alves", phone: "+55 51 95555-5555", email: "roberto@vendas.com", tags: ["B2B"], source: "Indicação", lastActive: "Há 3 dias" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide">Base de Leads</h1>
          <p className="text-sm text-text-secondary mt-1">Gerencie todos os contatos captados pelo sistema.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por nome, telefone..." 
              className="bg-panel border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary outline-none focus:border-accent/50 w-full md:w-72"
            />
          </div>
          <button className="flex items-center gap-2 p-2 px-4 border border-gray-800 rounded-lg text-gray-400 font-semibold text-sm hover:text-white hover:bg-gray-800/50 transition-colors">
            <Filter size={16} /> Filtros
          </button>
          <button className="flex items-center gap-2 p-2 px-4 bg-gray-800 text-white font-semibold text-sm rounded-lg hover:bg-gray-700 transition-colors">
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabela de Contatos */}
      <div className="bg-panel/40 border border-gray-800/60 rounded-2xl flex flex-col flex-1 overflow-hidden backdrop-blur-md">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-800/80 text-[0.7rem] uppercase tracking-widest text-gray-500 font-bold">
                <th className="p-4 font-bold rounded-tl-2xl">Contato</th>
                <th className="p-4 font-bold">Telefone / E-mail</th>
                <th className="p-4 font-bold">Origem</th>
                <th className="p-4 font-bold">Tags</th>
                <th className="p-4 font-bold">Última Atividade</th>
                <th className="p-4 font-bold text-center rounded-tr-2xl">Ação</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, index) => (
                <tr key={contact.id} className={`group hover:bg-gray-800/30 transition-colors ${index !== contacts.length -1 ? 'border-b border-gray-800/40' : ''}`}>
                  
                  {/* Nome e Avatar */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold shrink-0">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="min-w-[150px]">
                        <h4 className="text-sm font-bold text-white group-hover:text-accent transition-colors">{contact.name}</h4>
                        <span className="text-[0.65rem] text-gray-500">ID: #{1000 + contact.id}</span>
                      </div>
                    </div>
                  </td>

                  {/* Contato Info */}
                  <td className="p-4">
                    <div className="flex flex-col gap-1 min-w-[150px]">
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <Phone size={12} className="text-accent" /> {contact.phone}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Mail size={12} className="text-gray-500" /> {contact.email}
                      </div>
                    </div>
                  </td>

                  {/* Origem */}
                  <td className="p-4">
                    <span className="bg-background border border-gray-800 text-xs text-gray-400 px-2 py-1 rounded-md">
                      {contact.source}
                    </span>
                  </td>

                  {/* Tags */}
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {contact.tags.map(tag => (
                        <span key={tag} className={`text-[0.65rem] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                          ${tag === 'Quente' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                            tag === 'Frio' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                            'bg-gray-800 text-gray-300 border border-gray-700'}
                        `}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Tempo */}
                  <td className="p-4">
                    <span className="text-xs text-text-secondary">{contact.lastActive}</span>
                  </td>

                  {/* Ação */}
                  <td className="p-4 text-center">
                    <button className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="p-4 border-t border-gray-800/60 bg-panel/30 flex items-center justify-between text-xs text-gray-500 font-semibold mt-auto">
          <span>Mostrando 1 a 5 de 148 leads</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-background border border-gray-800 rounded hover:bg-gray-800 text-gray-400 disabled:opacity-50" disabled>Anterior</button>
            <button className="px-3 py-1 bg-primary text-white rounded shadow-[0_0_10px_rgba(0,85,255,0.3)]">1</button>
            <button className="px-3 py-1 bg-background border border-gray-800 rounded hover:bg-gray-800 text-gray-400">2</button>
            <button className="px-3 py-1 bg-background border border-gray-800 rounded hover:bg-gray-800 text-gray-400">3</button>
            <button className="px-3 py-1 bg-background border border-gray-800 rounded hover:bg-gray-800 text-gray-400">Próxima</button>
          </div>
        </div>
      </div>

    </div>
  );
}