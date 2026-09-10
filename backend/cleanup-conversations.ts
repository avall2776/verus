import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('Iniciando limpeza de conversas duplicadas...');
  
  // Buscar todos os contatos
  const contacts = await prisma.contact.findMany();
  
  for (const contact of contacts) {
    // Buscar conversas do contato ordenadas da mais antiga para a mais nova
    const conversations = await prisma.conversation.findMany({
      where: { contactId: contact.id },
      orderBy: { createdAt: 'asc' },
    });
    
    if (conversations.length > 1) {
      console.log(`Contato ${contact.name} tem ${conversations.length} conversas. Mesclando...`);
      
      // A última conversa será a que vamos manter
      const targetConversation = conversations[conversations.length - 1];
      
      // As outras serão mescladas
      const oldConversations = conversations.slice(0, conversations.length - 1);
      
      for (const old of oldConversations) {
        // Mover as mensagens da conversa velha para a nova
        await prisma.message.updateMany({
          where: { conversationId: old.id },
          data: { conversationId: targetConversation.id },
        });
        
        // Deletar a conversa velha
        await prisma.conversation.delete({
          where: { id: old.id },
        });
        console.log(`Conversa antiga ${old.id} mesclada e deletada.`);
      }
    }
  }
  
  console.log('Limpeza concluída!');
}

cleanupDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
