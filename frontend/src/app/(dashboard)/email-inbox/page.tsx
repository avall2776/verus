"use client";

import React, { useState } from "react";
import { 
  Mail, Inbox, Send, Archive, Trash2, Star, 
  Search, RefreshCw, Plus, Paperclip, CheckCircle2, Clock
} from "lucide-react";
import toast from "react-hot-toast";

const INITIAL_EMAILS = [
  {
    id: "em-1",
    sender: "Roberto Alencar",
    company: "Nexus Logística",
    subject: "Re: Proposta Comercial PROP-2026-1042 - Aceite & Assinatura",
    preview: "Olá Ana Paula, analisamos a minuta do contrato e os anexos técnicos e estamos de acordo com os termos...",
    time: "10:45",
    read: false,
    starred: true,
    tag: "Comercial"
  },
  {
    id: "em-2",
    sender: "Fernanda Takahashi",
    company: "Inovare Odontologia",
    subject: "Dúvida sobre integração do Agente de IA com nosso sistema",
    preview: "Bom dia equipe VERSUS, gostaríamos de tirar uma dúvida sobre a API de integração para prontuários eletrônicos...",
    time: "Ontem",
    read: true,
    starred: false,
    tag: "Técnico"
  },
  {
    id: "em-3",
    sender: "Marcelo Dantas",
    company: "Dantas Advocacia",
    subject: "Comprovante de pagamento da parcela de entrada",
    preview: "Prezados, segue em anexo o comprovante da TED referente à implantação do módulo de mensagens...",
    time: "14 Set",
    read: true,
    starred: false,
    tag: "Financeiro"
  }
];

export default function EmailInboxPage() {
  const [emails, setEmails] = useState(INITIAL_EMAILS);
  const [selectedEmail, setSelectedEmail] = useState(INITIAL_EMAILS[0]);
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Inbox Unificado de E-mails
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                IMAP / SMTP Ativo
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Gerencie tratativas comerciais, envie orçamentos e centralize trocas de mensagens por e-mail
            </p>
          </div>
        </div>

        <button
          onClick={() => toast.success("Novo redator de e-mail comercial aberto.")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Escrever Novo E-mail
        </button>
      </div>

      {/* Container de E-mails em 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
        {/* Lista de Mensagens */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar e-mails comerciais..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {emails.map((email) => {
              const isSelected = selectedEmail?.id === email.id;
              return (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-slate-800/60 border-l-2 border-cyan-400"
                      : "hover:bg-slate-800/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-xs text-white">
                      {email.sender}
                    </span>
                    <span className="text-[10px] text-slate-400">{email.time}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-300 line-clamp-1 mb-1">
                    {email.subject}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {email.preview}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visualizador de Mensagem Selecionada */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col overflow-hidden p-6">
          {selectedEmail ? (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">
                      {selectedEmail.subject}
                    </h3>
                    <div className="text-xs text-slate-400">
                      De: <strong className="text-slate-200">{selectedEmail.sender}</strong> ({selectedEmail.company})
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {selectedEmail.time}
                  </span>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed space-y-4">
                  <p>Prezada equipe comercial do VERSUS,</p>
                  <p>{selectedEmail.preview}</p>
                  <p>
                    Gostaríamos de confirmar o agendamento da reunião de alinhamento para o onboarding na próxima quinta-feira.
                  </p>
                  <p>
                    Atenciosamente,<br />
                    <strong>{selectedEmail.sender}</strong><br />
                    {selectedEmail.company}
                  </p>
                </div>
              </div>

              {/* Caixa de Resposta Rápida */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <textarea
                  rows={3}
                  placeholder="Escreva uma resposta rápida por e-mail..."
                  className="w-full p-3 rounded-xl bg-[#070D1B] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none mb-3"
                />
                <div className="flex justify-between items-center">
                  <button className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toast.success("Resposta enviada com sucesso!")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Responder E-mail
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              Selecione um e-mail para visualizar os detalhes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
