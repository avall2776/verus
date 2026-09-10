"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function cleanupDeals() {
    console.log('Iniciando limpeza de Deals duplicados (resquícios do teste)...');
    const contacts = await prisma.contact.findMany();
    for (const contact of contacts) {
        const deals = await prisma.deal.findMany({
            where: { contactId: contact.id },
            orderBy: { createdAt: 'asc' },
        });
        if (deals.length > 1) {
            console.log(`Contato ${contact.name} tem ${deals.length} deals. Deletando os antigos...`);
            const oldDeals = deals.slice(0, deals.length - 1);
            for (const old of oldDeals) {
                await prisma.deal.delete({
                    where: { id: old.id },
                });
                console.log(`Deal antigo ${old.id} deletado.`);
            }
        }
    }
    console.log('Limpeza de Deals concluída!');
}
cleanupDeals()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=cleanup-deals.js.map