param (
    [string]$MessageText = "Olá, vi o anúncio de vocês. O que a Verto faz exatamente?"
)

$body = @{
    object = "whatsapp_business_account"
    entry = @(
        @{
            id = "WHATSAPP_BUSINESS_ACCOUNT_ID"
            changes = @(
                @{
                    value = @{
                        messaging_product = "whatsapp"
                        metadata = @{
                            display_phone_number = "5511999999999"
                            phone_number_id = "PHONE_NUMBER_ID"
                        }
                        contacts = @(
                            @{
                                profile = @{
                                    name = "João Cliente"
                                }
                                wa_id = "5511988887777"
                            }
                        )
                        messages = @(
                            @{
                                from = "5511988887777"
                                id = "wamid.sim_$([guid]::NewGuid().ToString().Substring(0,8))"
                                timestamp = "1725812345"
                                text = @{
                                    body = $MessageText
                                }
                                type = "text"
                            }
                        )
                    }
                    field = "messages"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Enviando mensagem simulada para o Webhook..." -ForegroundColor Cyan

Invoke-RestMethod -Uri "http://localhost:3001/webhooks/meta/tenant_123" -Method Post -Headers $headers -Body $body

Write-Host "Mensagem enviada com sucesso! O Back-end deve ter colocado na fila." -ForegroundColor Green
