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
| `SESSAO_SEGREDO` | Assina o cookie de sessão do painel; 32+ caracteres (`openssl rand -base64 48`) |
| `PAINEL_ADMINISTRADORES` | Logins do GLPI que administram o painel, separados por vírgula |
| `GLPI_GRUPO_BLOQUEADOS` | Nome do grupo do GLPI que guarda quem está bloqueado (padrão `Painel de chamados - bloqueados`) |

A API REST precisa estar **habilitada** no GLPI, com **"Habilitar login com
credenciais"** ativo (é assim que o painel valida a senha de quem entra), e o IP de
origem liberado na configuração do cliente de API. Na Vercel, a saída é um conjunto
amplo de IPs — se a instância restringir por IP, use IPs dedicados ou um proxy fixo.

Todas as variáveis são lidas apenas no servidor (sem prefixo `NEXT_PUBLIC_`). Os tokens
nunca chegam ao navegador: o front conversa com as rotas em `/api/glpi/*`, e só elas
falam com o GLPI.

## Acesso ao painel

Quem entra usa o próprio usuário e senha do GLPI. Depois da senha validada, o painel
decide se a pessoa pode entrar:

1. **Administradores** (`PAINEL_ADMINISTRADORES`) sempre entram e veem a tela
   **Usuários**, que lista todos os usuários do GLPI com um interruptor de acesso.
2. **Todo usuário ativo do GLPI** entra por padrão.
3. **Bloqueados** são os membros do grupo `GLPI_GRUPO_BLOQUEADOS` no GLPI e recebem
   "acesso bloqueado" no login. Desligar o interruptor da tela Usuários inclui a pessoa
   nesse grupo; ligar remove. O grupo é criado pela própria integração no primeiro
   bloqueio, sem permissões de atribuição de chamado.

O bloqueio é reconferido a cada abertura do painel, então bloquear alguém encerra a
sessão dela na próxima visita. Os dados do painel continuam vindo da conta de serviço:
todo mundo que entra vê o mesmo conteúdo.

## Endpoints locais

Todas exigem sessão do painel e usuário não bloqueado (`exigirAcesso`): sem sessão
respondem 401, bloqueado 403.

| Rota | O que faz |
|---|---|
| `GET /api/glpi/status` | Testa a conexão e devolve a sessão da conta de serviço — só administradores |
| `GET /api/glpi/painel?dias=30` ou `?de=2026-09-01&ate=2026-09-30` | Indicadores do painel (últimos 7/30/90 dias ou intervalo de até 366 dias) |
| `GET /api/glpi/chamados?inicio=0&limite=25&ordem=DESC` | Lista chamados |
| `GET /api/glpi/chamados/:id` | Detalhe de um chamado |

## Estrutura

```
src/
  app/
    api/glpi/          rotas que expõem o GLPI ao front
    login/             formulário e ação de entrar/sair
    usuarios/          tela de usuários e ação de liberar/revogar acesso
    sair/              encerra a sessão por GET (usado quando o acesso é removido)
    page.tsx           painel de chamados
  middleware.ts        exige o cookie de sessão fora de /login
  components/          apresentação
  lib/
    autenticacao/      cookie assinado, limite de tentativas, níveis de acesso
    glpi/
      config.ts        leitura e validação do ambiente
      sessao.ts        initSession / killSession com cache
      cliente.ts       fetch autenticado, paginação, erros
      autenticacao.ts  valida usuário e senha de quem entra no painel
      tipos.ts         tipos do GLPI e rótulos em pt-BR
      recursos/        um arquivo por recurso (chamados, painel, usuarios, acesso-painel)
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
- Visão por usuário: consultar o GLPI com a sessão de quem entrou, para valer as
  restrições de perfil e entidade de cada pessoa.
