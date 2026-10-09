'use server';

import { cookies } from 'next/headers';
import { ehAdministrador } from '@/lib/autenticacao/acesso';
import { COOKIE_SESSAO, verificarSessao } from '@/lib/autenticacao/sessao-usuario';
import { mensagemDeErro } from '@/lib/glpi/erros';
import { bloquearUsuario, desbloquearUsuario } from '@/lib/glpi/recursos/acesso-painel';

export type ResultadoAcesso = { ok: true } | { ok: false; erro: string };

async function administradorAutenticado(): Promise<boolean> {
  const usuario = await verificarSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  return usuario !== null && ehAdministrador(usuario.login);
}

export async function definirAcesso(usuarioId: number, permitir: boolean): Promise<ResultadoAcesso> {
  if (!(await administradorAutenticado())) {
    return { ok: false, erro: 'Sua sessão não permite alterar acessos.' };
  }
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return { ok: false, erro: 'Usuário inválido.' };
  }

  try {
    if (permitir) await desbloquearUsuario(usuarioId);
    else await bloquearUsuario(usuarioId);
    return { ok: true };
  } catch (erro) {
    console.error('[usuarios] falha ao alterar acesso no GLPI', erro);
    return { ok: false, erro: mensagemDeErro(erro) };
  }
}
