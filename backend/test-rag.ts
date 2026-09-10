import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { RagService } from './src/modules/rag/services/rag.service';
import { AiService } from './src/modules/ai/ai.service';
import { PrismaService } from './src/shared/database/prisma.service';

async function bootstrap() {
  console.log('🚀 Iniciando script de teste E2E do RAG...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const ragService = app.get(RagService);
  const aiService = app.get(AiService);
  const prisma = app.get(PrismaService);

  try {
    // 1. Pegar um tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error('Nenhum tenant encontrado no banco.');
    console.log(`✅ Tenant encontrado: ${tenant.name} (${tenant.id})`);

    // Deletar documentos antigos do tenant para limpar o teste
    await prisma.knowledgeDocument.deleteMany({ where: { tenantId: tenant.id } });
    console.log('🧹 Documentos antigos limpos.');

    // Inserir os chunks simulados diretamente no banco para testar a busca semântica
    console.log('🧠 Injetando conhecimento (Embeddings) via OpenAI...');
    
    const textoConhecimento = "O VersátilMAX custa R$ 150.000,00. A Semeadora Verto custa R$ 300.000,00.";
    
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: textoConhecimento,
    });
    const embedding = embeddingResponse.data[0].embedding;

    const doc = await prisma.knowledgeDocument.create({
      data: {
        tenantId: tenant.id,
        filename: 'tabela-precos-fake.pdf',
        fileSize: 1024,
      }
    });

    await prisma.$executeRaw`
      INSERT INTO "DocumentChunk" (id, "documentId", "tenantId", content, embedding)
      VALUES (
        gen_random_uuid(), 
        ${doc.id}, 
        ${tenant.id}, 
        ${textoConhecimento}, 
        ${embedding}::vector
      )
    `;
    console.log('✅ Conhecimento injetado no Vector DB!');

    // 3. Testar a Busca Semântica do RAG Service
    console.log('🔍 Testando busca semântica do RAG (Query: "Qual o valor da semeadora?")...');
    const chunks = await ragService.searchSimilarChunks(tenant.id, 'Qual o valor da semeadora?');
    console.log(`💡 Chunks encontrados:`, chunks);
    if (chunks.length === 0) throw new Error('Falha na busca semântica do RAG.');

    // 4. Testar o AiService injetando RAG
    console.log('🤖 Testando AiService (Playground Flow)...');
    
    const config = {
      id: tenant.id,
      aiPrompt: 'Você é o Vitor. Responda apenas com base no conhecimento. Seja direto e curto.',
      aiModel: 'gpt-4o-mini'
    };

    const history = [
      { role: 'user' as const, content: 'Olá, qual é o preço da Semeadora Verto?' }
    ];

    const resposta = await aiService.processConversation(history, config);
    console.log('💬 Resposta do Bot:', resposta.resposta_cliente);
    
    if (!resposta.resposta_cliente.includes('300')) {
      console.warn('⚠️ A IA não retornou o preço correto. Verifique o prompt ou a injeção.');
    } else {
      console.log('✅ Teste E2E do RAG finalizado com SUCESSO! A IA puxou os dados do vetor.');
    }

  } catch (error) {
    console.error('❌ Erro no teste E2E:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
