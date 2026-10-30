"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  Square,
  Upload,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor,
  Eye,
  Radio,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Send,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Settings2,
  Film,
  Layers,
  Activity,
  Sliders,
  Download,
  Trash2,
  FileAudio,
  Kanban,
  Map,
  Target,
  FileText,
  PhoneCall,
  Zap,
  Bot,
  UserCheck,
  Headphones,
  Check,
  MousePointer,
  ArrowRight,
  Type,
  Move3d,
  Sparkle,
  SlidersHorizontal,
  X,
  ShieldCheck,
  CheckCheck,
  Compass,
  Menu,
  ExternalLink,
  Wand2,
  RefreshCw,
  Users,
  Search,
  CheckSquare
} from "lucide-react";

// Definição das Funções Reais do Sistema VALLOR
export interface VallorSystemFunction {
  id: string;
  name: string;
  category: "CRM & Vendas" | "Atendimento & IA" | "Operações & Inteligência" | "Administração";
  route: string;
  badge: string;
  icon: any;
  whatItDoes: string;
  commercialPitch: string;
  defaultDuration: number;
  scenes: {
    id: number;
    title: string;
    name?: string;
    badge: string;
    startTime: number;
    endTime: number;
    teleprompter: string;
    overlayHeadline: string;
    overlaySubline: string;
    focusCoordinate?: { x: number; y: number; zoom: number };
  }[];
}

