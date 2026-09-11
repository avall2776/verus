const fs = require('fs');
const path = require('path');

const pages = [
  { path: 'frontend/src/app/(dashboard)/monitor/page.tsx', title: 'Monitor em Tempo Real', icon: 'Activity' },
  { path: 'frontend/src/app/(dashboard)/dashboard/atendimento/page.tsx', title: 'Métricas de Atendimento', icon: 'BarChart' },
  { path: 'frontend/src/app/(dashboard)/team-chat/page.tsx', title: 'Chat Interno da Equipe', icon: 'MessagesSquare' },
  { path: 'frontend/src/app/(dashboard)/dashboard/crm/page.tsx', title: 'Métricas de Vendas', icon: 'PieChart' },
  { path: 'frontend/src/app/(dashboard)/settings/whatsapp/page.tsx', title: 'Conexões WhatsApp', icon: 'Smartphone' },
  { path: 'frontend/src/app/(dashboard)/settings/automations/page.tsx', title: 'Automações & Regras', icon: 'Zap' },
  { path: 'frontend/src/app/(dashboard)/settings/agents/page.tsx', title: 'Agentes de IA', icon: 'Bot' },
  { path: 'frontend/src/app/(dashboard)/settings/users/page.tsx', title: 'Usuários & Acessos', icon: 'Users' }
];

pages.forEach(p => {
  const fullPath = path.join(__dirname, p.path);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    content = content.replace('{title}', p.title);
    fs.writeFileSync(fullPath, content);
  }
});

console.log('Fixed pages!');
