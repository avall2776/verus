---
name: checklist-updater
description: Sempre mantém o CHECKLIST.md atualizado.
---

# Regra: Atualização Automática do Checklist

Sempre que você (o agente de IA) finalizar a implementação de uma nova funcionalidade, corrigir um bug, ou concluir qualquer tarefa solicitada pelo usuário no projeto:

1. Você DEVE abrir o arquivo `CHECKLIST.md` localizado na raiz do projeto (`C:\Users\Usuario\.gemini\antigravity-ide\scratch\VERSUS\CHECKLIST.md`).
2. Se a tarefa recém-concluída não estiver listada, adicione-a à seção correta.
3. Marque os itens concluídos com `[x]`.
4. Adicione novos próximos passos (se necessário) na seção "O que falta fazer".
5. Garanta que essa atualização no `CHECKLIST.md` seja sempre a última etapa antes de você devolver a resposta de "trabalho concluído" para o usuário.

**NÃO pergunte ao usuário se deve atualizar o checklist.** Apenas atualize-o automaticamente como parte do seu fluxo de trabalho.
