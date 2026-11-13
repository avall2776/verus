const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== TODAS AS CONVERSAS COM MENSAGENS MISTURADAS ===\n');

  const grouped = await prisma.$queryRaw`
    SELECT 
      c.id as conv_id, 
      c."contactId" as conv_contact_id,
      cc.name as conv_contact_name,
      cc.phone as conv_contact_phone,
      m."contactId" as msg_contact_id,
      mc.name as msg_contact_name,
      mc.phone as msg_contact_phone,
      mc."whatsappLid" as msg_contact_lid,
      count(m.id)::int as count_msgs,
      min(m."createdAt") as first_msg,
      max(m."createdAt") as last_msg
    FROM "Message" m
    JOIN "Conversation" c ON m."conversationId" = c.id
    JOIN "Contact" cc ON c."contactId" = cc.id
    JOIN "Contact" mc ON m."contactId" = mc.id
    WHERE m."contactId" != c."contactId"
    GROUP BY c.id, c."contactId", cc.name, cc.phone, m."contactId", mc.name, mc.phone, mc."whatsappLid"
    ORDER BY count_msgs DESC;
  `;

  console.log(JSON.stringify(grouped, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

