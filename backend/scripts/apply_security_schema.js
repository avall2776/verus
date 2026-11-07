const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Aplicando DDL de Segurança Bancária e Sessões no PostgreSQL ---');

  const statements = [
    // 1. Campos novos no User
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT false;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorMethod" TEXT DEFAULT 'MASTER_PHONE';`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorPhone" TEXT;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER DEFAULT 0;`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trustedDevices" JSONB;`,

    // 2. Tabela de Sessões Ativas
    `CREATE TABLE IF NOT EXISTS "active_sessions" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "tenantId" TEXT NOT NULL,
      "sessionToken" TEXT NOT NULL UNIQUE,
      "ipAddress" TEXT,
      "city" TEXT,
      "state" TEXT,
      "country" TEXT DEFAULT 'BR',
      "device" TEXT,
      "browser" TEXT,
      "userAgent" TEXT,
      "isTrustedDevice" BOOLEAN NOT NULL DEFAULT false,
      "trustedUntil" TIMESTAMP(3),
      "isRevoked" BOOLEAN NOT NULL DEFAULT false,
      "revokedAt" TIMESTAMP(3),
      "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "active_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "active_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS "active_sessions_userId_idx" ON "active_sessions"("userId");`,
    `CREATE INDEX IF NOT EXISTS "active_sessions_tenantId_idx" ON "active_sessions"("tenantId");`,
    `CREATE INDEX IF NOT EXISTS "active_sessions_isRevoked_idx" ON "active_sessions"("isRevoked");`,
    `CREATE INDEX IF NOT EXISTS "active_sessions_lastActiveAt_idx" ON "active_sessions"("lastActiveAt");`,

    // 3. Tabela de Logs de Auditoria de Login (SOC)
    `CREATE TABLE IF NOT EXISTS "login_audit_logs" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT,
      "tenantId" TEXT,
      "email" TEXT NOT NULL,
      "userName" TEXT,
      "tenantName" TEXT,
      "status" TEXT NOT NULL,
      "failReason" TEXT,
      "ipAddress" TEXT,
      "city" TEXT,
      "state" TEXT,
      "country" TEXT DEFAULT 'BR',
      "device" TEXT,
      "browser" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "login_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "login_audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS "login_audit_logs_email_idx" ON "login_audit_logs"("email");`,
    `CREATE INDEX IF NOT EXISTS "login_audit_logs_tenantId_idx" ON "login_audit_logs"("tenantId");`,
    `CREATE INDEX IF NOT EXISTS "login_audit_logs_userId_idx" ON "login_audit_logs"("userId");`,
    `CREATE INDEX IF NOT EXISTS "login_audit_logs_status_idx" ON "login_audit_logs"("status");`,
    `CREATE INDEX IF NOT EXISTS "login_audit_logs_createdAt_idx" ON "login_audit_logs"("createdAt");`,

    // 4. Tabela de Verificações 2FA
    `CREATE TABLE IF NOT EXISTS "two_factor_verifications" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "tenantId" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "tempToken" TEXT NOT NULL UNIQUE,
      "targetPhone" TEXT NOT NULL,
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "isVerified" BOOLEAN NOT NULL DEFAULT false,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "two_factor_verifications_tempToken_idx" ON "two_factor_verifications"("tempToken");`,
    `CREATE INDEX IF NOT EXISTS "two_factor_verifications_userId_idx" ON "two_factor_verifications"("userId");`,
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('✓ Executado com sucesso:', sql.substring(0, 50).trim() + '...');
    } catch (err) {
      console.error('✗ Erro ao executar:', err.message);
    }
  }

  console.log('--- Concluído com sucesso! ---');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

