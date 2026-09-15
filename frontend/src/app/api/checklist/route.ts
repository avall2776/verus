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

    // Detecta seções principais
    if (line.startsWith('## 🕒 Registro de Ponto')) {
      if (currentPhase) {
        if (currentItem) currentPhase.items.push(currentItem);
        phases.push(currentPhase);
        currentPhase = null;
        currentItem = null;
      }
      currentSection = 'ponto';
      continue;
    }

    if (line.startsWith('## 🚀 Roadmap Futuro')) {
      if (currentPhase) {
        if (currentItem) currentPhase.items.push(currentItem);
        phases.push(currentPhase);
        currentPhase = null;
        currentItem = null;
      }
      currentSection = 'roadmap';
      continue;
    }

    // Processa Seção de Ponto
    if (currentSection === 'ponto') {
      const matchPonto = line.match(/^-\s+\*\*\[(\d{2}\/\d{2}\/\d{4})\s+-\s+(\d{2}:\d{2})\]\*\*\s+(.+)$/);
      if (matchPonto) {
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
        } else if (rest.includes('🚀') || rest.includes('💎') || rest.includes('🛡️')) {
          type = 'resume';
          icon = rest.match(/^[^\w\s]+/)?.[0] || '🚀';
        }

        const cleanDesc = rest.replace(/^[^\w\s]+\s*/, '').trim();

        punchIns.push({
          timestamp: `${date} ${time}`,
          date,
          time,
          type,
          icon,
          description: cleanDesc
        });
      }
      continue;
    }

    // Processa Roadmap
    if (currentSection === 'roadmap') {
      const matchRoadmap = line.match(/^-\s+\[( |x)\]\s+\*\*([^*]+)\*\*:\s*(.+)$/i);
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
    const isPhaseLine = /^###\s+(?:[^\w\s]+\s+)?Fase\s+\d+/i.test(line);
    if (isPhaseLine) {
      if (currentPhase) {
        if (currentItem) currentPhase.items.push(currentItem);
        phases.push(currentPhase);
      }

      const matchPhase = line.match(/^###\s+(?:[^\w\s]+\s+)?Fase\s+(\d+)(?:\s*\(([^)]+)\))?:\s*(.+)$/i);
      const phaseNum = matchPhase ? parseInt(matchPhase[1], 10) : phases.length + 1;
      const rawTitle = line.replace(/^###\s+(?:[^\w\s]+\s+)?/, '').trim();
      const cleanTitle = matchPhase ? matchPhase[3].trim() : rawTitle;

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
  const lastPunch = punchIns[punchIns.length - 1] || null;

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
    punchIns: punchIns.reverse(),
    roadmapItems,
    rawMarkdown: markdown
  };
}

export async function GET() {
  let markdown = '';

  // 1. Tenta carregar do disco local (Workspace / Servidor VPS)
  try {
    const localPaths = [
      path.join(process.cwd(), '..', 'CHECKLIST.md'),
      path.join(process.cwd(), 'CHECKLIST.md'),
      path.join(process.cwd(), 'public', 'CHECKLIST.md'),
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
