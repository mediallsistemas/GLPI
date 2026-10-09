import { lerConfigGlpi } from './config';
import { ErroGlpi } from './erros';

export type UsuarioGlpiAutenticado = {
  id: number;
  login: string;
  nome: string;
  perfil: string;
};

type SessaoCompletaGlpi = {
  session?: {
    glpiID?: number | string;
    glpiname?: string;
    glpifirstname?: string | null;
    glpirealname?: string | null;
    glpiactiveprofile?: { name?: string; interface?: string };
  };
};

function cabecalhos(config: ReturnType<typeof lerConfigGlpi>, sessionToken: string) {
  return { 'App-Token': config.appToken, 'Session-Token': sessionToken };
}

async function lerJson<T>(resposta: Response): Promise<T | null> {
  return (await resposta.json().catch(() => null)) as T | null;
}

function credenciaisRecusadas(resposta: Response, corpo: unknown): boolean {
  if (resposta.status === 401) return true;
  return Array.isArray(corpo) && corpo[0] === 'ERROR_GLPI_LOGIN';
}

export async function autenticarUsuarioGlpi(
  login: string,
  senha: string,
): Promise<UsuarioGlpiAutenticado> {
  const config = lerConfigGlpi();
  const credenciais = Buffer.from(`${login}:${senha}`, 'utf8').toString('base64');

  const abertura = await fetch(`${config.urlApi}/initSession`, {
    headers: {
      'Content-Type': 'application/json',
      'App-Token': config.appToken,
      Authorization: `Basic ${credenciais}`,
    },
    cache: 'no-store',
  });
  const corpoAbertura = await lerJson<{ session_token?: string }>(abertura);

  if (!abertura.ok || !corpoAbertura?.session_token) {
    if (Array.isArray(corpoAbertura) && corpoAbertura[0] === 'ERROR_LOGIN_WITH_CREDENTIALS_DISABLED') {
      throw new ErroGlpi(
        'O login com senha está desativado na API do GLPI. Peça ao administrador para ativar "Habilitar login com credenciais" em Configurar → Geral → API.',
        { status: 503, codigo: 'LOGIN_COM_SENHA_DESATIVADO' },
      );
    }
    if (credenciaisRecusadas(abertura, corpoAbertura)) {
      throw new ErroGlpi('Usuário ou senha inválidos.', {
        status: 401,
        codigo: 'CREDENCIAIS_INVALIDAS',
      });
    }
    throw new ErroGlpi('Não foi possível validar o acesso no GLPI.', {
      status: 502,
      codigo: 'SESSAO_NAO_INICIADA',
      detalhe: corpoAbertura,
    });
  }

  const sessionToken = corpoAbertura.session_token;

  try {
    const respostaSessao = await fetch(`${config.urlApi}/getFullSession`, {
      headers: cabecalhos(config, sessionToken),
      cache: 'no-store',
    });
    const sessao = (await lerJson<SessaoCompletaGlpi>(respostaSessao))?.session;

    if (!sessao?.glpiID) {
      throw new ErroGlpi('O GLPI não devolveu os dados do usuário.', {
        status: 502,
        codigo: 'SESSAO_SEM_USUARIO',
      });
    }

    const loginGlpi = sessao.glpiname ?? login;
    const nomeCompleto = [sessao.glpifirstname, sessao.glpirealname].filter(Boolean).join(' ').trim();

    return {
      id: Number(sessao.glpiID),
      login: loginGlpi,
      nome: nomeCompleto || loginGlpi,
      perfil: sessao.glpiactiveprofile?.name ?? 'Sem perfil',
    };
  } finally {
    await fetch(`${config.urlApi}/killSession`, {
      headers: cabecalhos(config, sessionToken),
      cache: 'no-store',
    }).catch(() => undefined);
  }
}
