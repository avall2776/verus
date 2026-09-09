"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.tenant.update({
        where: { id: 'tenant_123' },
        data: {
            metaToken: 'EAAVZAjwAnC4UBSUCsPJyoU68zkPVHFh0nCZAywz0IPUkhFj6pgZBSWj7SwQQvDJUxPDj28EY1UCzsOWEpX1ffecT2mbrHIxEI39bEUwXpODFe1uvD5VTZBWTYED9xRNATZAjUfRcCUEXTuGWSVUGURtbalCtTxZC8ZA3rYGcsBihiUe7w7ZAwHT8byUm8wu9KhRQfgZDZD',
            metaPhoneNumberId: '1165234936683099'
        }
    });
    console.log('Token da Meta e Phone ID salvos com sucesso no tenant_123!');
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=update-tenant.js.map