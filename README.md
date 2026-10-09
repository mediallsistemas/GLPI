# glpi

Integração com uma instância **GLPI já existente**, via API REST (`apirest.php`).
Não é uma instalação do GLPI nem um helpdesk próprio — este projeto apenas lê e
escreve na instância que já está no ar.

Next.js 15 (App Router) + React 19 + Tailwind v4, pensado para deploy na Vercel.

## Rodando

```bash
cp .env.example .env.local     # preencha URL e tokens
npm install
npm run dev                    # http://localhost:3000
```

Verificação:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Configuração

| Variável | O que é |
|---|---|
| `GLPI_API_URL` | URL do endpoint REST, terminando em `/apirest.php` |
| `GLPI_APP_TOKEN` | Token da aplicação — GLPI → Configurar → Geral → API |
| `GLPI_USER_TOKEN` | Token pessoal do usuário de serviço — Preferências do usuário → API |

A API REST precisa estar **habilitada** no GLPI, e o IP de origem liberado na
configuração do cliente de API. Na Vercel, a saída é um conjunto amplo de IPs — se a
instância restringir por IP, use IPs dedicados ou um proxy fixo.

As três variáveis são lidas apenas no servidor (sem prefixo `NEXT_PUBLIC_`). Os tokens
nunca chegam ao navegador: o front conversa com as rotas em `/api/glpi/*`, e só elas
falam com o GLPI.

## Endpoints locais

| Rota | O que faz |
|---|---|
| `GET /api/glpi/status` | Testa a conexão e devolve a sessão atual (`getFullSession`) |
| `GET /api/glpi/chamados?inicio=0&limite=25&ordem=DESC` | Lista chamados |
| `GET /api/glpi/chamados/:id` | Detalhe de um chamado |

## Estrutura

```
src/
  app/
    api/glpi/          rotas que expõem o GLPI ao front
    page.tsx           painel de chamados
  components/          apresentação
  lib/
    glpi/
      config.ts        leitura e validação do ambiente
      sessao.ts        initSession / killSession com cache
      cliente.ts       fetch autenticado, paginação, erros
      tipos.ts         tipos do GLPI e rótulos em pt-BR
      recursos/        um arquivo por recurso (chamados, ...)
    http/              helpers de resposta das rotas
```

### Sobre a sessão

O GLPI exige `initSession` antes de qualquer chamada e devolve um `Session-Token` com
validade curta. O token fica em cache no módulo (`sessao.ts`), com TTL de 10 minutos e
reabertura automática quando o GLPI responde 401.

Em serverless esse cache é **por instância** da função: cada lambda fria abre a própria
sessão. Se a instância GLPI limitar sessões simultâneas, mover o token para um cache
externo (Redis/Upstash) é o próximo passo.

## Próximos passos

- Escrita: abertura e acompanhamento de chamados (`POST /Ticket`, `POST /Ticket/:id/ITILFollowup`).
- Busca com critérios (`/search/Ticket`) em vez de listagem simples.
- Correlacionar usuários do GLPI com os do `Autenticacao_DB` (compartilhado com
  gestao-hospitalar e LinenSistem).
- Autenticação do painel — hoje qualquer um que abra a aplicação vê os chamados.
