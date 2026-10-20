import { cookies } from 'next/headers';
import { COOKIE_SESSAO, UsuarioSessao, verificarSessao } from '@/lib/autenticacao/sessao-usuario';
import { ErroGlpi } from '@/lib/glpi/erros';
import { usuarioBloqueado } from '@/lib/glpi/recursos/acesso-painel';
import { autorizacoesDoUsuario } from '@/lib/glpi/recursos/autorizacoes';
import { filtroDeUnidades, FiltroUnidades } from '@/lib/glpi/recursos/entidades';
import { EscopoUnidades } from '@/lib/glpi/tipos';

export type NivelAcesso = 'administrador' | 'liberado' | 'bloqueado';

function normalizarLogin(login: string): string {
  return login.trim().toLowerCase();
}

export function administradoresConfigurados(): string[] {
  return (process.env.PAINEL_ADMINISTRADORES ?? '')
    .split(',')
    .map(normalizarLogin)
    .filter(Boolean);
}

export function ehAdministrador(login: string): boolean {
  return administradoresConfigurados().includes(normalizarLogin(login));
}

export async function nivelDeAcesso(usuario: { id: number; login: string }): Promise<NivelAcesso> {
  if (ehAdministrador(usuario.login)) return 'administrador';
  return (await usuarioBloqueado(usuario.id)) ? 'bloqueado' : 'liberado';
}

export async function acessoAindaValido(usuario: { id: number; login: string }): Promise<boolean> {
  if (ehAdministrador(usuario.login)) return true;
  try {
    return !(await usuarioBloqueado(usuario.id));
  } catch (erro) {
    console.error('[acesso] não foi possível reconferir o bloqueio no GLPI', erro);
    return true;
  }
}

export async function exigirAcesso({ somenteAdministrador = false } = {}): Promise<UsuarioSessao> {
  const usuario = await verificarSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  if (!usuario) {
    throw new ErroGlpi('Sessão expirada ou inexistente.', { status: 401, codigo: 'NAO_AUTENTICADO' });
  }

  const permitido = somenteAdministrador ? ehAdministrador(usuario.login) : await acessoAindaValido(usuario);
  if (!permitido) {
    throw new ErroGlpi('Seu usuário não tem acesso a este recurso.', { status: 403, codigo: 'SEM_ACESSO' });
  }

  return usuario;
}

export async function escopoDoUsuario(usuario: { id: number; login: string }): Promise<EscopoUnidades> {
  if (ehAdministrador(usuario.login)) return { completo: true };
  return { completo: false, autorizacoes: await autorizacoesDoUsuario(usuario.id) };
}

export async function filtroDoUsuario(
  usuario: { id: number; login: string },
  idUnidade: unknown,
): Promise<FiltroUnidades> {
  return filtroDeUnidades(await escopoDoUsuario(usuario), idUnidade);
}

export async function exigirUnidades(
  usuario: { id: number; login: string },
  idUnidade: unknown,
): Promise<FiltroUnidades> {
  const filtro = await filtroDoUsuario(usuario, idUnidade);
  if (filtro.semUnidade) {
    throw new ErroGlpi('Seu usuário não está vinculado a nenhuma unidade no GLPI.', {
      status: 403,
      codigo: 'SEM_UNIDADE',
    });
  }
  return filtro;
}