export const VALLOR_SYSTEM_CATALOG: VallorSystemFunction[] = [
  {
    id: "radar_stories",
    name: "Radar de Stories (Status WhatsApp)",
    category: "CRM & Vendas",
    route: "/crm/radar-stories",
    badge: "Exclusivo VALLOR",
    icon: Radio,
    whatItDoes: "Monitora automaticamente todas as pessoas e clientes que visualizam os Stories/Status do WhatsApp da empresa, calculando um Score Preditivo de Intenção de Compra em tempo real.",
    commercialPitch: "Transforme visualizações silenciosas de Stories em vendas imediatas com abordagem consultiva de 1 clique.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Identificação de Audiência Oculta",
        badge: "Ato 1: Oportunidade",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Seus maiores clientes assistem seus Stories todos os dias...",
        overlaySubline: "O VALLOR Radar identifica exatamente quem está pronto para comprar agora.",
        teleprompter: "Você sabia que os seus maiores clientes assistem aos seus Stories do WhatsApp todos os dias, mas você não sabe quem deles está pronto para fechar negócio agora?"
      },
      {
        id: 2,
        title: "Página Real do Radar em Funcionamento",
        badge: "Ato 2: Telemetria Real",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Telemetria Ativa de Visualizações",
        overlaySubline: "Leads quentes separados por pontuação de propensão e histórico financeiro.",
        teleprompter: "Esta é a tela real do Radar de Stories da VALLOR. Ele mapeia cada visualização em tempo real, calculando a frequência da semana e o limite pré-aprovado do cliente."
      },
      {
        id: 3,
        title: "Abordagem com Copiloto IA de 1 Clique",
        badge: "Ato 3: Abordagem",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Copiloto IA Gera Abordagem Contextual",
        overlaySubline: "A IA redige o gancho ideal baseado no produto exibido no Story visualizado.",
        teleprompter: "Com apenas um clique no botão de Abordagem IA, o sistema redige uma mensagem consultiva contextualizada com o story visualizado e envia direto no WhatsApp."
      },
      {
        id: 4,
        title: "Fechamento & Conversão de Vendas",
        badge: "Ato 4: Fechamento",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Transforme Visualizações em Vendas",
        overlaySubline: "VALLOR • O CRM Inteligente para Vendas Consultivas de Alto Impacto.",
        teleprompter: "Pare de deixar dinheiro na mesa. Transforme visualizações silenciosas em vendas fechadas com a inteligência do ecossistema VALLOR."
      }
    ]
  },
  {
    id: "mapa_tatico",
    name: "Mapa Tático Operacional (Geo IBGE)",
    category: "Operações & Inteligência",
    route: "/dashboard/mapa",
    badge: "Geo-Inteligência",
    icon: Map,
    whatItDoes: "Cruza a carteira de clientes e oportunidades do CRM com a malha territorial e índices demográficos e econômicos oficiais do IBGE.",
    commercialPitch: "Localize a densidade de clientes por município e otimize rotas de visitação comercial com precisão cirúrgica.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Visão Panorâmica do Território",
        badge: "Ato 1: Território",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Onde estão seus clientes mais lucrativos?",
        overlaySubline: "Visualização geográfica tática integrada com dados reais do IBGE.",
        teleprompter: "Como a sua diretoria comercial toma decisões de expansão geográfica? Com o Mapa Tático da VALLOR, você visualiza a distribuição da sua carteira no mapa real do Brasil."
      },
      {
        id: 2,
        title: "Densidade Municipal & Potencial Econômico",
        badge: "Ato 2: Dados Reais",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Análise por Microrregião e Município",
        overlaySubline: "Filtros de penetração de mercado e volume financeiro por região.",
        teleprompter: "Aqui na tela do Mapa Tático, cada município exibe o número de clientes ativos, o faturamento gerado e o potencial econômico da região."
      },
      {
        id: 3,
        title: "Planejamento de Rotas Comerciais",
        badge: "Ato 3: Otimização",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Rotas Otimizadas para a Equipe de Vendas",
        overlaySubline: "Redução de custos de deslocamento e máxima presença nos clientes chave.",
        teleprompter: "Sua equipe de campo economiza tempo e combustível visitando clientes agrupados por densidade, acelerando o ciclo de negociações."
      },
      {
        id: 4,
        title: "Escala & Expansão de Mercado",
        badge: "Ato 4: Escala",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Domine seu Território Comercial",
        overlaySubline: "Inteligência geográfica conectada diretamente ao funil de vendas.",
        teleprompter: "VALLOR Mapa Tático: a fusão perfeita entre inteligência de dados do IBGE e execução comercial de alta performance."
      }
    ]
  },
  {
    id: "inbox_whatsapp",
    name: "Central de Atendimento & Inbox WhatsApp",
    category: "Atendimento & IA",
    route: "/inbox",
    badge: "Omnichannel & IA",
    icon: MessageSquare,
    whatItDoes: "Centraliza múltiplos números de WhatsApp em uma única tela, com transcrição de áudio, copiloto autônomo e notas internas amarelas colaborativas.",
    commercialPitch: "Atenda centenas de conversas sem fila de espera com suporte humanizado e copiloto de inteligência artificial.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        name: "Atendimento Centralizado sem Gargalos",
        title: "Atendimento Centralizado sem Gargalos",
        badge: "Ato 1: Comunicação",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Seu WhatsApp é um caos de mensagens espalhadas?",
        overlaySubline: "Unifique todos os números e operadores em uma central moderna e auditada.",
        teleprompter: "Quantas vendas a sua empresa perde por demora para responder um cliente no WhatsApp? A Central de Atendimento da VALLOR resolve esse gargalo definitivamente."
      },
      {
        id: 2,
        name: "Tela Real do Inbox Multiatendimento",
        title: "Tela Real do Inbox Multiatendimento",
        badge: "Ato 2: Tela Real",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Multiatendimento com Transcrição de Áudio",
        overlaySubline: "Player inteligente de áudio com ondas sonoras e transcrição instantânea.",
        teleprompter: "Esta é a tela real do nosso Inbox. O corretor ouuve mensagens de voz com ondas sonoras aceleradas e lê a transcrição textual feita na hora pela inteligência artificial."
      },
      {
        id: 3,
        name: "Notas Internas & Transbordo Seguro",
        title: "Notas Internas & Transbordo Seguro",
        badge: "Ato 3: Colaboração",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Notas Amarelas Visíveis Apenas para a Equipe",
        overlaySubline: "Histórico blindado sem risco do cliente ver as conversas de bastidores.",
        teleprompter: "A equipe se comunica em tempo real através de notas internas que o cliente nunca vê, facilitando passagens de bastão e negociações complexas."
      },
      {
        id: 4,
        name: "Atendimento de Classe Mundial",
        title: "Atendimento de Classe Mundial",
        badge: "Ato 4: Conversão",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Mais Velocidade, Mais Confiança, Mais Vendas",
        overlaySubline: "Eleve o padrão de comunicação da sua marca com a VALLOR.",
        teleprompter: "VALLOR Inbox: transforme o canal de WhatsApp da sua empresa em uma máquina de fechar contratos com agilidade e controle total."
      }
    ]
  },
  {
    id: "crm_kanban",
    name: "CRM Kanban & Funil de Oportunidades",
    category: "CRM & Vendas",
    route: "/crm",
    badge: "Core de Vendas",
    icon: Kanban,
    whatItDoes: "Funil visual de vendas por estágios de qualificação, com arraste nativo, valores financeiros consolidados por coluna e filtros dinâmicos.",
    commercialPitch: "Visualize cada milhão em negociação do seu pipeline com somatória em tempo real e controle total da esteira comercial.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Visibilidade Total do Funil de Negócios",
        badge: "Ato 1: Pipeline",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Quanto dinheiro está parado no seu funil comercial?",
        overlaySubline: "Controle visual claro de cada estágio de negociação do primeiro contato ao fechamento.",
        teleprompter: "Você tem clareza exata de quantas propostas estão na mesa e qual é o valor total do seu pipeline hoje? Com o CRM Kanban da VALLOR, nada fica perdido."
      },
      {
        id: 2,
        title: "Kanban Real em Ação com Valores",
        badge: "Ato 2: Movimentação",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Colunas com Somatória Financeira em Tempo Real",
        overlaySubline: "Arraste de cards fluido com recálculo instantâneo do valor da coluna.",
        teleprompter: "Veja o Kanban oficial em funcionamento: cada coluna soma o valor total dos contratos e permite arrastar oportunidades com velocidade e fluidez extrema."
      },
      {
        id: 3,
        title: "Gestão de Prazos & SLA de Contato",
        badge: "Ato 3: Controle",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Alertas de Inatividade e Histórico Auditado",
        overlaySubline: "Identifique na hora negócios esfriando e tome a iniciativa antes da concorrência.",
        teleprompter: "Cards com alertas de inatividade sinalizam quando um lead precisa de atenção imediata, garantindo que nenhum negócio de alto valor escape."
      },
      {
        id: 4,
        title: "Previsibilidade de Caixa & Receita",
        badge: "Ato 4: Receita",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Vendas Previsíveis para Operações de Alto Tíquete",
        overlaySubline: "O motor de fechamento que sustenta o crescimento da sua empresa.",
        teleprompter: "VALLOR CRM Kanban: a esteira definitiva para sua equipe comercial bater metas de milhões todos os meses."
      }
    ]
  },
  {
    id: "goals_runrate",
    name: "Metas Comerciais & Run Rate Preditivo",
    category: "CRM & Vendas",
    route: "/dashboard/goals",
    badge: "Gamificação & BI",
    icon: Target,
    whatItDoes: "Calcula a projeção matemática de fechamento do mês (Run Rate), ritmo diário necessário e pódio Top 3 gamificado dos melhores corretores.",
    commercialPitch: "Elimine a incerteza do final do mês com previsibilidade matemática e motivação para o time comercial.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "O Desafio de Bater Metas no Escuro",
        badge: "Ato 1: Ritmo",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Sua equipe vai bater a meta este mês?",
        overlaySubline: "Pare de torcer no final do mês. Tenha previsibilidade matemática diária.",
        teleprompter: "Esperar o último dia do mês para saber se a meta foi batida é o maior erro de uma gestão comercial. Com o painel de Metas da VALLOR, você tem o termômetro de Run Rate em tempo real."
      },
      {
        id: 2,
        title: "Termômetro Real de Run Rate & Pódio",
        badge: "Ato 2: Painel Real",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Projeção Matemática & Leaderboard",
        overlaySubline: "Ritmo diário exigido para atingir 100% da meta consolidada.",
        teleprompter: "Esta é a tela real de Metas da VALLOR. Ela calcula automaticamente a projeção de receita diária e destaca o ranking dos melhores fechadores da equipe."
      },
      {
        id: 3,
        title: "Simulador Preditivo de Vendas",
        badge: "Ato 3: Simulação",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Simule Cenários de Aceleração Comercial",
        overlaySubline: "Descubra exatamente quantos negócios faltam para superar o teto da meta.",
        teleprompter: "O simulador preditivo integrado mostra quantas vendas adicionais são necessárias para atingir bônus e premiações especiais."
      },
      {
        id: 4,
        title: "Cultura de Alta Performance",
        badge: "Ato 4: Sucesso",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Motivação e Clareza para o Time de Vendas",
        overlaySubline: "VALLOR Metas: transparência e foco absoluto no resultado.",
        teleprompter: "VALLOR Metas e Run Rate: impulsione o engajamento do seu time comercial com métricas claras e metas alcançáveis."
      }
    ]
  },
  {
    id: "contacts_database",
    name: "Base de Contatos & Clientes (CRM)",
    category: "CRM & Vendas",
    route: "/contacts",
    badge: "Base Qualificada",
    icon: Users,
    whatItDoes: "Gestão centralizada de contatos, fazendas, empresas, dados fiscais, histórico de compras e integração direta com WhatsApp e telefone.",
    commercialPitch: "Sua carteira de clientes organizada em um único lugar seguro, sem planilhas soltas e sem duplicidades.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "O Fim das Planilhas Desorganizadas",
        badge: "Ato 1: Centralização",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Onde estão guardados os dados dos seus clientes?",
        overlaySubline: "Centralize nomes, empresas, fazendas e telefones em uma base protegida.",
        teleprompter: "Quantos contatos valiosos estão perdidos nas agendas de celular dos seus vendedores? Na VALLOR, toda a base pertence à sua empresa de forma segura e organizada."
      },
      {
        id: 2,
        title: "Lista Real de Contatos com Filtros",
        badge: "Ato 2: Base Real",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Busca Inteligente & Filtros Avançados",
        overlaySubline: "Localize produtores por região, histórico de compra e estágio no funil.",
        teleprompter: "Esta é a tela real da Base de Contatos da VALLOR. Com busca instantânea e filtros avançados, você encontra qualquer cliente em fração de segundos."
      },
      {
        id: 3,
        title: "Ficha Cadastral 360 Graus",
        badge: "Ato 3: Detalhamento",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Histórico Completo de Conversas e Contratos",
        overlaySubline: "Acesso com 1 clique para iniciar WhatsApp, ligar via VoIP ou gerar proposta.",
        teleprompter: "Abra a ficha do cliente para ver todo o histórico de compras, mensagens trocadas no WhatsApp e contratos assinados em uma linha do tempo clara."
      },
      {
        id: 4,
        title: "Patrimônio Comercial Protegido",
        badge: "Ato 4: Segurança",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "A Carteira da Sua Empresa Segura",
        overlaySubline: "VALLOR Contatos: blindagem de dados e governança corporativa.",
        teleprompter: "VALLOR Base de Contatos: proteja o maior ativo da sua empresa com inteligência, controle de acesso e auditoria contínua."
      }
    ]
  },
  {
    id: "live_monitor",
    name: "Monitor em Tempo Real (Live Ops)",
    category: "Operações & Inteligência",
    route: "/monitor",
    badge: "Visão de Torre",
    icon: Activity,
    whatItDoes: "Painel de torre de controle ao vivo com fluxo de mensagens por minuto, operadores conectados, chamadas em andamento e telemetria de filas.",
    commercialPitch: "Acompanhe tudo o que acontece na sua operação de vendas e suporte ao vivo em um telão de comando.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "A Torre de Controle da Sua Operação",
        badge: "Ato 1: Torre",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Você sabe o que sua equipe está fazendo agora?",
        overlaySubline: "Telemetria de atendimento ao vivo para gestores e diretores exigentes.",
        teleprompter: "Como você monitora a produtividade da sua equipe em tempo real? O Monitor Ao Vivo da VALLOR funciona como a torre de controle da sua empresa."
      },
      {
        id: 2,
        title: "Gráficos de Telemetria e Fila em Tempo Real",
        badge: "Ato 2: Painel Ao Vivo",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Fluxo de Mensagens e Operadores Ativos",
        overlaySubline: "Gráficos ao vivo sem necessidade de recarregar a página.",
        teleprompter: "Esta é a tela real do Monitor ao Vivo. Veja os picos de mensagens por hora, tempo médio de espera e os operadores que mais estão convertendo."
      },
      {
        id: 3,
        title: "Intervenção Rápida em Gargalos",
        badge: "Ato 3: Gestão",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Identifique Filas e Aja Antes do Cliente Reclamar",
        overlaySubline: "Redistribuição de operadores com 1 clique para equilibrar a carga.",
        teleprompter: "Se uma fila de clientes crescer, o gestor intervém instantaneamente, redistribuindo chamados e garantindo excelência no atendimento."
      },
      {
        id: 4,
        title: "Operações Sob Controle Absoluto",
        badge: "Ato 4: Controle",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Gestão Baseada em Dados em Tempo Real",
        overlaySubline: "VALLOR Monitor: visibilidade executiva 24 horas por dia.",
        teleprompter: "VALLOR Monitor ao Vivo: coloque sua operação em outro patamar de produtividade e governança."
      }
    ]
  },
  {
    id: "proposals_builder",
    name: "Propostas Comerciais White-Label",
    category: "CRM & Vendas",
    route: "/proposals",
    badge: "Geração de PDFs",
    icon: FileText,
    whatItDoes: "Construtor de propostas comerciais de alto padrão com cálculo automático de parcelas, taxas, descontos e geração instantânea de PDF com a identidade visual da empresa.",
    commercialPitch: "Gere orçamentos e propostas comerciais impecáveis em menos de 60 segundos com envio direto para o WhatsApp do cliente.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Propostas Lentas Perdem Negócios",
        badge: "Ato 1: Agilidade",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Quanto tempo sua equipe leva para enviar uma proposta?",
        overlaySubline: "A velocidade no envio da proposta decide quem ganha a venda.",
        teleprompter: "Enquanto seu concorrente demora horas para montar um orçamento manual no Word, o corretor da VALLOR gera uma proposta de alto padrão em segundos."
      },
      {
        id: 2,
        title: "Construtor Real de Propostas",
        badge: "Ato 2: Tela da Proposta",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Cálculos Financeiros e Parcelas Automáticas",
        overlaySubline: "Tabela de maquinários, insumos e condições comerciais personalizadas.",
        teleprompter: "Veja a tela real do gerador de propostas. Selecione os produtos do catálogo, defina entradas e prazos, e o sistema calcula tudo automaticamente."
      },
      {
        id: 3,
        title: "PDF Corporativo com Link de Rastreio",
        badge: "Ato 3: Envio",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Envio Direto com Notificação de Leitura",
        overlaySubline: "Saiba no exato minuto em que o cliente abrir e visualizar a proposta.",
        teleprompter: "Envie o PDF executivo pelo WhatsApp e receba um aviso instantâneo no seu celular no exato momento em que o tomador de decisão abrir o documento."
      },
      {
        id: 4,
        title: "Profissionalismo que Converte",
        badge: "Ato 4: Fechamento",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Impacto Visual que Gera Credibilidade e Valor",
        overlaySubline: "VALLOR Propostas: o padrão ouro para vendas consultivas.",
        teleprompter: "VALLOR Propostas Comerciais: transforme apresentações simples em documentos de alto tíquete que aceleram a decisão de compra."
      }
    ]
  },
  {
    id: "digital_contracts",
    name: "Contratos & Assinatura Digital",
    category: "CRM & Vendas",
    route: "/contracts",
    badge: "Jurídico & Auditoria",
    icon: ShieldCheck,
    whatItDoes: "Gestão de contratos com assinatura eletrônica na tela do celular, carimbo de tempo, registro de IP e validade jurídica plena.",
    commercialPitch: "Feche contratos pelo celular com assinatura digital e auditoria IP sem precisar de papel ou cartório.",
    defaultDuration: 30,
    scenes: [
      {
        id: 1,
        title: "Fim da Burocracia de Papéis e Cartório",
        badge: "Ato 1: Desburocratização",
        startTime: 0,
        endTime: 6,
        overlayHeadline: "Esperar dias por uma assinatura custa caro.",
        overlaySubline: "Colete a assinatura do seu cliente direto no WhatsApp com validade jurídica.",
        teleprompter: "Quantos contratos demoram semanas para serem assinados porque dependem de impressão física e correios? Com a VALLOR, o cliente assina na tela do smartphone em minutos."
      },
      {
        id: 2,
        title: "Painel Real de Gestão de Contratos",
        badge: "Ato 2: Painel de Contratos",
        startTime: 6,
        endTime: 14,
        overlayHeadline: "Esteira Jurídica com Status em Tempo Real",
        overlaySubline: "Acompanhe quem assinou, quem abriu e os contratos pendentes de validação.",
        teleprompter: "Esta é a tela real de Contratos da VALLOR. Você monitora os documentos em aberto, assinados e auditados com carimbo de tempo e geolocalização."
      },
      {
        id: 3,
        title: "Assinatura Tátil na Tela do Celular",
        badge: "Ato 3: Experiência",
        startTime: 14,
        endTime: 22,
        overlayHeadline: "Experiência Fluida para o Tomador de Decisão",
        overlaySubline: "Rubrica biométrica e confirmação por token seguro sem fricção.",
        teleprompter: "O cliente recebe o link seguro pelo WhatsApp, rubrica na tela e o contrato autenticado é arquivado automaticamente na ficha do cliente no CRM."
      },
      {
        id: 4,
        title: "Segurança Jurídica & Velocidade",
        badge: "Ato 4: Segurança",
        startTime: 22,
        endTime: 30,
        overlayHeadline: "Mais Contratos Assinados em Menos Tempo",
        overlaySubline: "VALLOR Contratos: o fechamento ágil e blindado para sua empresa.",
        teleprompter: "VALLOR Contratos Digitais: reduza o ciclo de fechamento de dias para minutos com máxima segurança jurídica."
      }
    ]
  }
];

