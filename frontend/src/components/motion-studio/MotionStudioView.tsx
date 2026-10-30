"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Upload,
  Trash2,
  Radio,
  Map,
  Compass,
  MessageSquare,
  MessagesSquare,
  Users,
  Target,
  Kanban,
  Kanban as LayoutKanban,
  FileText,
  ScrollText,
  Activity,
  Layers,
  Smartphone,
  Monitor,
  Share2,
  Sparkle,
  SlidersHorizontal,
  X,
  ShieldCheck,
  CheckCheck,
  Menu,
  ExternalLink,
  Wand2,
  RefreshCw,
  Search,
  CheckSquare,
  Mail,
  BarChart,
  PieChart,
  TrendingUp,
  Briefcase,
  Calendar,
  FolderArchive,
  Bot,
  MousePointer,
  Film,
  Zap,
  Settings,
  CreditCard,
  Network,
  PackageCheck,
  KeyRound,
  LifeBuoy,
  User,
  Sliders,
  Eye,
  Camera,
  Layers3
} from "lucide-react";

// =========================================================================
// CATÁLOGO OFICIAL VALLOR: NOMENCLATURA E CATEGORIAS 100% IDÊNTICAS AO SIDEBAR
// =========================================================================

export type SystemCategory =
  | "OPERAÇÃO / ATENDIMENTO"
  | "MARKETING & AGÊNCIA"
  | "CHAT DA EQUIPE"
  | "FUNIL COMERCIAL (CRM)"
  | "SISTEMA / ADMINISTRAÇÃO";

export interface MotionScene {
  id: number;
  title: string;
  badge: string;
  startTime: number;
  endTime: number;
  overlayHeadline: string;
  overlaySubline: string;
  teleprompter: string;
  ctaText?: string;
  floatingStat?: { label: string; value: string; color: string };
}

export interface VallorSystemFunction {
  id: string;
  name: string;
  category: SystemCategory;
  route: string;
  badge: string;
  iconName: string;
  whatItDoes: string;
  commercialPitch: string;
  defaultDuration: number;
  highlightColor: string;
  scenes: MotionScene[];
}

