# =====================================================================
# Script E2E de Homologação Local - Plataforma VERSUS
# =====================================================================
# Execute este script no PowerShell APÓS garantir que a variável 
# OPENAI_API_KEY no arquivo `backend/.env` seja válida.
# =====================================================================

$tenantId = "tenant-1"
$webhookUrl = "http://localhost:3001/webhooks/whatsapp/$tenantId"
$headers = @{
    "Content-Type" = "application/json"
    "x-webhook-secret" = "super-secret-evolution-key"
}

# 1. Simular uma mensagem inicial de um novo lead
Write-Host "[E2E Test] 1. Enviando mensagem de saudação inicial..." -ForegroundColor Cyan
$payload1 = @{
    "event" = "messages.upsert"
    "instance" = "VerusWhatsAppV1"
    "data" = @{
        "message" = @{
            "conversation" = "Oi, tudo certo?"
            "messageTimestamp" = [int][double]::Parse((Get-Date (Get-Date).ToUniversalTime() -UFormat %s))
        }
        "key" = @{
            "remoteJid" = "5511999999999@s.whatsapp.net"
            "fromMe" = $false
            "id" = "msg-123456-init"
        }
        "pushName" = "João Agricultor"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $webhookUrl -Method Post -Headers $headers -Body $payload1
Write-Host "✅ Mensagem inicial enviada com sucesso! Aguardando 5 segundos para a IA responder..." -ForegroundColor Green
Start-Sleep -Seconds 5

# 2. Simular intenção de compra forte com gatilho de Handoff
Write-Host "`n[E2E Test] 2. Enviando mensagem avançada com gatilho de Transbordo (Handoff)..." -ForegroundColor Cyan
$payload2 = @{
    "event" = "messages.upsert"
    "instance" = "VerusWhatsAppV1"
    "data" = @{
        "message" = @{
            "conversation" = "Quero saber o valor do Kit Versátil para sementes miúdas em uma máquina com 3 corpos de 12 linhas e falar com o vendedor"
            "messageTimestamp" = [int][double]::Parse((Get-Date (Get-Date).ToUniversalTime() -UFormat %s))
        }
        "key" = @{
            "remoteJid" = "5511999999999@s.whatsapp.net"
            "fromMe" = $false
            "id" = "msg-789012-intent"
        }
        "pushName" = "João Agricultor"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $webhookUrl -Method Post -Headers $headers -Body $payload2
Write-Host "✅ Mensagem de compra enviada com sucesso!" -ForegroundColor Green

Write-Host "`n=====================================================================" -ForegroundColor Yellow
Write-Host "Verificação E2E:" -ForegroundColor Yellow
Write-Host "1. Abra http://localhost:3000/chat e veja o lead (5511999999999) como 'Humano'." -ForegroundColor Yellow
Write-Host "2. Abra http://localhost:3000/crm e veja o card no pipeline comercial com o resumo da IA!" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Yellow
