import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PhaseItem {
  text: string;
  checked: boolean;
  subitems: string[];
}

interface Phase {
  id: number;
  title: string;
  rawTitle: string;
  isCompleted: boolean;
  items: PhaseItem[];
}

export interface PunchIn {
  timestamp: string;
  date: string;
  time: string;
  type: 'start' | 'pause' | 'resume' | 'end' | 'task' | 'info';
  icon: string;
  description: string;
  isTimeclockEvent?: boolean;
}

export interface DailyTimeclock {
  date: string;
  entryTime: string | null;
  entryDescription: string | null;
  lunchOutTime: string | null;
  lunchInTime: string | null;
  exitTime: string | null;
  status: 'morning_active' | 'lunch' | 'afternoon_active' | 'completed' | 'idle';
  statusLabel: string;
  totalEventsToday: number;
  latestActivity: PunchIn | null;
}

interface RoadmapItem {
  title: string;
  description: string;
  checked: boolean;
}

function parseChecklistMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  
  const phases: Phase[] = [];
  const punchIns: PunchIn[] = [];
  const roadmapItems: RoadmapItem[] = [];

  let currentPhase: Phase | null = null;
  let currentItem: PhaseItem | null = null;
  let currentSection: 'phases' | 'ponto' | 'roadmap' | 'other' = 'phases';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detecta cabeçalhos de seções principais
    const isPontoSectionHeader = /^##\s+.*(?:Registro\s+de\s+Ponto|Timesheet|Histórico\s+de\s+Ponto)/i.test(line);
    if (isPontoSectionHeader) {
      if (currentPhase) {
        if (currentItem) currentPhase.items.push(currentItem);
        phases.push(currentPhase);
        currentPhase = null;
        currentItem = null;
      }
      currentSection = 'ponto';
      continue;
    }

    if (line.startsWith('## 🚀 Roadmap Futuro') || /^##\s+.*Roadmap/i.test(line)) {
      if (currentPhase) {
        if (currentItem) currentPhase.items.push(currentItem);
        phases.push(currentPhase);
        currentPhase = null;
        currentItem = null;
      }
      currentSection = 'roadmap';
      continue;
    }

    if (/^##\s+.*(?:Fases)/i.test(line)) {
      currentSection = 'phases';
      continue;
    }

    // Processa Ponto de Forma Universal (captura qualquer linha de timestamp mesmo fora da seção explícita)
    const matchPonto = line.match(/^-\s+\*\*\[(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}:\d{2})\]\*\*\s*(.*)$/);
    if (matchPonto) {
      if (currentPhase) {
        if (currentItem) currentPhase.items.push(currentItem);
        phases.push(currentPhase);
        currentPhase = null;
        currentItem = null;
      }
      currentSection = 'ponto';

      const [, date, time, rest] = matchPonto;
      let type: PunchIn['type'] = 'info';
      let icon = 'ℹ️';

      if (rest.includes('🟢')) {
        type = 'start';
        icon = '🟢';
      } else if (rest.includes('⏸️')) {
        type = 'pause';
        icon = '⏸️';
      } else if (rest.includes('▶️')) {
        type = 'resume';
        icon = '▶️';
      } else if (rest.includes('🏁')) {
        type = 'end';
        icon = '🏁';
      } else if (rest.includes('🚀') || rest.includes('💎') || rest.includes('🛡️') || rest.includes('🎯') || rest.includes('🧼') || rest.includes('📜') || rest.includes('👑') || rest.includes('⚡')) {
        type = 'resume';
        icon = rest.match(/^[^\w\s]+/)?.[0] || '🚀';
      }

      const cleanDesc = rest.replace(/^[^\w\s]+\s*/, '').replace(/^(\*\*)+|(\*\*|:|\*\*:)+$/g, '').trim();

      punchIns.push({
        timestamp: `${date} ${time}`,
        date,
        time,
        type,
        icon,
        description: cleanDesc
      });
      continue;
    }

    // Sub-itens detalhados da seção de ponto (ignora para a contagem de pontos principais)
    if (currentSection === 'ponto' && (line.startsWith('-') || line.startsWith('*') || line.startsWith('  '))) {
      continue;
    }

    // Processa Roadmap
    if (currentSection === 'roadmap') {
      const matchRoadmap = line.match(/^-\s+\[( |x)\]\s+\*\*([^*:]+)(?::\*\*|\*\*:\s*|\*\*)\s*(.+)$/i);
      if (matchRoadmap) {
        roadmapItems.push({
          checked: matchRoadmap[1].toLowerCase() === 'x',
          title: matchRoadmap[2].trim(),
          description: matchRoadmap[3].trim()
        });
      }
      continue;
    }

    // Processa Fases
    const isPhaseLine = /^###\s+.*?\bFase\s+(\d+)/i.test(line);
    if (isPhaseLine) {
      if (currentPhase) {
        if (currentItem) currentPhase.items.push(currentItem);
        phases.push(currentPhase);
      }
      currentSection = 'phases';

      const matchPhase = line.match(/^###\s+.*?\bFase\s+(\d+)\s*:\s*(.+)$/i);
      const phaseNum = matchPhase ? parseInt(matchPhase[1], 10) : phases.length + 1;
      const rawTitle = line.replace(/^###\s+/, '').trim();
      const cleanTitle = matchPhase ? matchPhase[2].trim() : rawTitle;

      currentPhase = {
        id: phaseNum,
        title: cleanTitle,
        rawTitle,
        isCompleted: false,
        items: []
      };
      currentItem = null;
      continue;
    }

    // Itens de checklist de uma fase
    if (currentPhase && currentSection === 'phases') {
      const matchItem = line.match(/^-\s+\[( |x)\]\s+(.+)$/i);
      if (matchItem) {
        if (currentItem) {
          currentPhase.items.push(currentItem);
        }
        currentItem = {
          checked: matchItem[1].toLowerCase() === 'x',
          text: matchItem[2].trim(),
          subitems: []
        };
        continue;
      }

      // Sub-itens detalhados
      const matchSub = line.match(/^[\*\-]\s+(.+)$/);
      if (matchSub && currentItem && !line.includes('[ ]') && !line.includes('[x]')) {
        currentItem.subitems.push(matchSub[1].trim());
        continue;
      }
    }
  }

  // Push da última fase
  if (currentPhase) {
    if (currentItem) currentPhase.items.push(currentItem);
    phases.push(currentPhase);
  }

  // Ordena fases por id numérico
  phases.sort((a, b) => a.id - b.id);

  // Calcula status de conclusão por fase
  let totalTasks = 0;
  let completedTasks = 0;

  phases.forEach(p => {
    if (p.items.length > 0) {
      const hasUnchecked = p.items.some(i => !i.checked);
      p.isCompleted = !hasUnchecked;
      p.items.forEach(i => {
        totalTasks++;
        if (i.checked) completedTasks++;
      });
    } else {
      p.isCompleted = true;
    }
  });

  const completedPhases = phases.filter(p => p.isCompleted).length;
  const pendingPhase = phases.find(p => !p.isCompleted);
  const currentActivePhaseTitle = pendingPhase 
    ? `Fase ${pendingPhase.id}: ${pendingPhase.title}` 
    : `Todas as ${phases.length} Fases Concluídas (100%)`;

  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Função auxiliar para converter "DD/MM/YYYY" e "HH:MM" em timestamp numérico
  const parseDateTime = (d: string, t: string) => {
    try {
      const partsDate = d.split('/').map(Number);
      const partsTime = t.split(':').map(Number);
      if (partsDate.length === 3 && partsTime.length >= 2) {
        return new Date(partsDate[2], partsDate[1] - 1, partsDate[0], partsTime[0], partsTime[1]).getTime();
      }
    } catch (e) {}
    return 0;
  };

  // Agrupamento por Data para aplicação da Regra de Inviolabilidade de Ponto
  const punchesByDate = new Map<string, PunchIn[]>();
  for (const p of punchIns) {
    if (!punchesByDate.has(p.date)) {
      punchesByDate.set(p.date, []);
    }
    punchesByDate.get(p.date)!.push(p);
  }

  // Ordena os eventos de cada dia cronologicamente (do mais antigo para o mais recente)
  // e identifica o primeiro ponto de entrada oficial do dia (Imutável)
  punchesByDate.forEach((dayList: PunchIn[]) => {
    dayList.sort((a: PunchIn, b: PunchIn) => parseDateTime(a.date, a.time) - parseDateTime(b.date, b.time));

    let entrySet = false;
    for (let idx = 0; idx < dayList.length; idx++) {
      const item = dayList[idx];
      const descLower = item.description.toLowerCase();

      // Regra de Ponto Eletrônico: O primeiro evento da manhã com 🟢 ou "início" (ou o primeiro do dia)
      // é a Entrada Oficial e Imutável da jornada.
      if (!entrySet && (idx === 0 || item.icon === '🟢' || descLower.includes('início') || descLower.includes('inicio'))) {
        item.type = 'start';
        item.isTimeclockEvent = true;
        entrySet = true;
      } else if (
        item.icon === '▶️' || 
        descLower.includes('retorno') || 
        descLower.includes('volta do almoço') || 
        descLower.includes('volta do almoco') || 
        descLower.includes('turno da tarde')
      ) {
        item.type = 'resume';
        item.isTimeclockEvent = true;
      } else if (
        item.icon === '⏸️' || 
        descLower.includes('pausa') || 
        descLower.includes('intervalo') || 
        descLower.includes('saída para almoço') || 
        (descLower.includes('almoço') && !descLower.includes('retorno') && !descLower.includes('volta')) || 
        (descLower.includes('almoco') && !descLower.includes('retorno') && !descLower.includes('volta'))
      ) {
        item.type = 'pause';
        item.isTimeclockEvent = true;
      } else if (
        item.icon === '🏁' || 
        descLower.includes('finalização') || 
        descLower.includes('finalizacao') || 
        descLower.includes('fim de turno') || 
        descLower.includes('fim do turno') || 
        descLower.includes('encerramento') || 
        descLower.includes('saída') || 
        descLower.includes('saida')
      ) {
        item.type = 'end';
        item.isTimeclockEvent = true;
      } else {
        // Tarefa/atividade técnica ao longo do dia (ex: ativação de fase, deploy, refatoração)
        item.type = 'task';
        item.isTimeclockEvent = false;
      }
    }
  });

  // Ordena as datas das mais recentes para as mais antigas
  const sortedDates: string[] = [];
  punchesByDate.forEach((_, dateKey) => {
    sortedDates.push(dateKey);
  });
  sortedDates.sort((a: string, b: string) => {
    return parseDateTime(b, '12:00') - parseDateTime(a, '12:00');
  });

  const latestDate = sortedDates[0] || '';
  const todayPunches = latestDate ? punchesByDate.get(latestDate)! : [];

  // Ponto Oficial do Dia (Governança Inviolável: entrada da manhã é estritamente o menor horário)
  const entryPunch = todayPunches.find(p => p.type === 'start') || todayPunches[0] || null;
  const lunchOutPunch = todayPunches.find(p => p.type === 'pause') || null;
  const lunchInPunch = todayPunches.find(p => p.type === 'resume') || null;
  const exitPunch = todayPunches.find(p => p.type === 'end') || null;

  // A última atividade do dia registrada na linha do tempo
  const latestActivity = todayPunches.length > 0 ? todayPunches[todayPunches.length - 1] : null;

  let currentWorkdayStatus: DailyTimeclock['status'] = 'idle';
  let workdayStatusLabel = 'Aguardando Início';

  if (exitPunch) {
    currentWorkdayStatus = 'completed';
    workdayStatusLabel = 'Jornada Concluída';
  } else if (lunchInPunch) {
    currentWorkdayStatus = 'afternoon_active';
    workdayStatusLabel = 'Turno da Tarde Ativo';
  } else if (lunchOutPunch) {
    currentWorkdayStatus = 'lunch';
    workdayStatusLabel = 'Intervalo de Almoço';
  } else if (entryPunch) {
    currentWorkdayStatus = 'morning_active';
    workdayStatusLabel = 'Turno Ativo (Em Andamento)';
  }

  const timeclock: DailyTimeclock = {
    date: latestDate,
    entryTime: entryPunch ? entryPunch.time : null,
    entryDescription: entryPunch ? entryPunch.description : null,
    lunchOutTime: lunchOutPunch ? lunchOutPunch.time : null,
    lunchInTime: lunchInPunch ? lunchInPunch.time : null,
    exitTime: exitPunch ? exitPunch.time : null,
    status: currentWorkdayStatus,
    statusLabel: workdayStatusLabel,
    totalEventsToday: todayPunches.length,
    latestActivity
  };

  // Lista geral ordenada cronologicamente decrescente para histórico visual na aba
  punchIns.sort((a, b) => parseDateTime(b.date, b.time) - parseDateTime(a.date, a.time));

  return {
    stats: {
      totalPhases: phases.length,
      completedPhases,
      pendingPhases: phases.length - completedPhases,
      totalTasks,
      completedTasks,
      completionPercent,
      currentActivePhaseTitle,
      lastPunchIn: entryPunch, // Imutável: entrada oficial do dia (08:15)
      latestActivity,
      timeclock,
      entryTime: entryPunch?.time || '--:--',
      entryDate: latestDate,
      workdayStatus: workdayStatusLabel,
      updatedAt: new Date().toISOString()
    },
    phases,
    punchIns,
    roadmapItems,
    rawMarkdown: markdown
  };
}