export const VALLOR_SYSTEM_CATALOG: VallorSystemFunction[] = [
  // -----------------------------------------------------------------------
  // 1. OPERAÇÃO / ATENDIMENTO
  // -----------------------------------------------------------------------
  {
    id: "mapa_tatico_operacional",
    name: "Mapa Tático Operacional",
    category: "OPERAÇÃO / ATENDIMENTO",
    route: "/dashboard/mapa",
    badge: "Geo-Inteligência",
    iconName: "Compass",
    highlightColor: "#00D2FF",
    whatItDoes: "Cruza a carteira de clientes, leads e negócios com a malha geográfica e inteligência de distribuição territorial.",
    commercialPitch: "Mapeie a densidade da sua carteira por estado e cidade para planejar rotas de campo e expansão de mercado com precisão cirúrgica.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Visão Panorâmica do Território Comercial",
        badge: "Ato 1: Território",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Onde estão seus clientes mais lucrativos?",
        overlaySubline: "Visualização geográfica tática integrada à sua carteira em tempo real.",
        teleprompter: "Como a sua diretoria comercial toma decisões de expansão? Com o Mapa Tático Operacional da VALLOR, você visualiza toda a sua carteira distribuída no mapa.",
        floatingStat: { label: "Cidades Cobertas", value: "318 Municípios", color: "#00D2FF" },
        ctaText: "Explorar Mapa Tático"
      },
      {
        id: 2,
        title: "Densidade Municipal & Heatmap Ativo",
        badge: "Ato 2: Heatmap",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Densidade de Vendas por Microrregião",
        overlaySubline: "Filtros inteligentes por estado, volume negociado e penetração de mercado.",
        teleprompter: "Veja na tela do Mapa Tático Operacional: cada região destaca o faturamento acumulado, facilitando identificar onde estão os clientes de maior tíquete.",
        floatingStat: { label: "Faturamento Regional", value: "R$ 14.8M", color: "#10B981" },
        ctaText: "Filtrar por Região"
      },
      {
        id: 3,
        title: "Otimização de Rotas de Visitação",
        badge: "Ato 3: Logística",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Rotas Inteligentes para Equipes de Campo",
        overlaySubline: "Reduza o tempo de deslocamento e aumente em até 40% o número de reuniões presenciais.",
        teleprompter: "Sua equipe externa economiza tempo e combustível ao agrupar visitas por densidade geográfica direto pelo sistema.",
        floatingStat: { label: "Economia de Rota", value: "+38% Visitas", color: "#F59E0B" },
        ctaText: "Gerar Rota Otimizada"
      },
      {
        id: 4,
        title: "Domínio Territorial & Fechamento",
        badge: "Ato 4: Escala",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Domine seu Território Comercial com a VALLOR",
        overlaySubline: "Inteligência operacional conectada diretamente ao funil de vendas.",
        teleprompter: "VALLOR Mapa Tático Operacional: o padrão ouro em inteligência territorial para empresas de alto desempenho.",
        floatingStat: { label: "Market Share", value: "Líder Regional", color: "#0055FF" },
        ctaText: "Solicitar Demonstração"
      }
    ]
  },
  {
    id: "base_de_contatos",
    name: "Base de Contatos",
    category: "OPERAÇÃO / ATENDIMENTO",
    route: "/contacts",
    badge: "Carteira Qualificada",
    iconName: "Users",
    highlightColor: "#3B82F6",
    whatItDoes: "Gestão completa da carteira corporativa, empresas, fazendas, pessoas-chave, históricos e etiquetas de qualificação.",
    commercialPitch: "Centralize todos os clientes da sua empresa em uma base blindada, auditada e com acionamento de WhatsApp em 1 clique.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Fim da Desorganização e Planilhas Soltas",
        badge: "Ato 1: Governança",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Onde estão guardados os contatos dos seus clientes?",
        overlaySubline: "Centralize todo o patrimônio comercial da sua empresa em um único ecossistema seguro.",
        teleprompter: "Quantos contatos e negócios são perdidos quando vendedores saem da empresa com celulares particulares? Na Base de Contatos da VALLOR, tudo é auditado.",
        floatingStat: { label: "Base Total", value: "28.450 Contatos", color: "#3B82F6" },
        ctaText: "Ver Base Centralizada"
      },
      {
        id: 2,
        title: "Filtros Avançados & Busca Instantânea",
        badge: "Ato 2: Segmentação",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Localize Qualquer Perfil em Segundos",
        overlaySubline: "Segmentações por tag, região, ticket médio e data da última interação.",
        teleprompter: "Esta é a tela real da Base de Contatos. Com filtros inteligentes por tags e histórico financeiro, você segmenta sua audiência imediatamente.",
        floatingStat: { label: "Leads Qualificados", value: "4.120 Ativos", color: "#10B981" },
        ctaText: "Segmentar Contatos"
      },
      {
        id: 3,
        title: "Ficha 360 Graus com Histórico Completo",
        badge: "Ato 3: Raio-X",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Linha do Tempo Completa do Cliente",
        overlaySubline: "Contratos assinados, conversas no WhatsApp e propostas abertas em uma única visualização.",
        teleprompter: "Ao clicar em qualquer contato, acesse o raio-X completo: histórico de compras, mensagens trocadas e propostas pendentes.",
        floatingStat: { label: "Tempo de Resposta", value: "< 2 min", color: "#8B5CF6" },
        ctaText: "Abrir Ficha 360°"
      },
      {
        id: 4,
        title: "Patrimônio Comercial Blindado",
        badge: "Ato 4: Segurança",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Sua Carteira de Clientes Sempre Protegida",
        overlaySubline: "VALLOR Base de Contatos: segurança corporativa e dados centralizados.",
        teleprompter: "VALLOR Base de Contatos: proteja o maior patrimônio da sua empresa e transforme relacionamentos em vendas recorrentes.",
        floatingStat: { label: "Retenção de Clientes", value: "+94%", color: "#10B981" },
        ctaText: "Conhecer a VALLOR"
      }
    ]
  },
  {
    id: "monitor_em_tempo_real",
    name: "Monitor em Tempo Real",
    category: "OPERAÇÃO / ATENDIMENTO",
    route: "/monitor",
    badge: "Torre de Controle",
    iconName: "Activity",
    highlightColor: "#EF4444",
    whatItDoes: "Telemetria operacional ao vivo com fluxo de mensagens por minuto, operadores logados, tempo de espera e SLA das filas.",
    commercialPitch: "Acompanhe tudo o que acontece no seu atendimento ao vivo em um telão de comando de alto impacto.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "A Torre de Comando da sua Operação",
        badge: "Ato 1: Visão Ao Vivo",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Você sabe o que sua equipe está fazendo agora?",
        overlaySubline: "Telemetria de atendimento ao vivo para gestores e diretores exigentes.",
        teleprompter: "Como você monitora a produtividade da sua equipe em tempo real? O Monitor em Tempo Real da VALLOR é a torre de controle definitiva da sua operação.",
        floatingStat: { label: "Operadores Online", value: "14 Ativos", color: "#10B981" },
        ctaText: "Ver Torre de Comando"
      },
      {
        id: 2,
        title: "Telemetria de Mensagens & Fila de Espera",
        badge: "Ato 2: Painel Ao Vivo",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Fluxo de Mensagens e SLA em Tempo Real",
        overlaySubline: "Gráficos dinâmicos que atualizam a cada segundo sem precisar de F5.",
        teleprompter: "Veja os picos de tráfego, o tempo médio de primeira resposta e as filas de transbordo com alertas visuais automáticos.",
        floatingStat: { label: "SLA Médio", value: "48 Segundos", color: "#00D2FF" },
        ctaText: "Auditar Filas"
      },
      {
        id: 3,
        title: "Intervenção Rápida em Gargalos",
        badge: "Ato 3: Ação Imediata",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Identifique Quedas de Produtividade na Hora",
        overlaySubline: "Redistribua atendimentos com um clique para manter zero clientes esperando.",
        teleprompter: "Se uma fila acumular mensagens, o gestor intervém instantaneamente e redireciona conversas para operadores disponíveis.",
        floatingStat: { label: "Fila Zerada", value: "0 Esperando", color: "#10B981" },
        ctaText: "Redistribuir Filas"
      },
      {
        id: 4,
        title: "Excelência Operacional Contínua",
        badge: "Ato 4: Performance",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Controle Absoluto da Sua Máquina de Atendimento",
        overlaySubline: "VALLOR Monitor em Tempo Real: precisão para operações de grande escala.",
        teleprompter: "VALLOR Monitor em Tempo Real: controle cada minuto da sua operação e garanta a melhor experiência para os seus clientes.",
        floatingStat: { label: "Satisfação CSAT", value: "98.7%", color: "#10B981" },
        ctaText: "Escalar Operação"
      }
    ]
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "OPERAÇÃO / ATENDIMENTO",
    route: "/inbox",
    badge: "Omnichannel Oficial",
    iconName: "MessageSquare",
    highlightColor: "#22C55E",
    whatItDoes: "Inbox profissional centralizando múltiplos números de WhatsApp, transcrição de áudio via IA, notas internas amarelas e transbordo seguro.",
    commercialPitch: "Atenda centenas de conversas simultâneas em múltiplos números com velocidade extrema e inteligência artificial integrada.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "O Fim do Caos de Mensagens no WhatsApp",
        badge: "Ato 1: Centralização",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Seu WhatsApp é um caos de mensagens soltas?",
        overlaySubline: "Unifique todos os números e atendentes em uma única tela profissional e auditada.",
        teleprompter: "Quantas vendas a sua empresa perde por demorar para responder no WhatsApp? O Inbox Oficial da VALLOR resolve esse gargalo definitivamente.",
        floatingStat: { label: "Conversas Hoje", value: "1.840 Chats", color: "#22C55E" },
        ctaText: "Abrir Inbox Central"
      },
      {
        id: 2,
        title: "Inbox Real com Transcrição de Áudio",
        badge: "Ato 2: IA no Áudio",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Ouça e Leia Áudios em Velocidade Dobrada",
        overlaySubline: "Player inteligente com ondas de som dinâmicas e transcrição de texto instantânea.",
        teleprompter: "Esta é a tela real do nosso WhatsApp. O atendente ouve mensagens com ondas sonoras aceleradas ou lê a transcrição feita na hora pela inteligência artificial.",
        floatingStat: { label: "Transcrição IA", value: "Instantânea", color: "#00D2FF" },
        ctaText: "Testar Transcrição"
      },
      {
        id: 3,
        title: "Notas Internas & Transbordo Seguro",
        badge: "Ato 3: Colaboração",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Notas Amarelas Visíveis Apenas para a Equipe",
        overlaySubline: "Comunicação interna blindada sem qualquer risco do cliente ver os bastidores.",
        teleprompter: "A equipe se comunica em tempo real através de notas internas que o cliente nunca vê, facilitando passagens de bastão em negociações complexas.",
        floatingStat: { label: "Privacidade", value: "100% Blindado", color: "#F59E0B" },
        ctaText: "Ver Notas Internas"
      },
      {
        id: 4,
        title: "Atendimento de Classe Mundial",
        badge: "Ato 4: Conversão",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Mais Velocidade, Mais Confiança, Mais Vendas",
        overlaySubline: "Eleve o padrão de comunicação da sua marca com a VALLOR.",
        teleprompter: "VALLOR WhatsApp: transforme o principal canal de comunicação dos seus clientes em uma máquina de fechar contratos.",
        floatingStat: { label: "Conversão Final", value: "+32% Vendas", color: "#22C55E" },
        ctaText: "Iniciar Agora"
      }
    ]
  },
  {
    id: "inbox_de_email",
    name: "Inbox de E-mail",
    category: "OPERAÇÃO / ATENDIMENTO",
    route: "/email-inbox",
    badge: "E-mail Corporativo",
    iconName: "Mail",
    highlightColor: "#6366F1",
    whatItDoes: "Gestão unificada de caixas de entrada de e-mail corporativo sincronizadas com o histórico do contato no CRM.",
    commercialPitch: "Trate e-mails com a mesma agilidade do WhatsApp, vinculando propostas e conversas na linha do tempo do cliente.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Comunicação Formal e Comercial Integrada",
        badge: "Ato 1: Integração",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Seus e-mails estão isolados do CRM de vendas?",
        overlaySubline: "Sincronize caixas corporativas com a linha do tempo de cada cliente.",
        teleprompter: "Perder o fio da meada em trocas de e-mail com diretores custa negócios. No Inbox de E-mail da VALLOR, tudo fica registrado no cadastro do cliente.",
        floatingStat: { label: "E-mails Sincronizados", value: "100% Integrado", color: "#6366F1" },
        ctaText: "Ver Inbox de E-mail"
      },
      {
        id: 2,
        title: "Respostas Rápidas e Modelos Padrão",
        badge: "Ato 2: Produtividade",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Templates Profissionais em 1 Clique",
        overlaySubline: "Dispare apresentações e minutas contratuais sem retrabalho de digitação.",
        teleprompter: "Com modelos corporativos pré-aprovados, seus consultores respondem solicitações formais em questão de segundos com formatação impecável.",
        floatingStat: { label: "Agilidade", value: "3x Mais Rápido", color: "#10B981" },
        ctaText: "Usar Modelos"
      },
      {
        id: 3,
        title: "Rastreamento de Abertura & Anexos",
        badge: "Ato 3: Notificação",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Saiba no Exato Instante que o Cliente Abrir",
        overlaySubline: "Alertas em tempo real de leitura de propostas e downloads de minutas.",
        teleprompter: "Receba alertas imediatos quando o tomador de decisão abrir seu e-mail e baixe os anexos da proposta comercial.",
        floatingStat: { label: "Taxa de Abertura", value: "76.4%", color: "#F59E0B" },
        ctaText: "Ver Rastreamento"
      },
      {
        id: 4,
        title: "Omnichannel Completo para sua Empresa",
        badge: "Ato 4: Conexão",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Do E-mail ao WhatsApp sem Fricção",
        overlaySubline: "VALLOR Inbox de E-mail: profissionalismo e rastreabilidade total.",
        teleprompter: "VALLOR Inbox de E-mail: garanta a governança da comunicação corporativa com histórico auditado em todas as etapas.",
        floatingStat: { label: "Histórico Seguro", value: "Auditado", color: "#6366F1" },
        ctaText: "Conhecer VALLOR"
      }
    ]
  },
  {
    id: "metricas_de_atendimento",
    name: "Métricas de Atendimento",
    category: "OPERAÇÃO / ATENDIMENTO",
    route: "/dashboard/atendimento",
    badge: "Analytics Operacional",
    iconName: "BarChart",
    highlightColor: "#EC4899",
    whatItDoes: "Indicadores operacionais de TME (Tempo Médio de Espera), TMA (Tempo Médio de Atendimento), volume por departamento e ranking de operadores.",
    commercialPitch: "Decida com dados reais o dimensionamento da sua equipe e atinja padrões internacionais de atendimento ao cliente.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Decisões Baseadas em Dados Operacionais",
        badge: "Ato 1: Métricas",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Qual é o tempo real que seu cliente espera?",
        overlaySubline: "Indicadores consolidados de primeira resposta, duração média e resolução.",
        teleprompter: "Como medir a qualidade do seu suporte e das vendas? O painel de Métricas de Atendimento consolida todos os indicadores essenciais da sua operação.",
        floatingStat: { label: "TME Médio", value: "1m 12s", color: "#EC4899" },
        ctaText: "Ver Métricas"
      },
      {
        id: 2,
        title: "Ranking de Produtividade dos Operadores",
        badge: "Ato 2: Ranking",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Reconheça os Melhores Fechadores e Atendentes",
        overlaySubline: "Volume de atendimentos concluídos, avaliações positivas e taxa de conversão.",
        teleprompter: "Descubra com facilidade quem são os operadores mais ágeis da sua equipe e identifique pontos de treinamento para quem precisa de apoio.",
        floatingStat: { label: "Top Atendente", value: "98% Positivo", color: "#10B981" },
        ctaText: "Ver Leaderboard"
      },
      {
        id: 3,
        title: "Distribuição por Filas e Horários de Pico",
        badge: "Ato 3: Capacidade",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Dimensionamento Perfeito da Equipe",
        overlaySubline: "Descubra os horários de maior fluxo para escalar escalas de trabalho.",
        teleprompter: "Evite filas no horário de pico sabendo exatamente quais horas do dia demandam mais atendentes conectados.",
        floatingStat: { label: "Horário de Pico", value: "14h às 17h", color: "#F59E0B" },
        ctaText: "Ajustar Escalas"
      },
      {
        id: 4,
        title: "Atendimento de Alta Precisão",
        badge: "Ato 4: Padrão",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Gestão Orientada a Padrões de Alta Performance",
        overlaySubline: "VALLOR Métricas de Atendimento: transparência e evolução contínua.",
        teleprompter: "VALLOR Métricas de Atendimento: eleve o nível de serviço da sua marca com dados confiáveis e decisões inteligentes.",
        floatingStat: { label: "Eficiência", value: "+45% Produtividade", color: "#EC4899" },
        ctaText: "Otimizar Operação"
      }
    ]
  },

  // -----------------------------------------------------------------------
  // 2. MARKETING & AGÊNCIA
  // -----------------------------------------------------------------------
  {
    id: "kanban_de_producao",
    name: "Kanban de Produção",
    category: "MARKETING & AGÊNCIA",
    route: "/agency/marketing",
    badge: "Esteira Criativa",
    iconName: "LayoutKanban",
    highlightColor: "#8B5CF6",
    whatItDoes: "Esteira de produção ágil para agências e marketing: briefings, roteiros, peças visuais, revisões e aprovações com o cliente.",
    commercialPitch: "Organize dezenas de demandas criativas por estágio com prazos visíveis e aprovação rápida do cliente.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "O Fim dos Gargalos na Criação e Marketing",
        badge: "Ato 1: Demandas",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Sua produção criativa está travada em revisões?",
        overlaySubline: "Controle cada peça, criativo e vídeo em uma esteira visual clara do briefing à aprovação.",
        teleprompter: "Quantas campanhas atrasam por falta de clareza nas etapas de revisão? O Kanban de Produção da VALLOR dá visibilidade total à sua equipe de marketing.",
        floatingStat: { label: "Cards em Produção", value: "42 Peças Ativas", color: "#8B5CF6" },
        ctaText: "Ver Kanban de Produção"
      },
      {
        id: 2,
        title: "Arraste Ágil & Prazos Críticos em Destaque",
        badge: "Ato 2: Fluxo",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Etapas Claras: Do Roteiro ao Criativo Final",
        overlaySubline: "Alertas coloridos para prazos próximos e prioridades urgentes.",
        teleprompter: "Veja a esteira em movimento: briefings, produção de design, validação interna e envio para o cliente com arraste rápido e intuitivo.",
        floatingStat: { label: "No Prazo", value: "96.2% Entregas", color: "#10B981" },
        ctaText: "Arrastar Cards"
      },
      {
        id: 3,
        title: "Comentários e Feedbacks no Próprio Card",
        badge: "Ato 3: Colaboração",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Centralize Ajustes sem Conversas Perdidas",
        overlaySubline: "Anexe referências, links e aprove criativos sem ruídos de comunicação.",
        teleprompter: "Designers e redatores trocam ideias e recebem orientações pontuais direto no card da peça, mantendo histórico impecável.",
        floatingStat: { label: "Revisões", value: "-50% Refações", color: "#F59E0B" },
        ctaText: "Ver Feedbacks"
      },
      {
        id: 4,
        title: "Entrega Pontual & Escala Criativa",
        badge: "Ato 4: Escala",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Mais Campanhas Entregues com Qualidade Extrema",
        overlaySubline: "VALLOR Kanban de Produção: o motor das agências e times de marketing de ponta.",
        teleprompter: "VALLOR Kanban de Produção: organize seu time criativo para entregar campanhas no prazo com excelência visual.",
        floatingStat: { label: "Capacidade", value: "2.5x Mais Peças", color: "#8B5CF6" },
        ctaText: "Conhecer a VALLOR"
      }
    ]
  },
  {
    id: "clientes_e_escopos",
    name: "Clientes & Escopos",
    category: "MARKETING & AGÊNCIA",
    route: "/agency/marketing/clients",
    badge: "Gestão de Contratos",
    iconName: "Briefcase",
    highlightColor: "#0EA5E9",
    whatItDoes: "Gestão dos clientes de agência, pacotes contratados, entregáveis do mês, limites de peças e consumo do escopo.",
    commercialPitch: "Tenha clareza milimétrica do que cada cliente contratou e evite prestar serviços extras sem cobrança.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Controle Firme de Entregáveis e Pacotes",
        badge: "Ato 1: Escopo",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Sua agência trabalha mais do que recebe?",
        overlaySubline: "Monitore o limite de posts, vídeos e páginas contratadas para cada cliente ativo.",
        teleprompter: "Prestar serviços fora do escopo sem cobrar corrói a margem da sua agência. Com Clientes & Escopos da VALLOR, você tem o termômetro de entregas em tempo real.",
        floatingStat: { label: "Clientes Ativos", value: "26 Contratos", color: "#0EA5E9" },
        ctaText: "Ver Escopos"
      },
      {
        id: 2,
        title: "Consumo do Mês em Barras Visuais",
        badge: "Ato 2: Consumo",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Barras de Progresso de Cada Entregável",
        overlaySubline: "Saiba quantos posts faltam para atingir 100% da cota mensal.",
        teleprompter: "Veja o consumo de criativos do mês de cada conta com gráficos visuais claros para sua equipe e para os clientes.",
        floatingStat: { label: "Entregas do Mês", value: "78% Concluídas", color: "#10B981" },
        ctaText: "Auditar Cotas"
      },
      {
        id: 3,
        title: "Renovação e Up-sell de Serviços Extras",
        badge: "Ato 3: Rentabilidade",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Identifique Oportunidades de Venda Adicional",
        overlaySubline: "Quando o cliente estourar a cota, ofereça pacotes extras com 1 clique.",
        teleprompter: "Transforme pedidos adicionais de clientes em receita recorrente com relatórios objetivos de horas e peças executadas.",
        floatingStat: { label: "Up-sell Médio", value: "+22% Receita", color: "#F59E0B" },
        ctaText: "Gerar Aditivo"
      },
      {
        id: 4,
        title: "Rentabilidade Blindada para Agências",
        badge: "Ato 4: Lucratividade",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Margem Protegida e Contratos Saudáveis",
        overlaySubline: "VALLOR Clientes & Escopos: a governança que sua agência precisa para lucrar mais.",
        teleprompter: "VALLOR Clientes & Escopos: proteja a margem dos seus contratos e construa relações comerciais transparentes e duradouras.",
        floatingStat: { label: "Margem Líquida", value: "+35% Agência", color: "#0EA5E9" },
        ctaText: "Conhecer a Plataforma"
      }
    ]
  },
  {
    id: "cronograma",
    name: "Cronograma",
    category: "MARKETING & AGÊNCIA",
    route: "/agency/marketing/schedule",
    badge: "Calendário Editorial",
    iconName: "Calendar",
    highlightColor: "#F59E0B",
    whatItDoes: "Visão em calendário editorial para agendamento de posts, disparos, campanhas de tráfego e lançamentos de produtos.",
    commercialPitch: "Visualize o mês inteiro de publicações e campanhas da sua empresa em uma linha do tempo coordenada.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Planejamento Estratégico de Conteúdo",
        badge: "Ato 1: Calendário",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "O que sua marca vai publicar esta semana?",
        overlaySubline: "Cronograma visual com datas de gravação, edição e publicação unificadas.",
        teleprompter: "Publicar sem consistência prejudica o alcance da sua marca. Com o Cronograma da VALLOR, você visualiza o mês inteiro de lançamentos com antecedência.",
        floatingStat: { label: "Posts Agendados", value: "32 Campanhas", color: "#F59E0B" },
        ctaText: "Ver Cronograma"
      },
      {
        id: 2,
        title: "Visão Mensal, Semanal e Diária",
        badge: "Ato 2: Linha do Tempo",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Coordenação Perfeita entre Criativos e Tráfego",
        overlaySubline: "Sincronize a equipe de mídia com a data de entrega dos criativos.",
        teleprompter: "Alinhe gestores de tráfego, editores e influenciadores em um único calendário para que nenhuma campanha suba atrasada.",
        floatingStat: { label: "Pontualidade", value: "99% No Prazo", color: "#10B981" },
        ctaText: "Filtrar por Canal"
      },
      {
        id: 3,
        title: "Ajuste Rápido com Drag-and-Drop",
        badge: "Ato 3: Flexibilidade",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Reprograme Campanhas com Arraste Fácil",
        overlaySubline: "Mudou a estratégia? Reorganize as publicações sem dor de cabeça.",
        teleprompter: "Se um evento mudar de data, basta arrastar o card para o novo dia no calendário e o time todo recebe a notificação na hora.",
        floatingStat: { label: "Agilidade", value: "1 Clique", color: "#00D2FF" },
        ctaText: "Reorganizar Datas"
      },
      {
        id: 4,
        title: "Consistência de Marca Imbatível",
        badge: "Ato 4: Presença",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Sua Marca Sempre Presente na Mente do Cliente",
        overlaySubline: "VALLOR Cronograma: constância e autoridade no ambiente digital.",
        teleprompter: "VALLOR Cronograma: domine a estratégia de conteúdo da sua empresa com disciplina, planejamento e resultados comprovados.",
        floatingStat: { label: "Engajamento", value: "+60% Alcance", color: "#F59E0B" },
        ctaText: "Solicitar Apresentação"
      }
    ]
  },
  {
    id: "biblioteca_de_midia",
    name: "Biblioteca de Mídia",
    category: "MARKETING & AGÊNCIA",
    route: "/agency/marketing/media",
    badge: "Acervo Centralizado",
    iconName: "FolderArchive",
    highlightColor: "#14B8A6",
    whatItDoes: "Repositório central de arquivos, logos em alta resolução, vídeos master, modelos de criativos e materiais de marca para a equipe.",
    commercialPitch: "Chega de procurar logos e criativos no WhatsApp: acervo profissional organizado por pastas e permissões de acesso.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "O Acervo de Marca Definitivo",
        badge: "Ato 1: Organização",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Onde estão os arquivos e vídeos da sua marca?",
        overlaySubline: "Pastas organizadas para logos, vídeos finais, fotos em alta e documentos institucionais.",
        teleprompter: "Quantas horas sua equipe perde caçando a versão final de um logotipo ou vídeo institucional? Na Biblioteca de Mídia da VALLOR, tudo fica à mão.",
        floatingStat: { label: "Arquivos Armazenados", value: "1.420 Ativos", color: "#14B8A6" },
        ctaText: "Abrir Biblioteca"
      },
      {
        id: 2,
        title: "Pré-Visualização Rápida e Downloads",
        badge: "Ato 2: Visualização",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Preview de Vídeos e Imagens sem Baixar",
        overlaySubline: "Verifique o formato, resolução e paleta de cores antes de disparar o material.",
        teleprompter: "Visualize peças em alta resolução direto pelo navegador e compartilhe links seguros com clientes ou parceiros de mídia.",
        floatingStat: { label: "Armazenamento", value: "Nuvem Rápida", color: "#10B981" },
        ctaText: "Ver Previews"
      },
      {
        id: 3,
        title: "Controle de Versões e Manuais de Identidade",
        badge: "Ato 3: Padrão",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Garanta que a Equipe Use a Versão Correta",
        overlaySubline: "Substitua peças antigas por novas mantendo o mesmo link ativo.",
        teleprompter: "Evite que vendedores enviem apresentações com tabelas de preços desatualizadas mantendo apenas os materiais oficiais ativos.",
        floatingStat: { label: "Padrão de Marca", value: "100% Homologado", color: "#0055FF" },
        ctaText: "Homologar Materiais"
      },
      {
        id: 4,
        title: "Autoridade Visual Consistente",
        badge: "Ato 4: Identidade",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Profissionalismo em Cada Ponto de Contato",
        overlaySubline: "VALLOR Biblioteca de Mídia: preservação e valorização da sua marca.",
        teleprompter: "VALLOR Biblioteca de Mídia: proteja a identidade visual da sua marca e dê agilidade imediata aos seus times de vendas e marketing.",
        floatingStat: { label: "Padronização", value: "Impecável", color: "#14B8A6" },
        ctaText: "Conhecer a VALLOR"
      }
    ]
  },

  // -----------------------------------------------------------------------
  // 3. CHAT DA EQUIPE
  // -----------------------------------------------------------------------
  {
    id: "chat_interno",
    name: "Chat Interno",
    category: "CHAT DA EQUIPE",
    route: "/chat-interno",
    badge: "Comunicação Segura",
    iconName: "MessagesSquare",
    highlightColor: "#38BDF8",
    whatItDoes: "Comunicação corporativa criptografada entre departamentos, canais por cliente ou filial, menções @ e histórico auditável.",
    commercialPitch: "Tire as conversas internas de grupos desorganizados do WhatsApp e tenha um ambiente corporativo focado em produtividade.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Comunicação Corporativa sem Distrações",
        badge: "Ato 1: Foco",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Sua equipe mistura conversas pessoais com o trabalho?",
        overlaySubline: "Separe o profissional do pessoal com canais de comunicação corporativa segura.",
        teleprompter: "Grupos de WhatsApp repletos de conversas paralelas tiram o foco do time. Com o Chat Interno da VALLOR, sua equipe conversa dentro do sistema com foco total no cliente.",
        floatingStat: { label: "Canais Ativos", value: "18 Canais", color: "#38BDF8" },
        ctaText: "Abrir Chat Interno"
      },
      {
        id: 2,
        title: "Canais por Departamento e Negociação",
        badge: "Ato 2: Canais",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Canais para Jurídico, Financeiro e Vendas",
        overlaySubline: "Alinhe aprovações de desconto e dúvidas de contratos sem ruído.",
        teleprompter: "Crie canais específicos para cada filial, departamento ou até mesmo para fechar uma negociação estratégica com apoio da diretoria.",
        floatingStat: { label: "Segurança", value: "Auditado", color: "#10B981" },
        ctaText: "Criar Canal"
      },
      {
        id: 3,
        title: "Menções @ e Respostas com Contexto",
        badge: "Ato 3: Agilidade",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Chame a Atenção do Responsável Imediatamente",
        overlaySubline: "Notificações na hora no aplicativo com link direto para o cliente em questão.",
        teleprompter: "Mencione seus colegas de equipe, anexe propostas em PDF e resolva dúvidas em questão de segundos com todo o contexto do CRM.",
        floatingStat: { label: "Resposta Média", value: "45 Segundos", color: "#F59E0B" },
        ctaText: "Mencionar Colega"
      },
      {
        id: 4,
        title: "Sinergia e Agilidade Corporativa",
        badge: "Ato 4: Integração",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Equipes Alinhadas Fecham Mais Negócios",
        overlaySubline: "VALLOR Chat Interno: o ecossistema colaborativo da sua empresa.",
        teleprompter: "VALLOR Chat Interno: conecte seus departamentos em tempo real e acelere a tomada de decisões comerciais.",
        floatingStat: { label: "Colaboração", value: "100% Alinhados", color: "#38BDF8" },
        ctaText: "Conhecer a VALLOR"
      }
    ]
  },

  // -----------------------------------------------------------------------
  // 4. FUNIL COMERCIAL (CRM)
  // -----------------------------------------------------------------------
  {
    id: "oportunidades",
    name: "Oportunidades",
    category: "FUNIL COMERCIAL (CRM)",
    route: "/crm",
    badge: "Core de Vendas",
    iconName: "Kanban",
    highlightColor: "#0055FF",
    whatItDoes: "Funil de vendas visual por colunas com valores financeiros consolidados, SLAs de inatividade e arraste nativo de propostas.",
    commercialPitch: "Visualize cada milhão em negociação no seu pipeline com somatória em tempo real e controle total da esteira comercial.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Visibilidade Total do Pipeline de Negócios",
        badge: "Ato 1: Pipeline",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Quanto dinheiro está parado no seu funil comercial?",
        overlaySubline: "Controle visual claro de cada estágio de negociação do primeiro contato ao fechamento.",
        teleprompter: "Você tem clareza exata de quantas propostas estão na mesa e qual é o valor total do seu pipeline hoje? Com a tela de Oportunidades da VALLOR, nada fica perdido.",
        floatingStat: { label: "Pipeline Ativo", value: "R$ 6.420.000", color: "#0055FF" },
        ctaText: "Ver Oportunidades"
      },
      {
        id: 2,
        title: "Kanban Oficial com Somatória Financeira",
        badge: "Ato 2: Movimentação",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Colunas com Totais Financeiros em Tempo Real",
        overlaySubline: "Arraste de cards fluido com recálculo instantâneo do valor da coluna.",
        teleprompter: "Veja o Kanban de Oportunidades em funcionamento: cada coluna soma o valor total dos contratos e permite arrastar negócios com velocidade e fluidez extrema.",
        floatingStat: { label: "Propostas em Negociação", value: "38 Oportunidades", color: "#10B981" },
        ctaText: "Avançar Negócio"
      },
      {
        id: 3,
        title: "Alertas de Inatividade & SLA de Contato",
        badge: "Ato 3: Controle",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Alertas Visuais para Oportunidades Esfriando",
        overlaySubline: "Identifique na hora negócios parados há mais de 48h e tome a iniciativa antes da concorrência.",
        teleprompter: "Cards com alertas de inatividade sinalizam quando um lead precisa de atenção imediata, garantindo que nenhum negócio de alto tíquete escape.",
        floatingStat: { label: "Alerta de SLA", value: "Prioridade Alta", color: "#EF4444" },
        ctaText: "Acionar Lead Imediato"
      },
      {
        id: 4,
        title: "Previsibilidade de Caixa e Metas Batidas",
        badge: "Ato 4: Fechamento",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Vendas Previsíveis para Operações de Alto Tíquete",
        overlaySubline: "O motor de fechamento que sustenta o crescimento da sua empresa.",
        teleprompter: "VALLOR Oportunidades: a esteira definitiva para sua equipe comercial bater metas de milhões todos os meses.",
        floatingStat: { label: "Taxa de Fechamento", value: "31.4%", color: "#00D2FF" },
        ctaText: "Agendar Demonstração"
      }
    ]
  },
  {
    id: "radar_de_stories",
    name: "Radar de Stories",
    category: "FUNIL COMERCIAL (CRM)",
    route: "/crm/radar-stories",
    badge: "Exclusivo VALLOR",
    iconName: "Radio",
    highlightColor: "#A855F7",
    whatItDoes: "Monitora automaticamente todas as pessoas que assistem aos Stories/Status de WhatsApp da empresa, calculando score preditivo de compra e abordagem de 1 clique.",
    commercialPitch: "Transforme visualizações silenciosas de Stories em vendas imediatas com abordagem consultiva de 1 clique.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Identificação de Audiência Oculta de Stories",
        badge: "Ato 1: Oportunidade",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Seus maiores clientes assistem seus Stories todos os dias...",
        overlaySubline: "O VALLOR Radar de Stories identifica exatamente quem está pronto para comprar agora.",
        teleprompter: "Você sabia que os seus maiores clientes assistem aos seus Stories do WhatsApp todos os dias, mas você não sabe quem deles está pronto para fechar negócio agora?",
        floatingStat: { label: "Visualizadores Ativos", value: "340 Contatos", color: "#A855F7" },
        ctaText: "Descobrir Leads Ocultos"
      },
      {
        id: 2,
        title: "Página Real do Radar com Score Preditivo",
        badge: "Ato 2: Telemetria",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Score Preditivo de Propensão de Compra",
        overlaySubline: "Leads quentes separados por pontuação de frequência e histórico financeiro.",
        teleprompter: "Esta é a tela real do Radar de Stories da VALLOR. Ele mapeia cada visualização em tempo real, calculando a frequência da semana e o perfil do cliente.",
        floatingStat: { label: "Score Preditivo", value: "98 / 100", color: "#10B981" },
        ctaText: "Ver Score ao Vivo"
      },
      {
        id: 3,
        title: "Abordagem com Copiloto IA de 1 Clique",
        badge: "Ato 3: Abordagem",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Copiloto IA Gera Abordagem Contextualizada",
        overlaySubline: "A IA redige o gancho ideal baseado no produto exibido no Story visualizado.",
        teleprompter: "Com apenas um clique no botão de Abordagem IA, o sistema redige uma mensagem consultiva contextualizada com o story visualizado e envia direto no WhatsApp.",
        floatingStat: { label: "Tempo de Abordagem", value: "3 Segundos", color: "#00D2FF" },
        ctaText: "Iniciar Abordagem IA"
      },
      {
        id: 4,
        title: "Fechamento & Conversão Imediata",
        badge: "Ato 4: Fechamento",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Transforme Visualizações em Vendas Reais",
        overlaySubline: "VALLOR • O CRM Inteligente para Vendas Consultivas de Alto Impacto.",
        teleprompter: "Pare de deixar dinheiro na mesa. Transforme visualizações silenciosas em vendas fechadas com o Radar de Stories da VALLOR.",
        floatingStat: { label: "Conversão de Stories", value: "+42% Vendas", color: "#A855F7" },
        ctaText: "Ativar Radar de Stories"
      }
    ]
  },
  {
    id: "propostas_comerciais",
    name: "Propostas Comerciais",
    category: "FUNIL COMERCIAL (CRM)",
    route: "/proposals",
    badge: "Gerador Executivo",
    iconName: "FileText",
    highlightColor: "#F59E0B",
    whatItDoes: "Gerador profissional de propostas comerciais em PDF com tabela de itens, cálculo de comissões, condições de pagamento e link de rastreio.",
    commercialPitch: "Crie propostas de alto luxo em menos de 1 minuto e seja avisado na hora em que o cliente abrir o documento.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Apresentações Simples Não Fecham Grandes Negócios",
        badge: "Ato 1: Impacto",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Sua proposta comercial transmite autoridade de milhões?",
        overlaySubline: "Gere documentos executivos com design impecável e tabela de itens detalhada.",
        teleprompter: "Muitas empresas perdem concorrências milionárias porque enviam orçamentos amadores em texto de WhatsApp. A VALLOR transforma cada proposta em um documento de prestígio.",
        floatingStat: { label: "Propostas Emitidas", value: "R$ 2.450.000", color: "#F59E0B" },
        ctaText: "Criar Nova Proposta"
      },
      {
        id: 2,
        title: "Montagem Dinâmica com Catálogo Integrado",
        badge: "Ato 2: Agilidade",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Puxe Produtos, Condições e Prazos com 1 Clique",
        overlaySubline: "Cálculo de entrada, parcelas, juros e comissões da equipe sem erros manuais.",
        teleprompter: "Esta é a tela de Propostas Comerciais da VALLOR. Escolha os itens do catálogo, defina as parcelas e o PDF diagramado fica pronto instantaneamente.",
        floatingStat: { label: "Tempo de Criação", value: "52 Segundos", color: "#10B981" },
        ctaText: "Selecionar Produtos"
      },
      {
        id: 3,
        title: "PDF Corporativo com Link de Rastreio",
        badge: "Ato 3: Notificação",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Envio Direto no WhatsApp com Rastreio de Leitura",
        overlaySubline: "Saiba no exato minuto em que o tomador de decisão abrir a proposta.",
        teleprompter: "Envie o PDF executivo pelo WhatsApp e receba um aviso instantâneo no seu celular no minuto exato em que o cliente abrir a proposta para ler.",
        floatingStat: { label: "Aviso de Leitura", value: "Notificado!", color: "#00D2FF" },
        ctaText: "Enviar com Rastreio"
      },
      {
        id: 4,
        title: "Profissionalismo que Converte Contratos",
        badge: "Ato 4: Autoridade",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Impacto Visual que Acelera a Decisão de Compra",
        overlaySubline: "VALLOR Propostas Comerciais: o padrão ouro para vendas de alto tíquete.",
        teleprompter: "VALLOR Propostas Comerciais: eleve o nível de sofisticação dos seus orçamentos e encante os clientes mais exigentes.",
        floatingStat: { label: "Aprovação Média", value: "68% Aceitas", color: "#F59E0B" },
        ctaText: "Conhecer Propostas"
      }
    ]
  },
  {
    id: "contratos",
    name: "Contratos",
    category: "FUNIL COMERCIAL (CRM)",
    route: "/contracts",
    badge: "Assinatura Digital",
    iconName: "ScrollText",
    highlightColor: "#10B981",
    whatItDoes: "Gestão completa de contratos jurídicos com assinatura eletrônica na tela do smartphone, carimbo de data/hora, IP e validade legal.",
    commercialPitch: "Colete assinaturas contratuais pelo WhatsApp em menos de 3 minutos sem papel, cartório ou burocracia.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "O Fim da Burocracia de Papéis e Cartório",
        badge: "Ato 1: Desburocratização",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Esperar dias por uma assinatura custa caro.",
        overlaySubline: "Colete a assinatura do seu cliente direto no WhatsApp com validade jurídica plena.",
        teleprompter: "Quantos contratos esfriam e demoram semanas porque dependem de impressão física e correios? Com a VALLOR, o cliente assina na tela do smartphone em minutos.",
        floatingStat: { label: "Contratos Ativos", value: "312 Contratos", color: "#10B981" },
        ctaText: "Ver Contratos"
      },
      {
        id: 2,
        title: "Painel Real de Gestão e Status Jurídico",
        badge: "Ato 2: Esteira Jurídica",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Acompanhe Quem Assinou e Quem Está Pendente",
        overlaySubline: "Filtros por prazo de vencimento, assinaturas coletadas e auditoria por IP.",
        teleprompter: "Esta é a tela de Contratos da VALLOR. Você monitora os documentos em aberto, assinados e auditados com carimbo de tempo e geolocalização.",
        floatingStat: { label: "Assinados Hoje", value: "12 Documentos", color: "#3B82F6" },
        ctaText: "Filtrar Pendentes"
      },
      {
        id: 3,
        title: "Assinatura Tátil na Tela do Celular",
        badge: "Ato 3: Rubrica Touch",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Experiência Fluida para o Tomador de Decisão",
        overlaySubline: "Rubrica biométrica e confirmação por token seguro sem fricção.",
        teleprompter: "O cliente recebe o link seguro pelo WhatsApp, rubrica com o dedo na tela do celular e o contrato autenticado é arquivado na ficha do CRM.",
        floatingStat: { label: "Tempo de Assinatura", value: "< 3 Minutos", color: "#F59E0B" },
        ctaText: "Rubricar Documento"
      },
      {
        id: 4,
        title: "Segurança Jurídica & Velocidade Máxima",
        badge: "Ato 4: Blindagem",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Mais Contratos Fechados com Segurança Total",
        overlaySubline: "VALLOR Contratos: o fechamento ágil e blindado para sua empresa.",
        teleprompter: "VALLOR Contratos: reduza o ciclo de fechamento de dias para minutos com máxima segurança jurídica e compliance corporativo.",
        floatingStat: { label: "Validade Legal", value: "100% Jurídico", color: "#10B981" },
        ctaText: "Agendar Demonstração"
      }
    ]
  },
  {
    id: "metas_comerciais",
    name: "Metas Comerciais",
    category: "FUNIL COMERCIAL (CRM)",
    route: "/dashboard/goals",
    badge: "Run Rate Preditivo",
    iconName: "Target",
    highlightColor: "#E11D48",
    whatItDoes: "Calcula a projeção matemática de fechamento do mês (Run Rate), ritmo diário necessário e pódio Top 3 gamificado dos melhores corretores.",
    commercialPitch: "Elimine a incerteza do final do mês com termômetro matemático de Run Rate e engajamento da equipe.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "O Desafio de Bater Metas no Escuro",
        badge: "Ato 1: Ritmo",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Sua equipe vai bater a meta este mês?",
        overlaySubline: "Pare de torcer no final do mês. Tenha previsibilidade matemática diária de fechamento.",
        teleprompter: "Esperar o último dia do mês para saber se a meta foi batida é o maior erro de uma gestão comercial. Com as Metas Comerciais da VALLOR, você tem o termômetro de Run Rate ao vivo.",
        floatingStat: { label: "Meta Consolidada", value: "R$ 5.000.000", color: "#E11D48" },
        ctaText: "Ver Painel de Metas"
      },
      {
        id: 2,
        title: "Termômetro Real de Run Rate & Pódio",
        badge: "Ato 2: Painel Real",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Projeção Matemática & Leaderboard da Equipe",
        overlaySubline: "Ritmo diário exigido para atingir 100% da meta consolidada.",
        teleprompter: "Esta é a tela real de Metas Comerciais da VALLOR. Ela calcula automaticamente a projeção de receita diária e destaca o ranking dos melhores fechadores da equipe.",
        floatingStat: { label: "Run Rate Previsto", value: "108% da Meta", color: "#10B981" },
        ctaText: "Consultar Ritmo Diário"
      },
      {
        id: 3,
        title: "Simulador Preditivo de Vendas",
        badge: "Ato 3: Simulação",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Simule Cenários de Aceleração Comercial",
        overlaySubline: "Descubra exatamente quantos negócios faltam para superar o teto da meta.",
        teleprompter: "O simulador preditivo integrado mostra quantas vendas adicionais são necessárias para atingir bônus e premiações especiais para o time.",
        floatingStat: { label: "Faltam p/ Bônus", value: "3 Negócios", color: "#F59E0B" },
        ctaText: "Simular Cenários"
      },
      {
        id: 4,
        title: "Cultura de Alta Performance",
        badge: "Ato 4: Sucesso",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Motivação e Clareza para o Time de Vendas",
        overlaySubline: "VALLOR Metas Comerciais: transparência e foco absoluto no resultado.",
        teleprompter: "VALLOR Metas Comerciais: impulsione o engajamento do seu time comercial com métricas claras e metas alcançáveis.",
        floatingStat: { label: "Meta Superada", value: "+15% Bônus", color: "#10B981" },
        ctaText: "Bater Metas com VALLOR"
      }
    ]
  },
  {
    id: "metricas_de_vendas",
    name: "Métricas de Vendas",
    category: "FUNIL COMERCIAL (CRM)",
    route: "/dashboard/crm",
    badge: "BI Comercial",
    iconName: "PieChart",
    highlightColor: "#6366F1",
    whatItDoes: "Painel de Business Intelligence com ticket médio por fechamento, taxa de conversão por canal de origem e ciclo de vendas.",
    commercialPitch: "Entenda com precisão científica de onde vêm seus clientes mais lucrativos e onde vale a pena investir.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Raio-X Completo da Eficiência Comercial",
        badge: "Ato 1: Inteligência",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Qual canal traz o cliente de maior ticket médio?",
        overlaySubline: "Gráficos de dispersão, CAC, LTV e conversão comparada por origem de lead.",
        teleprompter: "Investir em marketing sem saber qual canal converte mais em vendas reais é desperdiçar orçamento. O painel de Métricas de Vendas da VALLOR revela a verdade dos seus números.",
        floatingStat: { label: "Ticket Médio", value: "R$ 145.000", color: "#6366F1" },
        ctaText: "Ver Métricas de Vendas"
      },
      {
        id: 2,
        title: "Comparativo de Canais: WhatsApp vs Ads",
        badge: "Ato 2: Origem",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Taxa de Conversão por Fonte de Atração",
        overlaySubline: "Descubra se o tráfego pago ou as indicações geram maior lucratividade.",
        teleprompter: "Veja o gráfico comparativo de canais: descubra o custo de aquisição de cada contrato e direcione o investimento para onde o retorno é comprovado.",
        floatingStat: { label: "Canal Campeão", value: "WhatsApp (38%)", color: "#10B981" },
        ctaText: "Comparar Canais"
      },
      {
        id: 3,
        title: "Tempo de Ciclo de Negociação",
        badge: "Ato 3: Ciclo",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Reduza os Dias entre o Primeiro Contato e o Contrato",
        overlaySubline: "Identifique gargalos que atrasam a decisão de compra do cliente.",
        teleprompter: "Descubra em qual etapa do funil os clientes passam mais tempo e acelere os fechamentos com intervenções cirúrgicas da diretoria.",
        floatingStat: { label: "Ciclo Médio", value: "14 Dias (-30%)", color: "#00D2FF" },
        ctaText: "Otimizar Ciclo"
      },
      {
        id: 4,
        title: "Crescimento Comercial Exponencial",
        badge: "Ato 4: Escala",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "A Inteligência que Multiplica Seus Resultados",
        overlaySubline: "VALLOR Métricas de Vendas: dados estratégicos para diretores visionários.",
        teleprompter: "VALLOR Métricas de Vendas: tome decisões comerciais respaldadas por dados e impulsione a receita da sua empresa.",
        floatingStat: { label: "ROI Comercial", value: "4.8x Retorno", color: "#6366F1" },
        ctaText: "Conhecer o BI VALLOR"
      }
    ]
  },
  {
    id: "analytics_avancado",
    name: "Analytics Avançado",
    category: "FUNIL COMERCIAL (CRM)",
    route: "/dashboard/analytics",
    badge: "Big Data & IA",
    iconName: "TrendingUp",
    highlightColor: "#06B6D4",
    whatItDoes: "Cruzamento avançado de dados multidimensionais, retenção de cohort, churn preditivo e tendências financeiras trimestrais.",
    commercialPitch: "Big Data corporativo para antecipar comportamentos de compra e blindar sua empresa contra perda de clientes.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Inteligência Preditiva em Grande Escala",
        badge: "Ato 1: Big Data",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Preveja o comportamento do seu mercado antes da concorrência.",
        overlaySubline: "Modelos estatísticos que identificam padrões de recompra e tendências financeiras.",
        teleprompter: "Como a sua diretoria planeja o próximo trimestre? Com o Analytics Avançado da VALLOR, você tem análises preditivas baseadas em milhões de interações registradas.",
        floatingStat: { label: "Acurácia Preditiva", value: "94.8%", color: "#06B6D4" },
        ctaText: "Ver Analytics Avançado"
      },
      {
        id: 2,
        title: "Matriz de Cohort e Retenção de Clientes",
        badge: "Ato 2: Retenção",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Retenção Contínua ao Longo dos Meses",
        overlaySubline: "Descubra a longevidade dos seus clientes e o valor de tempo de vida (LTV).",
        teleprompter: "Analise a evolução de cada safra de clientes e identifique o momento exato em que a sua empresa deve realizar ações de pós-venda e expansão.",
        floatingStat: { label: "LTV Médio", value: "R$ 380.000", color: "#10B981" },
        ctaText: "Ver Matriz Cohort"
      },
      {
        id: 3,
        title: "Alerta Antecipado de Churn",
        badge: "Ato 3: Prevenção",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Saiba Quem Pode Cancelar com Semanas de Antecedência",
        overlaySubline: "Algoritmos detectam redução de engajamento antes do aviso formal do cliente.",
        teleprompter: "O sistema emite alertas preventivos quando um cliente estratégico reduz o ritmo de contato, permitindo que a diretoria atue antes do cancelamento.",
        floatingStat: { label: "Churn Evitado", value: "88% Retidos", color: "#F59E0B" },
        ctaText: "Proteger Contas"
      },
      {
        id: 4,
        title: "Liderança de Mercado Sustentável",
        badge: "Ato 4: Visão",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "A Ciência de Dados a Serviço do Seu Negócio",
        overlaySubline: "VALLOR Analytics Avançado: o futuro da gestão corporativa hoje.",
        teleprompter: "VALLOR Analytics Avançado: capacite a sua governança com análises profundas e visão de longo prazo.",
        floatingStat: { label: "Crescimento Anual", value: "+48% YoY", color: "#06B6D4" },
        ctaText: "Solicitar Demonstração"
      }
    ]
  },
  {
    id: "automacoes_de_vendas",
    name: "Automações de Vendas",
    category: "FUNIL COMERCIAL (CRM)",
    route: "/settings?tab=automations",
    badge: "Motor de Fluxos",
    iconName: "Zap",
    highlightColor: "#F97316",
    whatItDoes: "Construtor de réguas automáticas de mensagens de WhatsApp, distribuição de leads por roleta, tags e gatilhos de avanço de coluna.",
    commercialPitch: "Automatize até 70% das tarefas repetitivas do time comercial e responda novos leads em menos de 5 segundos.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Piloto Automático para o Processo Comercial",
        badge: "Ato 1: Automação",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Quanto tempo seus vendedores perdem com tarefas manuais?",
        overlaySubline: "Disparos automáticos, transbordo de leads e agendamentos em piloto automático.",
        teleprompter: "Seus vendedores passam horas digitando mensagens repetitivas ou esquecendo de fazer follow-up? As Automações de Vendas da VALLOR colocam sua esteira para rodar 24 horas por dia.",
        floatingStat: { label: "Tarefas Automatizadas", value: "14.200 / mês", color: "#F97316" },
        ctaText: "Criar Automação"
      },
      {
        id: 2,
        title: "Distribuição Inteligente por Roleta de Vendas",
        badge: "Ato 2: Roleta",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Distribuição Imediata de Novos Leads",
        overlaySubline: "Envio equilibrado por corretor, região ou capacidade de atendimento.",
        teleprompter: "Assim que um lead entra pelo site ou anúncio, o motor distribui para o corretor livre e já inicia o primeiro contato no WhatsApp em 5 segundos.",
        floatingStat: { label: "Tempo de Primeiro Contato", value: "4.8 Segundos", color: "#10B981" },
        ctaText: "Ver Roleta Ativa"
      },
      {
        id: 3,
        title: "Gatilhos por Estágio do Kanban",
        badge: "Ato 3: Gatilhos",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Arrastou a Oportunidade? A Ação Dispara na Hora",
        overlaySubline: "Envio de contratos, avisos no WhatsApp e agendamentos sem esforço manual.",
        teleprompter: "Quando o vendedor arrasta uma oportunidade para a coluna de Proposta, o sistema dispara o PDF no WhatsApp do cliente e notifica a gerência automaticamente.",
        floatingStat: { label: "Produtividade", value: "+300% Foco", color: "#00D2FF" },
        ctaText: "Configurar Gatilhos"
      },
      {
        id: 4,
        title: "Escala Comercial sem Aumentar Equipe",
        badge: "Ato 4: Escala",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Venda Mais com a Mesma Estrutura",
        overlaySubline: "VALLOR Automações de Vendas: a alavanca para multiplicar seu faturamento.",
        teleprompter: "VALLOR Automações de Vendas: escale seu volume de negociações mantendo atendimento ágil, personalizado e lucrativo.",
        floatingStat: { label: "Eficiência Geral", value: "+75% Conversão", color: "#F97316" },
        ctaText: "Automatizar Vendas"
      }
    ]
  }
];

