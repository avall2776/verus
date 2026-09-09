import * as fs from 'fs';
import * as path from 'path';

interface Task {
  id: string;
  gate: string;
  title: string;
  description: string;
  runbook: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'BLOQUEADO';
  completedAt: string | null;
}

const tasksFilePath = path.join(__dirname, 'tasks.json');
const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzvrhW1npjJj6M3yl2dTURTlswZ3mCEeSUFNWmL84EfRhs9gP9I4mx9wM0au3shJy-Pow/exec';

function loadTasks(): Task[] {
  return JSON.parse(fs.readFileSync(tasksFilePath, 'utf8'));
}

function saveTasks(tasks: Task[]) {
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2), 'utf8');
}

async function syncWithGoogleSheets(task: Task) {
  try {
    console.log('📡 Enviando atualização para o Google Sheets do gestor...');
    const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: task.id,
        title: task.title,
        gate: task.gate,
        status: 'CONCLUÍDO',
        completedAt: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      })
    });
    
    if (response.ok) {
      console.log('✅ Planilha do Google Sheets sincronizada com sucesso!');
    } else {
      console.warn(`⚠️ Google Sheets retornou status: ${response.status}`);
    }
  } catch (err: any) {
    console.warn('⚠️ Erro ao sincronizar com Google Sheets:', err.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'next') {
    const tasks = loadTasks();
    const current = tasks.find(t => t.status === 'PENDENTE' || t.status === 'EM_ANDAMENTO');

    if (!current) {
      console.log('\n🎉 Todas as tarefas configuradas estão concluídas!\n');
      process.exit(0);
    }

    console.log('\n======================================================');
    console.log(`📌 TAREFA ATUAL: [${current.id}] - ${current.title}`);
    console.log(`🏷️  Gate: ${current.gate}`);
    console.log(`📝 Descrição: ${current.description}`);
    console.log('------------------------------------------------------');
    console.log('💻 RUNBOOK / COMANDOS:');
    console.log(current.runbook);
    console.log('------------------------------------------------------');
    console.log(`👉 Para concluir execute: npm run task:done -- ${current.id}\n`);
  } else if (command === 'done') {
    const taskId = args[1];
    const tasks = loadTasks();
    const index = tasks.findIndex(t => t.id === taskId);

    if (index === -1) {
      console.error(`❌ Tarefa ${taskId} não encontrada.`);
      process.exit(1);
    }

    tasks[index].status = 'CONCLUIDO';
    tasks[index].completedAt = new Date().toISOString();

    if (index + 1 < tasks.length && tasks[index + 1].status === 'BLOQUEADO') {
      tasks[index + 1].status = 'PENDENTE';
    }

    saveTasks(tasks);
    console.log(`\n✅ Tarefa [${taskId}] concluída localmente!`);

    await syncWithGoogleSheets(tasks[index]);
    
    if (index + 1 < tasks.length) {
      console.log(`🔓 Próxima liberada: [${tasks[index + 1].id}] ${tasks[index + 1].title}`);
      console.log(`👉 Execute: npm run task\n`);
    }
  } else if (command === 'list') {
    const tasks = loadTasks();
    console.log('\n📋 PROGRESSO GERAL:');
    tasks.forEach(t => {
      const icon = t.status === 'CONCLUIDO' ? '✅' : t.status === 'PENDENTE' ? '⏳' : '🔒';
      console.log(`${icon} [${t.id}] ${t.status.padEnd(10)} - ${t.title}`);
    });
    console.log('');
  }
}

main();