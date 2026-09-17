"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Terminal } from "lucide-react";
import { toast } from "sonner";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function CodeBlock({ inline, className, children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeText = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code
        className="bg-[#070D1B] text-cyan-300 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-800"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="my-3 rounded-xl border border-slate-800 bg-[#070D1B] overflow-hidden shadow-lg">
      {/* Header do Bloco de Código */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#0B1224] border-b border-slate-800 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Terminal size={12} className="text-cyan-400" />
          <span className="uppercase font-semibold text-slate-300">
            {language || "código"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          title="Copiar snippet de código"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copiado!</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      {/* Conteúdo do Código com Rolagem Horizontal Suave */}
      <pre className="p-3.5 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed custom-scrollbar">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`prose-invert max-w-none text-xs leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock as any,
          h1: ({ children }) => (
            <h1 className="text-base md:text-lg font-black text-white mt-4 mb-2 pb-1 border-b border-slate-800 flex items-center gap-1.5">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm md:text-base font-bold text-slate-100 mt-3.5 mb-1.5 flex items-center gap-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs md:text-sm font-bold text-cyan-300 mt-3 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-200">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-white tracking-wide">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-300">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-2.5 pl-4 list-disc marker:text-cyan-400 text-slate-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 my-2.5 pl-4 list-decimal marker:text-purple-400 font-medium text-slate-200">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 pl-3.5 py-1.5 border-l-2 border-cyan-500 bg-cyan-950/20 rounded-r-lg text-slate-300 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#0B1224] border-b border-slate-800 text-white font-bold">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="p-2.5 font-bold text-slate-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-2.5 border-t border-slate-800/60 text-slate-300">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-4 border-slate-800/80" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
