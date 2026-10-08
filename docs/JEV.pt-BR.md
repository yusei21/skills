# Jev AI — guia de uso

[English](./JEV.md) | **Português** | [简体中文](./JEV.zh-CN.md)

A skill [`jev-agent`](../skills/jev-agent/SKILL.md) integra o serviço de decisões tipadas Jev AI ao catálogo canônico. Fonte: [jev-ai/jev-agent-skill](https://github.com/jev-ai/jev-agent-skill). É uma integração local original, não uma cópia do projeto externo.

## Instalar e configurar

Clone este repositório e inicie o agente na raiz, como indicado no README. Para uso em outro projeto, consulte as regras de instalação e adaptação de skills. Crie sua chave em https://thejevai.com/settings/apikeys e configure no terminal do ambiente de execução:

```bash
export JEV_API_KEY="sk_your_key_here"
export JEV_LANGUAGE="en-US"
```

As opções de idioma documentadas pela origem são `en-US` e `zh-CN`. Os padrões opcionais são `JEV_API_BASE_URL=https://thejevai.com` e `JEV_MODEL=typesafe/jev-1.13`. Nunca envie a chave para commits, logs ou mensagens do agente.

## Como pedir ao agente

```text
Use a skill jev-agent para classificar este chamado entre financeiro,
técnico e comercial. Retorne a escolha e a confiança. Não execute ações.
Chamado: "Recebi uma cobrança duplicada."
```

Outros cenários: use `score` para priorizar demandas em uma escala predefinida e `noul` para avaliar se um caso precisa de revisão humana. Consulte o [arquivo da skill](../skills/jev-agent/SKILL.md) para o comando `curl` completo e a forma da resposta.

## Cuidados

A API pode consumir créditos e receber dados enviados para análise: peça autorização quando necessário, envie apenas dados mínimos e nunca inclua credenciais. Jev recomenda decisões, mas não concede permissões nem executa operações. Verifique erros HTTP, `code`, `data.result.answers` e comportamento em timeout. A ativação real requer uma chave válida e um ambiente com acesso à API. Documentação externa: https://thejevai.com/docs.