export async function GET() {
  let markdown = '';

  // 1. Tenta carregar do disco local (Workspace / Servidor VPS / Vercel Serverless)
  try {
    const localPaths = [
      path.join(process.cwd(), '..', 'CHECKLIST.md'),
      path.join(process.cwd(), 'CHECKLIST.md'),
      path.join(process.cwd(), 'public', 'CHECKLIST.md'),
      path.join(process.cwd(), 'src', 'CHECKLIST.md'),
      path.resolve(process.cwd(), '..', 'CHECKLIST.md'),
      '/root/verus/CHECKLIST.md'
    ];

    for (const p of localPaths) {
      if (fs.existsSync(p)) {
        markdown = fs.readFileSync(p, 'utf-8');
        break;
      }
    }
  } catch (err) {
    console.warn('[Checklist API] Falha ao ler arquivo local:', err);
  }

  // 2. Se não encontrou no disco local (ex: Vercel Serverless isolado), busca do GitHub oficial
  if (!markdown || markdown.trim().length === 0) {
    try {
      const ghUrl = 'https://raw.githubusercontent.com/avall2776/verus/main/CHECKLIST.md';
      const res = await fetch(ghUrl, { cache: 'no-store' });
      if (res.ok) {
        markdown = await res.text();
      }
    } catch (err) {
      console.error('[Checklist API] Falha ao buscar do GitHub Raw:', err);
    }
  }

  if (!markdown || markdown.trim().length === 0) {
    return NextResponse.json({ error: 'Checklist não encontrado.' }, { status: 404 });
  }

  const parsed = parseChecklistMarkdown(markdown);
  return NextResponse.json(parsed);
}
