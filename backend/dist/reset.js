"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.conversation.updateMany({
        data: { status: 'bot_active' }
    });
    console.log('Todas as conversas resetadas para bot_active');
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=reset.js.map