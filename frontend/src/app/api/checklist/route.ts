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

interface PunchIn {
  timestamp: string;
  date: string;
  time: string;
  type: 'start' | 'pause' | 'resume' | 'end' | 'info';
  icon: string;
  description: string;
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

  // Ordena os pontos rigorosamente do mais recente para o mais antigo
  punchIns.sort((a, b) => parseDateTime(b.date, b.time) - parseDateTime(a.date, a.time));

  // O último ponto batido é sempre o elemento mais recente
  const lastPunch = punchIns[0] || null;

  return {
    stats: {
      totalPhases: phases.length,
      completedPhases,
      pendingPhases: phases.length - completedPhases,
      totalTasks,
      completedTasks,
      completionPercent,
      currentActivePhaseTitle,
      lastPunchIn: lastPunch,
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