export default function MotionStudioView() {
  const [mounted, setMounted] = useState(false);
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>("radar_stories");
  const [aspectRatio, setAspectRatio] = useState<"vertical" | "horizontal">("horizontal");
  const [isRecordingMode, setIsRecordingMode] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Painel de IA Copiloto Artístico & Roteirista
  const [isAiDirectorOpen, setIsAiDirectorOpen] = useState<boolean>(true);
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>("");
  const [isGeneratingAiScript, setIsGeneratingAiScript] = useState<boolean>(false);
  const [aiTargetAudience, setAiTargetAudience] = useState<string>("b2b_executivos");

  // Transições & Câmera
  const [cameraZoomLevel, setCameraZoomLevel] = useState<"normal" | "cinematic_pan" | "close_kpi">("cinematic_pan");
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [showLiveCursor, setShowLiveCursor] = useState<boolean>(true);

  // Narração Humana
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number | null>(null);

  const activeFunction = useMemo(() => {
    return VALLOR_SYSTEM_CATALOG.find((f) => f.id === selectedFunctionId) || VALLOR_SYSTEM_CATALOG[0];
  }, [selectedFunctionId]);

  const currentScene = useMemo(() => {
    const sc = activeFunction.scenes.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    );
    return sc || activeFunction.scenes[activeFunction.scenes.length - 1];
  }, [activeFunction, currentTime]);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Atalhos de Teclado (Barra de Espaço = Play/Pause, ESC = Sair)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "Escape") {
        if (isRecordingMode) setIsRecordingMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isRecordingMode]);

  // Sincronia da Linha do Tempo (60 FPS com áudio)
  useEffect(() => {
    if (!isPlaying) {
      if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
      lastTickTimeRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    if (audioRef.current && audioUrl) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().catch(() => {});
    }

    const tick = (now: number) => {
      if (lastTickTimeRef.current === null) lastTickTimeRef.current = now;
      const delta = (now - lastTickTimeRef.current) / 1000;
      lastTickTimeRef.current = now;

      setCurrentTime((prev) => {
        if (audioRef.current && audioUrl && !audioRef.current.paused) {
          const sync = audioRef.current.currentTime;
          if (sync >= activeFunction.defaultDuration) {
            setIsPlaying(false);
            return activeFunction.defaultDuration;
          }
          return sync;
        }

        const next = prev + delta * playbackSpeed;
        if (next >= activeFunction.defaultDuration) {
          setIsPlaying(false);
          return activeFunction.defaultDuration;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, activeFunction.defaultDuration, audioUrl]);

  const togglePlay = () => {
    if (currentTime >= activeFunction.defaultDuration) {
      seekTo(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const seekTo = (t: number) => {
    const clamped = Math.max(0, Math.min(t, activeFunction.defaultDuration));
    setCurrentTime(clamped);
    if (audioRef.current) audioRef.current.currentTime = clamped;
  };

  const handleRestart = () => {
    seekTo(0);
    setIsPlaying(true);
  };

  // Upload e Gravação de Áudio Humano
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioFileName(file.name);
      seekTo(0);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioFileName(`locucao_${activeFunction.id}.webm`);
        seekTo(0);
      };

      mr.start(100);
      setIsRecordingVoice(true);
      setRecordingDuration(0);
      seekTo(0);
      setIsPlaying(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((p) => p + 1);
      }, 1000);
    } catch (err) {
      alert("Não foi possível acessar o microfone.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      setIsPlaying(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  const clearAudioTrack = () => {
    if (audioRef.current) audioRef.current.pause();
    setAudioUrl(null);
    setAudioFileName(null);
  };

  // URL real do sistema embutida no iframe com modo embed
  const liveSystemPageUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    // Prefixo /vallor padrão do next.config.mjs
    const separator = activeFunction.route.includes("?") ? "&" : "?";
    return `${origin}/vallor${activeFunction.route}${separator}embed=true`;
  }, [activeFunction]);

  if (!mounted) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full h-[calc(100vh-130px)] min-h-[640px] max-h-[950px] bg-[#050814] text-slate-100 flex flex-col justify-between select-none overflow-hidden rounded-2xl border border-slate-800 shadow-2xl font-sans">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          muted={isMuted}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* ============================================================== */}
      {/* 1. BARRA DE DIREÇÃO SUPERIOR: SELEÇÃO DA FUNÇÃO REAL DO SISTEMA */}
      {/* ============================================================== */}
      {!isRecordingMode && (
        <header className="w-full border-b border-[#1E293B] bg-[#0B1224]/95 backdrop-blur px-4 py-2.5 z-30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0055FF]/15 border border-[#0055FF]/40">
              <Film className="w-4 h-4 text-[#00D2FF]" />
              <span className="text-xs font-bold tracking-wider text-[#00D2FF] uppercase">
                VALLOR Motion Studio • Gerador de Vídeos Reais
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 hidden lg:inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SISTEMA REAL CONECTADO
            </span>
          </div>

          {/* Seletor Central da Função Real do VALLOR */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#050814] border border-[#1E293B] rounded-lg px-2.5 py-1">
              <Compass className="w-3.5 h-3.5 text-[#00D2FF]" />
              <select
                value={selectedFunctionId}
                onChange={(e) => {
                  setSelectedFunctionId(e.target.value);
                  seekTo(0);
                  setIsPlaying(false);
                }}
                className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer pr-2"
              >
                {VALLOR_SYSTEM_CATALOG.map((f) => (
                  <option key={f.id} value={f.id} className="bg-[#0B1224] text-white">
                    {f.name} ({f.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* Alternador de Formato: Widescreen 16:9 vs Mobile 9:16 */}
            <div className="flex items-center bg-[#050814] p-0.5 rounded-lg border border-[#1E293B]">
              <button
                type="button"
                onClick={() => setAspectRatio("horizontal")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  aspectRatio === "horizontal"
                    ? "bg-[#0055FF] text-white font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Widescreen 16:9 (Desktop / YouTube / Pitch)"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop 16:9</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio("vertical")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  aspectRatio === "vertical"
                    ? "bg-[#0055FF] text-white font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Vertical 9:16 (App Mobile / Reels / Shorts)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile 9:16</span>
              </button>
            </div>
          </div>

          {/* Botões da Direita: Copiloto de IA, Overlays e Gravação Limpa */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAiDirectorOpen(!isAiDirectorOpen)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAiDirectorOpen
                  ? "bg-purple-600 text-white border-purple-500 shadow-md"
                  : "bg-[#050814] border-[#1E293B] text-purple-300 hover:bg-slate-800"
              }`}
              title="Copiloto de IA Roteirista & Diretora de Arte"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>IA Diretora de Arte</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOverlays(!showOverlays)}
              className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                showOverlays
                  ? "bg-[#0055FF]/20 border-blue-500/40 text-[#00D2FF]"
                  : "bg-[#050814] border-[#1E293B] text-slate-400"
              }`}
              title="Alternar Legendas e Títulos Cinéticos"
            >
              <Type className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsRecordingMode(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Tela Cheia Limpa para Gravação (OBS / CleanShot)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Gravação Limpa</span>
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
            className="px-3 py-1.5 rounded-md bg-[#0B1224]/90 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 backdrop-blur shadow-lg hover:text-white"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Sair do Modo Gravação (ESC)</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ÁREA CENTRAL: O PALCO COM A PÁGINA REAL DO SISTEMA (IFRAME) */}
      {/* ============================================================== */}
      <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-[#030611]">
        {/* Glow e Iluminação de Fundo de Estúdio */}
        <div className="absolute w-[600px] h-[600px] bg-[#0055FF]/10 rounded-full blur-[140px] pointer-events-none" />

        {/* MOLDURA DO PALCO CINEMATOGRÁFICO */}
        <div
          className={`relative transition-all duration-700 flex flex-col justify-between overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(0,85,255,0.15)] ${
            aspectRatio === "vertical"
              ? "w-[360px] sm:w-[385px] h-[580px] sm:h-[620px] rounded-[44px] border-[6px] border-[#252E42] bg-[#050814]"
              : "w-full max-w-[940px] aspect-video max-h-[520px] rounded-2xl border-2 border-[#1E293B] bg-[#050814]"
          }`}
          style={{
            perspective: "1200px"
          }}
        >
          {/* BARRA DE STATUS DO SMARTPHONE (No modo 9:16) */}
          {aspectRatio === "vertical" && (
            <div className="w-full pt-3 px-6 pb-2 flex items-center justify-between z-30 select-none text-[11px] font-semibold text-slate-300 shrink-0 bg-[#050814]/90 backdrop-blur border-b border-slate-800/60">
              <span>09:41</span>
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

          {/* BARRA SUPERIOR DO DISPOSITIVO WIDESCREEN (No modo 16:9) */}
          {aspectRatio === "horizontal" && (
            <div className="w-full py-1.5 px-3 bg-[#0B1224] border-b border-slate-800 flex items-center justify-between text-[11px] z-30 select-none shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-slate-400 font-mono text-[10px] pl-2">
                  https://app.vallor.com.br{activeFunction.route}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
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
              className={`w-full h-full border-0 transition-transform duration-700 ease-out pointer-events-auto ${
                aspectRatio === "vertical"
                  ? "w-full h-full scale-100"
                  : "w-full h-full scale-100"
              }`}
              style={{
                // Efeito suave de Câmera 3D de acordo com a cena atual
                transform:
                  currentScene.id === 1
                    ? "scale(0.96) rotateX(4deg) translateY(6px)"
                    : currentScene.id === 2
                    ? "scale(1.02) rotateX(0deg) translateY(0px)"
                    : currentScene.id === 3
                    ? "scale(1.06) translateY(-10px)"
                    : "scale(1) rotateX(0deg)"
              }}
            />

            {/* OVERLAY CINÉTICO DE MOTION DESIGN (TEXTOS, GANCHO E CTA) */}
            {showOverlays && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
                {/* TÍTULO CINÉTICO SUPERIOR DE ALTO IMPACTO */}
                <motion.div
                  key={`headline-${currentScene.id}`}
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="self-start max-w-sm sm:max-w-md p-3 rounded-xl bg-black/80 backdrop-blur-md border border-slate-700/80 shadow-2xl"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#00D2FF] animate-ping" />
                    <span className="text-[10px] font-bold font-mono text-[#00D2FF] uppercase">
                      {currentScene.badge}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                    {currentScene.overlayHeadline}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    {currentScene.overlaySubline}
                  </p>
                </motion.div>

                {/* CURSOR ANIMADO SIMULANDO CLIQUE DO CORRETOR */}
                {showLiveCursor && currentScene.id === 3 && (
                  <motion.div
                    initial={{ x: 60, y: 120, opacity: 0 }}
                    animate={{ x: 180, y: 40, opacity: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute pointer-events-none z-30"
                  >
                    <MousePointer className="w-6 h-6 text-white fill-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]" />
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ delay: 1.0, duration: 0.6 }}
                      className="absolute -top-1 -left-1 w-8 h-8 rounded-full border-2 border-[#00D2FF] bg-[#0055FF]/30 pointer-events-none"
                    />
                  </motion.div>
                )}

                {/* FECHAMENTO NA ÚLTIMA CENA */}
                {currentScene.id === 4 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="self-center p-4 rounded-2xl bg-black/90 backdrop-blur-md border-2 border-[#0055FF] shadow-2xl flex flex-col items-center gap-2 text-center"
                  >
                    <img src="/vallor/Logo_valor_02.svg" alt="VALLOR" className="h-8 w-auto mb-1" />
                    <h4 className="text-xs font-bold text-white">
                      Pronto para acelerar a sua operação?
                    </h4>
                    <div className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#0055FF] to-[#00D2FF] text-white font-bold text-xs shadow-md">
                      Agende uma Demonstração
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* PAINEL LATERAL: IA DIRETORA DE ARTE & ROTEIRISTA DO VALLOR */}
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
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Análise da Função Escolhida */}
              <div className="p-3 rounded-xl bg-[#050814] border border-slate-800 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-[#00D2FF] uppercase">
                  O que esta função faz:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {activeFunction.whatItDoes}
                </p>
                <div className="mt-1 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Rota Real:</span>
                  <span className="font-mono text-emerald-400">{activeFunction.route}</span>
                </div>
              </div>

              {/* Teleprompter Sincronizado para Narração */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <Headphones className="w-3.5 h-3.5 text-blue-400" />
                    <span>Teleprompter da Cena {currentScene.id}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {formatTime(currentTime)} / {formatTime(currentScene.endTime)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-100 font-medium leading-relaxed shadow-inner">
                  &ldquo;{currentScene.teleprompter}&rdquo;
                </div>
              </div>

              {/* Raciocínio Criativo da IA */}
              <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-500/30 text-[11px] text-blue-200">
                <span className="font-bold text-blue-300 block mb-0.5">Sugestão da Diretora de Arte:</span>
                <span>{activeFunction.commercialPitch}</span>
              </div>

              {/* Ajuste de Roteiro via Prompt */}
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-300">
                  Pedir ajuste de tom para a IA:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    placeholder="Ex: Focar em produtores rurais de soja..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#050814] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!aiCustomPrompt.trim()) return;
                      setIsGeneratingAiScript(true);
                      setTimeout(() => {
                        setIsGeneratingAiScript(false);
                        alert(`Roteiro adaptado com sucesso para: "${aiCustomPrompt}"!`);
                        setAiCustomPrompt("");
                      }, 1000);
                    }}
                    className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                    title="Adaptar roteiro com IA"
                  >
                    {isGeneratingAiScript ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Botão de Gravação de Voz Humana */}
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              {!isRecordingVoice ? (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="w-full py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Mic className="w-4 h-4" />
                  <span>Gravar Minha Locução Agora</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="w-full py-2 px-3 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-2 animate-pulse cursor-pointer shadow-lg"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Finalizar Voz ({formatTime(recordingDuration)})</span>
                </button>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. BARRA INFERIOR DE REPRODUÇÃO & TIMELINE (SEMPRE ANCORADA) */}
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
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/30 text-[#00D2FF] border border-blue-500/30 font-mono">
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
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-red-400 border border-slate-800"
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
