import { lerConfigGlpi } from './config';
import { ErroGlpi } from './erros';

const TTL_SESSAO_MS = 10 * 60 * 1000;

type SessaoEmCache = {
  token: string;
  expiraEm: number;
};

let sessao: SessaoEmCache | null = null;
let sessaoEmAndamento: Promise<string> | null = null;

function extrairMensagemGlpi(corpo: unknown, padrao: string): string {
  if (Array.isArray(corpo) && corpo.length > 0) {
    return corpo.filter((parte) => typeof parte === 'string').join(' — ') || padrao;
  }
  if (corpo && typeof corpo === 'object') {
    const registro = corpo as Record<string, unknown>;
    if (typeof registro.message === 'string') return registro.message;
  }
  return padrao;
}

async function abrirSessao(): Promise<string> {
  const config = lerConfigGlpi();

  const resposta = await fetch(`${config.urlApi}/initSession`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'App-Token': config.appToken,
      Authorization: `user_token ${config.userToken}`,
    },
    cache: 'no-store',
  });

  const corpo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new ErroGlpi(
      extrairMensagemGlpi(corpo, 'Falha ao abrir sessão no GLPI'),
      { status: resposta.status, codigo: 'SESSAO_NAO_INICIADA', detalhe: corpo },
    );
  }

  const token = (corpo as { session_token?: string } | null)?.session_token;
  if (!token) {
    throw new ErroGlpi('GLPI não retornou session_token', {
      status: 502,
      codigo: 'SESSAO_SEM_TOKEN',
      detalhe: corpo,
    });
  }

  sessao = { token, expiraEm: Date.now() + TTL_SESSAO_MS };
  return token;
}

export async function obterSessionToken(): Promise<string> {
  if (sessao && sessao.expiraEm > Date.now()) {
    return sessao.token;
  }

  if (!sessaoEmAndamento) {
    sessaoEmAndamento = abrirSessao().finally(() => {
      sessaoEmAndamento = null;
    });
  }

  return sessaoEmAndamento;
}

export function invalidarSessao(): void {
  sessao = null;
}

export async function encerrarSessao(): Promise<void> {
  if (!sessao) return;

  const config = lerConfigGlpi();
  const token = sessao.token;
  invalidarSessao();

  await fetch(`${config.urlApi}/killSession`, {
    method: 'GET',
    headers: {
      'App-Token': config.appToken,
      'Session-Token': token,
    },
    cache: 'no-store',
  }).catch(() => undefined);
}