// Mapeamento dinâmico de ícones
const ICON_COMPONENTS: Record<string, any> = {
  Compass,
  Users,
  Activity,
  MessageSquare,
  Mail,
  BarChart,
  LayoutKanban,
  Briefcase,
  Calendar,
  FolderArchive,
  MessagesSquare,
  Kanban,
  Radio,
  FileText,
  ScrollText,
  Target,
  PieChart,
  TrendingUp,
  Zap,
  Layers,
  Settings
};

export default function MotionStudioView() {
  const [mounted, setMounted] = useState(false);
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>("mapa_tatico_operacional");
  const [aspectRatio, setAspectRatio] = useState<"vertical" | "horizontal">("horizontal");
  const [motionStyle, setMotionStyle] = useState<"sysjuros_3d" | "motionloved_studio" | "flat_clean">("sysjuros_3d");
  const [isRecordingMode, setIsRecordingMode] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Painel de IA Copiloto Artístico & Roteirista
  const [isAiDirectorOpen, setIsAiDirectorOpen] = useState<boolean>(true);
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>("");
  const [isGeneratingAiScript, setIsGeneratingAiScript] = useState<boolean>(false);
  const [aiTargetAudience, setAiTargetAudience] = useState<string>("b2b_diretoria");

  // Transições & Overlays
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [showLiveCursor, setShowLiveCursor] = useState<boolean>(true);

  // Narração / Áudio
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Busca a função selecionada do catálogo
  const activeFunction: VallorSystemFunction =
    VALLOR_SYSTEM_CATALOG.find((f) => f.id === selectedFunctionId) ||
    VALLOR_SYSTEM_CATALOG[0];

  // Identifica a cena atual da timeline
  const currentScene: MotionScene =
    activeFunction.scenes.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    ) || activeFunction.scenes[activeFunction.scenes.length - 1];

  // Controle de reprodução contínua da timeline
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1 * playbackSpeed;
          if (next >= activeFunction.defaultDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, activeFunction.defaultDuration]);

  // Sincroniza áudio carregado se existir
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.currentTime = currentTime;
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTime]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const handleRestart = () => {
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };
  const seekTo = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioFileName(file.name);
    }
  };

  const clearAudioTrack = () => {
    setAudioUrl(null);
    setAudioFileName(null);
  };

  // Gerador de roteiro IA personalizado
  const handleGenerateAiCustomScript = () => {
    setIsGeneratingAiScript(true);
    setTimeout(() => {
      setIsGeneratingAiScript(false);
    }, 900);
  };

  // URL real do sistema com parâmetro de embed
  const liveSystemPageUrl = `/vallor${activeFunction.route}?embed=true`;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#030611] text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Iniciando VALLOR Motion Studio...</span>
        </div>
      </div>
    );
  }

  // Agrupamento do catálogo pelas categorias oficiais
  const categoriesList: SystemCategory[] = [
    "OPERAÇÃO / ATENDIMENTO",
    "MARKETING & AGÊNCIA",
    "CHAT DA EQUIPE",
    "FUNIL COMERCIAL (CRM)"
  ];

  // Cálculo da perspectiva 3D de acordo com o estilo selecionado (SysJuros vs MotionLoved)
  const getContainer3dStyle = () => {
    if (motionStyle === "sysjuros_3d") {
      // Estilo SysJuros (@gustaf.design): 3D flutuante dinâmico com perspectiva acentuada
      return {
        transform:
          currentScene.id === 1
            ? "perspective(1200px) rotateX(16deg) rotateY(-12deg) rotateZ(1deg) translateY(0px) scale(0.97)"
            : currentScene.id === 2
            ? "perspective(1200px) rotateX(10deg) rotateY(-6deg) rotateZ(0deg) translateY(-8px) scale(1.01)"
            : currentScene.id === 3
            ? "perspective(1200px) rotateX(6deg) rotateY(4deg) rotateZ(-1deg) translateY(-14px) scale(1.03)"
            : "perspective(1200px) rotateX(12deg) rotateY(-8deg) rotateZ(0deg) translateY(0px) scale(1)"
      };
    } else if (motionStyle === "motionloved_studio") {
      // Estilo MotionLoved (@motionloved): dispositivo flutuando suavemente sobre estúdio iluminado
      return {
        transform:
          currentScene.id === 1
            ? "perspective(1400px) rotateX(8deg) rotateY(-18deg) scale(0.95)"
            : currentScene.id === 2
            ? "perspective(1400px) rotateX(4deg) rotateY(0deg) scale(1.02)"
            : currentScene.id === 3
            ? "perspective(1400px) rotateX(6deg) rotateY(16deg) scale(1.02)"
            : "perspective(1400px) rotateX(5deg) rotateY(0deg) scale(1)"
      };
    } else {
      // Estilo Flat Clean: visão frontal direta
      return {
        transform:
          currentScene.id === 3
            ? "scale(1.02) translateY(-6px)"
            : "scale(1) translateY(0px)"
      };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#030611] text-slate-100 select-none overflow-hidden relative font-sans">
      {/* Áudio oculto para narração */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          muted={isMuted}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* ============================================================== */}
      {/* 1. BARRA SUPERIOR DE CONTROLE: SELETOR OFICIAL DE SUBMENUS     */}
      {/* ============================================================== */}
      {!isRecordingMode && (
        <header className="w-full border-b border-[#1E293B] bg-[#0B1224]/95 backdrop-blur px-4 py-2.5 z-30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0055FF]/15 border border-[#0055FF]/40 shadow-sm">
              <Film className="w-4 h-4 text-[#00D2FF]" />
              <span className="text-xs font-black tracking-wider text-[#00D2FF] uppercase">
                VALLOR Motion Studio • Estúdio Oficial
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 hidden xl:inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SISTEMA REAL CONECTADO
            </span>
          </div>

          {/* SELETOR OFICIAL DE FUNÇÃO DO SISTEMA AGRUPADO POR CATEGORIA */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-[#050814] border border-[#1E293B] rounded-lg px-3 py-1.5 shadow-inner">
              <Compass className="w-4 h-4 text-[#00D2FF] shrink-0" />
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">Módulo Real:</span>
              <select
                value={selectedFunctionId}
                onChange={(e) => {
                  setSelectedFunctionId(e.target.value);
                  seekTo(0);
                  setIsPlaying(false);
                }}
                className="bg-transparent text-xs font-bold text-slate-100 outline-none cursor-pointer max-w-[240px] sm:max-w-xs truncate"
              >
                {categoriesList.map((cat) => (
                  <optgroup key={cat} label={`📂 ${cat}`} className="bg-[#0B1224] text-slate-300 font-bold">
                    {VALLOR_SYSTEM_CATALOG.filter((f) => f.category === cat).map((fn) => (
                      <option key={fn.id} value={fn.id} className="bg-[#050814] text-white py-1">
                        {fn.name} • ({fn.badge})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Alternador de Estilo de Motion (SysJuros vs MotionLoved vs Clean) */}
            <div className="flex items-center bg-[#050814] p-0.5 rounded-lg border border-[#1E293B]">
              <button
                type="button"
                onClick={() => setMotionStyle("sysjuros_3d")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  motionStyle === "sysjuros_3d"
                    ? "bg-[#0055FF] text-white font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Estilo SysJuros: 3D Flutuante com Perspectiva e Ganchos"
              >
                <Layers3 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">3D SysJuros</span>
              </button>
              <button
                type="button"
                onClick={() => setMotionStyle("motionloved_studio")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  motionStyle === "motionloved_studio"
                    ? "bg-[#0055FF] text-white font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Estilo MotionLoved: Estúdio com Chão Reflexivo e Luzes"
              >
                <Sparkle className="w-3.5 h-3.5" />
                <span className="hidden md:inline">3D Estúdio</span>
              </button>
              <button
                type="button"
                onClick={() => setMotionStyle("flat_clean")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  motionStyle === "flat_clean"
                    ? "bg-[#0055FF] text-white font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Visão Frontal Direta (Clean)"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Frontal</span>
              </button>
            </div>

            {/* Alternador de Formato: Widescreen 16:9 vs Mobile 9:16 */}
            <div className="flex items-center bg-[#050814] p-0.5 rounded-lg border border-[#1E293B]">
              <button
                type="button"
                onClick={() => setAspectRatio("horizontal")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  aspectRatio === "horizontal"
                    ? "bg-slate-700 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Widescreen 16:9 (Desktop / YouTube / Pitch)"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>16:9</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio("vertical")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  aspectRatio === "vertical"
                    ? "bg-slate-700 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Vertical 9:16 (App Mobile / Reels / Stories)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16</span>
              </button>
            </div>
          </div>

          {/* Botões da Direita: Copiloto de IA, Overlays e Gravação Limpa */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAiDirectorOpen(!isAiDirectorOpen)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAiDirectorOpen
                  ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/50"
                  : "bg-[#050814] border-[#1E293B] text-purple-300 hover:bg-slate-800"
              }`}
              title="Copiloto de IA Roteirista & Diretora de Arte"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Diretora de Arte IA</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOverlays(!showOverlays)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                showOverlays
                  ? "bg-[#0055FF]/20 border-blue-500/40 text-[#00D2FF]"
                  : "bg-[#050814] border-[#1E293B] text-slate-400"
              }`}
              title="Alternar Legendas e Ganchos Cinéticos"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsRecordingMode(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Tela Cheia Limpa para Gravação (OBS / Captura de Vídeo)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Modo Gravação</span>
            </button>
          </div>
        </header>
      )}

      {/* Botão de Escape no Modo Gravação */}
      {isRecordingMode && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRecordingMode(false)}
            className="px-3 py-1.5 rounded-md bg-[#0B1224]/90 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 backdrop-blur shadow-lg hover:text-white cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Sair do Modo Gravação (ESC)</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ÁREA CENTRAL: O PALCO 3D COM A PÁGINA REAL DO SISTEMA      */}
      {/* ============================================================== */}
      <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-[#030611]">
        {/* Glow e Iluminação de Fundo de Estúdio (Estilo MotionLoved) */}
        <div
          className="absolute w-[700px] h-[700px] rounded-full blur-[160px] pointer-events-none transition-colors duration-1000 opacity-25"
          style={{
            backgroundColor: activeFunction.highlightColor
          }}
        />

        {/* Chão Reflexivo de Estúdio (Estilo MotionLoved) */}
        {motionStyle === "motionloved_studio" && (
          <div
            className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none opacity-40"
            style={{
              background: `radial-gradient(ellipse at bottom, ${activeFunction.highlightColor}40 0%, transparent 70%)`
            }}
          />
        )}

        {/* MOLDURA CINEMATOGRÁFICA DO DISPOSITIVO (3D PERSPECTIVA) */}
        <div
          className={`relative transition-all duration-700 flex flex-col justify-between overflow-hidden shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95),0_0_60px_rgba(0,85,255,0.2)] ${
            aspectRatio === "vertical"
              ? "w-[360px] sm:w-[390px] h-[590px] sm:h-[630px] rounded-[48px] border-[7px] border-[#252E42] bg-[#050814]"
              : "w-full max-w-[960px] aspect-video max-h-[530px] rounded-2xl border-2 border-[#1E293B] bg-[#050814]"
          }`}
          style={getContainer3dStyle()}
        >
          {/* BARRA DE STATUS DO SMARTPHONE (No modo Mobile 9:16) */}
          {aspectRatio === "vertical" && (
            <div className="w-full pt-3 px-6 pb-2 flex items-center justify-between z-30 select-none text-[11px] font-semibold text-slate-300 shrink-0 bg-[#050814]/90 backdrop-blur border-b border-slate-800/60">
              <span>09:41</span>
              {/* Dynamic Island / Notch */}
              <div className="w-24 h-4.5 rounded-full bg-black border border-slate-800 flex items-center justify-end px-2 gap-1.5 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-500/90" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/90" />
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                <span>5G</span>
                <span className="w-4 h-2 rounded border border-slate-400 p-0.5 flex items-center">
                  <span className="w-full h-full bg-slate-300 rounded-xs" />
                </span>
              </div>
            </div>
          )}

          {/* BARRA SUPERIOR DO DISPOSITIVO WIDESCREEN (No modo Desktop 16:9) */}
          {aspectRatio === "horizontal" && (
            <div className="w-full py-2 px-3 bg-[#0B1224] border-b border-slate-800 flex items-center justify-between text-[11px] z-30 select-none shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-1.5 bg-[#050814] px-2.5 py-0.5 rounded-md border border-slate-800">
                  <span className="text-emerald-400 font-mono text-[9px]">HTTPS</span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    https://app.vallor.com.br{activeFunction.route}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-sm"
                  style={{
                    backgroundColor: `${activeFunction.highlightColor}20`,
                    borderColor: `${activeFunction.highlightColor}60`,
                    color: activeFunction.highlightColor
                  }}
                >
                  {activeFunction.badge}
                </span>
              </div>
            </div>
          )}

          {/* CONTAINER DA PÁGINA REAL DO SISTEMA (RENDERIZADO AO VIVO) */}
          <div className="relative w-full flex-1 overflow-hidden bg-slate-950 flex flex-col items-center justify-center">
            {/* O IFRAME DA PÁGINA REAL */}
            <iframe
              key={`system-live-${activeFunction.id}-${aspectRatio}`}
              src={liveSystemPageUrl}
              title={activeFunction.name}
              className="w-full h-full border-0 pointer-events-auto"
            />

            {/* OVERLAY CINÉTICO DE MOTION DESIGN (ESTILO SYSJUROS / GUSTAF DESIGN) */}
            {showOverlays && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
                {/* 1. TÍTULO CINÉTICO SUPERIOR (GANCHO COMERCIAL DE ALTO IMPACTO) */}
                <motion.div
                  key={`headline-${currentScene.id}`}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45 }}
                  className="self-start max-w-sm sm:max-w-md p-3.5 rounded-xl bg-black/85 backdrop-blur-md border border-slate-700/80 shadow-2xl"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="w-2 h-2 rounded-full animate-ping"
                      style={{ backgroundColor: activeFunction.highlightColor }}
                    />
                    <span
                      className="text-[10px] font-bold font-mono uppercase tracking-wider"
                      style={{ color: activeFunction.highlightColor }}
                    >
                      {currentScene.badge}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                    {currentScene.overlayHeadline}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {currentScene.overlaySubline}
                  </p>
                </motion.div>

                {/* 2. CHIP FLUTUANTE DE MÉTRICA / KPI (ESTILO SYSJUROS) */}
                {currentScene.floatingStat && (
                  <motion.div
                    key={`stat-${currentScene.id}`}
                    initial={{ opacity: 0, x: 25 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="self-end px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-md border border-slate-700 shadow-xl flex items-center gap-2"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {currentScene.floatingStat.label}:
                    </span>
                    <span
                      className="text-xs font-black font-mono"
                      style={{ color: currentScene.floatingStat.color }}
                    >
                      {currentScene.floatingStat.value}
                    </span>
                  </motion.div>
                )}

                {/* 3. CURSOR ANIMADO SIMULANDO CLIQUE DO CORRETOR NA CENA 3 */}
                {showLiveCursor && currentScene.id === 3 && (
                  <motion.div
                    initial={{ x: 80, y: 140, opacity: 0 }}
                    animate={{ x: 190, y: 50, opacity: 1 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="absolute pointer-events-none z-30"
                  >
                    <MousePointer className="w-6 h-6 text-white fill-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]" />
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ delay: 0.9, duration: 0.6 }}
                      className="absolute -top-1 -left-1 w-8 h-8 rounded-full border-2 border-[#00D2FF] bg-[#0055FF]/30 pointer-events-none"
                    />
                  </motion.div>
                )}

                {/* 4. BOTÃO CTA BRILHANTE / FECHAMENTO DA CENA (ESTILO SYSJUROS) */}
                <div className="self-center flex flex-col items-center gap-2">
                  {currentScene.id === 4 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="p-4 rounded-2xl bg-black/95 backdrop-blur-md border-2 border-[#0055FF] shadow-2xl flex flex-col items-center gap-2.5 text-center max-w-xs"
                    >
                      <img src="/vallor/Logo_valor_02.svg" alt="VALLOR" className="h-8 w-auto" />
                      <h4 className="text-xs font-extrabold text-white">
                        Pronto para acelerar a sua operação?
                      </h4>
                      <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0055FF] to-[#00D2FF] text-white font-black text-xs shadow-lg shadow-blue-500/40">
                        {currentScene.ctaText || "Agende uma Demonstração"}
                      </div>
                    </motion.div>
                  ) : (
                    currentScene.ctaText && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-3.5 py-1.5 rounded-lg bg-black/85 backdrop-blur border border-slate-700/80 shadow-lg flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-bold text-white tracking-wide">
                          {currentScene.ctaText}
                        </span>
                      </motion.div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* PAINEL LATERAL: IA DIRETORA DE ARTE & ROTEIRISTA DO VALLOR     */}
        {/* ============================================================== */}
        {isAiDirectorOpen && !isRecordingMode && (
          <aside className="absolute right-4 top-4 bottom-4 w-80 sm:w-88 bg-[#0B1224]/95 border border-[#1E293B] rounded-2xl shadow-2xl p-4 backdrop-blur-md z-40 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      IA Diretora de Arte VALLOR
                    </h3>
                    <p className="text-[10px] text-slate-400">Roteiros & Direção Visual</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiDirectorOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Informações da Função Real Selecionada */}
              <div className="p-2.5 rounded-xl bg-[#050814] border border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Função Oficial:
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {activeFunction.category}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{activeFunction.name}</span>
                </h4>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {activeFunction.whatItDoes}
                </p>
              </div>

              {/* Seletor de Público Alvo da Narração */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Público Alvo do Vídeo:
                </label>
                <select
                  value={aiTargetAudience}
                  onChange={(e) => setAiTargetAudience(e.target.value)}
                  className="w-full bg-[#050814] border border-slate-800 rounded-lg p-2 text-xs font-medium text-slate-200 outline-none cursor-pointer"
                >
                  <option value="b2b_diretoria">Diretores Comerciais & CEOs B2B</option>
                  <option value="agro_fazendas">Produtores & Corretores do Agro</option>
                  <option value="agencias_marketing">Donos de Agências de Marketing</option>
                  <option value="vendedores_campo">Equipes & Vendedores de Campo</option>
                </select>
              </div>

              {/* Teleprompter da Cena Ativa */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Teleprompter da Cena {currentScene.id} / 4:
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {currentScene.startTime}s - {currentScene.endTime}s
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs text-purple-100 font-medium leading-relaxed italic shadow-inner">
                  &ldquo;{currentScene.teleprompter}&rdquo;
                </div>
              </div>

              {/* Prompt Customizado para a IA Diretora de Arte */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Personalizar Gancho / Instrução de Arte:
                </label>
                <textarea
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  placeholder="Ex: Focar na agilidade do WhatsApp para diretores que têm mais de 10 vendedores..."
                  rows={2}
                  className="w-full bg-[#050814] border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-600 outline-none resize-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleGenerateAiCustomScript}
                  disabled={isGeneratingAiScript}
                  className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAiScript ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>Regerar Roteiro com a IA</span>
                </button>
              </div>
            </div>

            {/* Rodapé do Painel IA: Pitch Comercial */}
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Gancho Comercial Central:
              </span>
              <p className="text-[11px] text-slate-300 leading-snug">
                {activeFunction.commercialPitch}
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. BARRA INFERIOR DE REPRODUÇÃO & TIMELINE (SEMPRE ANCORADA)   */}
      {/* ============================================================== */}
      {!isRecordingMode && (
        <footer className="w-full border-t border-[#1E293B] bg-[#0B1224] px-4 py-2.5 z-40 flex flex-col gap-2 shrink-0">
          {/* Scrubber da Linha do Tempo */}
          <div className="relative w-full flex items-center group">
            <div
              className="relative w-full h-2.5 bg-slate-900 rounded-full cursor-pointer overflow-hidden border border-slate-800"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                seekTo(ratio * activeFunction.defaultDuration);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-[#0055FF] via-[#00D2FF] to-emerald-400 transition-all duration-75"
                style={{
                  width: `${(currentTime / activeFunction.defaultDuration) * 100}%`
                }}
              />
              {activeFunction.scenes.map((sc) => (
                <div
                  key={sc.id}
                  className="absolute top-0 bottom-0 w-[1px] bg-slate-700 pointer-events-none"
                  style={{
                    left: `${(sc.startTime / activeFunction.defaultDuration) * 100}%`
                  }}
                  title={sc.title}
                />
              ))}
            </div>

            <div
              className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md border-2 border-[#0055FF] pointer-events-none -ml-1.5"
              style={{
                left: `${(currentTime / activeFunction.defaultDuration) * 100}%`
              }}
            />
          </div>

          {/* Controles de Play, Scrubber, Pular Cena, Velocidade */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestart}
                className="p-1.5 rounded-lg bg-[#050814] border border-[#1E293B] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Voltar ao Início"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="px-4 py-1.5 rounded-lg bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/40 transition-all cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Reproduzir Motion</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const prev = [...activeFunction.scenes]
                      .reverse()
                      .find((s) => s.startTime < currentTime - 0.5);
                    seekTo(prev ? prev.startTime : 0);
                  }}
                  className="p-1.5 rounded-lg bg-[#050814] border border-[#1E293B] text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Cena Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = activeFunction.scenes.find(
                      (s) => s.startTime > currentTime + 0.1
                    );
                    if (next) seekTo(next.startTime);
                  }}
                  className="p-1.5 rounded-lg bg-[#050814] border border-[#1E293B] text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Próxima Cena"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="px-2.5 py-1 rounded-md bg-[#050814] border border-[#1E293B] text-xs font-mono">
                <span className="text-[#00D2FF] font-bold">{formatTime(currentTime)}</span>
                <span className="text-slate-500 mx-1">/</span>
                <span className="text-slate-400">{formatTime(activeFunction.defaultDuration)}</span>
              </div>
            </div>

            {/* Centro: Nome da Cena Ativa */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <span className="text-slate-500">Ato Atual:</span>
              <span className="font-bold text-slate-100">{currentScene.title}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded border font-mono font-bold"
                style={{
                  backgroundColor: `${activeFunction.highlightColor}20`,
                  borderColor: `${activeFunction.highlightColor}40`,
                  color: activeFunction.highlightColor
                }}
              >
                {currentScene.badge}
              </span>
            </div>

            {/* Direita: Subir Áudio e Velocidade */}
            <div className="flex items-center gap-2">
              <label
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#050814] hover:bg-slate-800 border border-[#1E293B] text-slate-300 text-xs font-medium cursor-pointer"
                title="Carregar arquivo de locução humana"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Upload Áudio</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </label>

              {audioUrl && (
                <button
                  type="button"
                  onClick={clearAudioTrack}
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-red-400 border border-slate-800 cursor-pointer"
                  title="Remover áudio carregado"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="flex items-center bg-[#050814] rounded-lg border border-[#1E293B] p-0.5 text-xs font-mono">
                {[1.0, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      playbackSpeed === spd
                        ? "bg-[#0055FF] text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
