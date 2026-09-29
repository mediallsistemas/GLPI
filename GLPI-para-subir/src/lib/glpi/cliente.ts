import { lerConfigGlpi } from './config';
import { ErroGlpi } from './erros';
import { invalidarSessao, obterSessionToken } from './sessao';

export type ParametrosBusca = Record<
  string,
  string | number | boolean | undefined | null
>;

export type OpcoesRequisicao = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  parametros?: ParametrosBusca;
  corpo?: unknown;
};

export type RespostaGlpi<T> = {
  dados: T;
  totalDisponivel: number | null;
  faixa: { inicio: number; fim: number } | null;
};

function montarUrl(
  base: string,
  caminho: string,
  parametros?: ParametrosBusca,
): string {
  const url = new URL(`${base}/${caminho.replace(/^\/+/, '')}`);

  for (const [chave, valor] of Object.entries(parametros ?? {})) {
    if (valor === undefined || valor === null || valor === '') continue;
    url.searchParams.set(chave, String(valor));
  }

  return url.toString();
}

function lerContentRange(cabecalho: string | null): RespostaGlpi<never>['faixa'] & {
  total: number | null;
} {
  if (!cabecalho) return { inicio: 0, fim: 0, total: null };

  const casamento = cabecalho.match(/(\d+)-(\d+)\/(\d+)/);
  if (!casamento) return { inicio: 0, fim: 0, total: null };

  return {
    inicio: Number(casamento[1]),
    fim: Number(casamento[2]),
    total: Number(casamento[3]),
  };
}

function extrairMensagem(corpo: unknown, padrao: string): string {
  if (Array.isArray(corpo)) {
    const partes = corpo.filter((item) => typeof item === 'string');
    if (partes.length > 0) return partes.join(' — ');
  }
  return padrao;
}

async function executar<T>(
  caminho: string,
  opcoes: OpcoesRequisicao,
  jaRepetiu: boolean,
): Promise<RespostaGlpi<T>> {
  const config = lerConfigGlpi();
  const sessionToken = await obterSessionToken();

  const resposta = await fetch(montarUrl(config.urlApi, caminho, opcoes.parametros), {
    method: opcoes.metodo ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'App-Token': config.appToken,
      'Session-Token': sessionToken,
    },
    body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
    cache: 'no-store',
  });

  if (resposta.status === 401 && !jaRepetiu) {
    invalidarSessao();
    return executar<T>(caminho, opcoes, true);
  }

  const texto = await resposta.text();
  const corpo = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    throw new ErroGlpi(
      extrairMensagem(corpo, `GLPI respondeu ${resposta.status} em ${caminho}`),
      { status: resposta.status, codigo: 'REQUISICAO_RECUSADA', detalhe: corpo },
    );
  }

  const faixa = lerContentRange(resposta.headers.get('Content-Range'));

  return {
    dados: corpo as T,
    totalDisponivel: faixa.total,
    faixa: faixa.total === null ? null : { inicio: faixa.inicio, fim: faixa.fim },
  };
}

export function requisitarGlpi<T>(
  caminho: string,
  opcoes: OpcoesRequisicao = {},
): Promise<RespostaGlpi<T>> {
  return executar<T>(caminho, opcoes, false);
}
