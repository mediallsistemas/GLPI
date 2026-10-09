import { cookies } from 'next/headers';
import { COOKIE_SESSAO, UsuarioSessao, verificarSessao } from '@/lib/autenticacao/sessao-usuario';
import { ErroGlpi } from '@/lib/glpi/erros';
import { usuarioLiberado } from '@/lib/glpi/recursos/acesso-painel';

export type NivelAcesso = 'administrador' | 'liberado' | 'sem-acesso';

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
  return (await usuarioLiberado(usuario.id)) ? 'liberado' : 'sem-acesso';
}

export async function acessoAindaValido(usuario: { id: number; login: string }): Promise<boolean> {
  if (ehAdministrador(usuario.login)) return true;
  try {
    return await usuarioLiberado(usuario.id);
  } catch (erro) {
    console.error('[acesso] não foi possível reconferir a liberação no GLPI', erro);
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
