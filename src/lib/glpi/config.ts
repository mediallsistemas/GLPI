import { ErroGlpi } from './erros';

export type ConfigGlpi = {
  urlApi: string;
  appToken: string;
  userToken: string;
  grupoPainel: string;
};

const NOME_PADRAO_GRUPO_PAINEL = 'Painel de chamados';

let cache: ConfigGlpi | null = null;

function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor || valor.trim() === '') {
    throw new ErroGlpi(
      `Variável de ambiente ${nome} não configurada. Veja .env.example.`,
      { status: 500, codigo: 'CONFIGURACAO_INVALIDA' },
    );
  }
  return valor.trim();
}

export function lerConfigGlpi(): ConfigGlpi {
  if (cache) return cache;

  const urlApi = obrigatoria('GLPI_API_URL').replace(/\/+$/, '');
  if (!/^https?:\/\//.test(urlApi)) {
    throw new ErroGlpi('GLPI_API_URL precisa começar com http:// ou https://', {
      status: 500,
      codigo: 'CONFIGURACAO_INVALIDA',
    });
  }

  cache = {
    urlApi,
    appToken: obrigatoria('GLPI_APP_TOKEN'),
    userToken: obrigatoria('GLPI_USER_TOKEN'),
    grupoPainel: process.env.GLPI_GRUPO_PAINEL?.trim() || NOME_PADRAO_GRUPO_PAINEL,
  };

  return cache;
}

export function limparCacheConfig(): void {
  cache = null;
}
