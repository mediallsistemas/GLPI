# CLAUDE.md

Orientação para o Claude Code (e para quem chega no projeto).

## O que é

Integração com uma instância **GLPI já existente**, pela API REST (`apirest.php`).
Este projeto não instala o GLPI e não reimplementa um helpdesk — ele consome a
instância que já está no ar e expõe os dados para os sistemas da Mediall.

## Stack e execução

```bash
cp .env.example .env.local
npm install
npm run dev          # Next.js 15 (App Router) → :3000
```

Verificação (não há suíte de testes ainda):

```bash
npx tsc --noEmit
npm run lint
```

Deploy: Vercel.

## Regras da integração

- **Tokens só no servidor.** `GLPI_APP_TOKEN` e `GLPI_USER_TOKEN` nunca recebem prefixo
  `NEXT_PUBLIC_`. Todo acesso ao GLPI passa por `src/lib/glpi/` e pelas rotas
  `src/app/api/glpi/*`; componentes de cliente nunca chamam o GLPI direto.
- **Nada de `fetch` solto contra o GLPI.** Use `requisitarGlpi(...)` — ele cuida da
  sessão, dos headers, do `Content-Range` e da renovação em 401.
- **Recurso novo = arquivo novo** em `src/lib/glpi/recursos/`, com uma função de
  normalização que converte o formato cru do GLPI (`ChamadoGlpi`) no formato do domínio
  (`Chamado`). A UI só enxerga o formato normalizado.
- **Códigos numéricos do GLPI** (status, urgência, prioridade, tipo) ficam em
  `tipos.ts`, com os rótulos em pt-BR. Não espalhe `status === 2` pelo código.
- Erros da integração são `ErroGlpi`, com `status` e `codigo`; as rotas os convertem em
  resposta HTTP por `respostaDeErro(...)`.
- **Acesso ao painel vive no GLPI, não no código.** Quem entra é membro do grupo
  `GLPI_GRUPO_PAINEL` ou está em `PAINEL_ADMINISTRADORES`. Toda regra de acesso passa por
  `src/lib/autenticacao/acesso.ts`; não espalhe checagens de login pelas páginas.

## Convenções

- Código, comentários e mensagens de commit em **português**.
- Commits em Conventional Commits: `feat(chamados): ...`, `fix(sessao): ...`.
- **Não escreva comentários** em código novo — o padrão é código sem comentário. Só
  adicione um quando sem ele a linha fica incompreensível.
