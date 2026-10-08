---
name: jev-agent
description: Use Jev AI for bounded, typed decisions (choice, score, noul), including task routing, prioritization, evidence checks and review gates. Requires a user-configured JEV_API_KEY; never delegates authorization or execution to the model.
---

# Jev Agent — integração local

Fonte e documentação original: https://github.com/jev-ai/jev-agent-skill

Esta integração é escrita para este repositório e não redistribui o arquivo SKILL.md do projeto externo. Consulte a documentação oficial para alterações no contrato da API.

## Quando usar

Use somente para julgamentos com saída delimitada: classificar entre opções conhecidas (`choice`), atribuir uma nota a uma escala (`score`) ou estimar uma resposta sim/não (`noul`). Exemplos: rotear tickets, priorizar demandas, revisar suficiência de evidências e sinalizar ações que exigem revisão humana.

Não use para gerar textos longos, executar ferramentas, aplicar permissões, fazer cálculos determinísticos ou substituir políticas de segurança.

## Configuração

1. Gere uma chave em https://thejevai.com/settings/apikeys.
2. Configure a chave no ambiente local, nunca no Git:

```bash
export JEV_API_KEY="sk_your_key_here"
export JEV_LANGUAGE="en-US"
# Opcionais:
export JEV_API_BASE_URL="https://thejevai.com"
export JEV_MODEL="typesafe/jev-1.13"
```

A orientação oficial de idioma cobre `en-US` e `zh-CN`; este arquivo explica o fluxo em português, mas não pressupõe suporte nativo a `pt-BR` pela API. Não peça a chave real na conversa e não a imprima em logs.

## Procedimento

1. Verifique **somente a presença** de `JEV_API_KEY` no ambiente autorizado.
2. Defina um estado mínimo, sem segredos nem dados pessoais desnecessários.
3. Escolha `choice`, `score` ou `noul` e formule uma pergunta específica.
4. Se houver autorização do usuário para chamar uma API externa e gastar créditos, envie a requisição pelo backend.
5. Valide HTTP, `code === 0` e `data.result.answers`. Trate falhas, 401/402/429 e timeout explicitamente.
6. Use o resultado apenas como sinal. A aplicação decide o próximo passo segundo suas permissões e verificações determinísticas.

## Exemplo mínimo

```bash
test -n "$JEV_API_KEY" || { echo "Configure JEV_API_KEY localmente"; exit 1; }
curl -sS "${JEV_API_BASE_URL:-https://thejevai.com}/v1/systemone" \
  -H "Authorization: Bearer $JEV_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "typesafe/jev-1.13",
    "state": "Cliente relata cobrança duplicada.",
    "questions": {
      "human_review": {
        "type": "noul",
        "instructions": "Does this case require human review before a refund?"
      }
    }
  }'
```

O exemplo apenas solicita uma avaliação; não efetua estorno nem altera sistemas. A resposta esperada apresenta `data.result.answers.human_review.noul` entre 0 e 1. Não escolha limites universais sem dados e política do projeto.

## Exemplos de solicitação ao agente

- "Use jev-agent para classificar este chamado entre billing, support e sales; mostre a escolha e a confiança. Não execute alterações."
- "Use jev-agent para avaliar se as evidências bastam para publicar esta conclusão; aponte o que ainda precisa ser verificado."
- "Use jev-agent para avaliar o risco de uma ação destrutiva, sem executá-la e sem dispensar aprovação humana."

Mais exemplos e detalhes da API: https://github.com/jev-ai/jev-agent-skill e https://thejevai.com/docs.
