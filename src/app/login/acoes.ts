'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { nivelDeAcesso } from '@/lib/autenticacao/acesso';
import {
  limparFalhas,
  minutosAteLiberar,
  registrarFalha,
} from '@/lib/autenticacao/limite-tentativas';
import {
  assinarSessao,
  COOKIE_SESSAO,
  DURACAO_SESSAO_SEGUNDOS,
} from '@/lib/autenticacao/sessao-usuario';
import { autenticarUsuarioGlpi } from '@/lib/glpi/autenticacao';
import { ehErroGlpi } from '@/lib/glpi/erros';

export type EstadoLogin = { erro: string | null; login: string };

function destinoSeguro(valor: FormDataEntryValue | null): string {
  const destino = typeof valor === 'string' ? valor : '';
  return destino.startsWith('/') && !destino.startsWith('//') && !destino.startsWith('/login')
    ? destino
    : '/';
}

async function ipDaRequisicao(): Promise<string> {
  const cabecalhos = await headers();
  return cabecalhos.get('x-forwarded-for')?.split(',')[0]?.trim() || cabecalhos.get('x-real-ip') || 'local';
}

export async function entrar(_anterior: EstadoLogin, dados: FormData): Promise<EstadoLogin> {
  const login = String(dados.get('login') ?? '').trim();
  const senha = String(dados.get('senha') ?? '');

  if (!login || !senha) {
    return { erro: 'Informe usuário e senha.', login };
  }

  const chave = `${await ipDaRequisicao()}|${login.toLowerCase()}`;
  const espera = minutosAteLiberar(chave);
  if (espera > 0) {
    return { erro: `Muitas tentativas. Tente de novo em ${espera} min.`, login };
  }

  try {
    const usuario = await autenticarUsuarioGlpi(login, senha);
    limparFalhas(chave);

    if ((await nivelDeAcesso(usuario)) === 'bloqueado') {
      return {
        erro: 'Seu acesso a este painel está bloqueado. Fale com um administrador.',
        login,
      };
    }

    (await cookies()).set(COOKIE_SESSAO, await assinarSessao(usuario), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: DURACAO_SESSAO_SEGUNDOS,
    });
  } catch (erro) {
    if (ehErroGlpi(erro) && erro.codigo === 'CREDENCIAIS_INVALIDAS') {
      registrarFalha(chave);
      return { erro: erro.message, login };
    }
    if (ehErroGlpi(erro) && erro.codigo === 'LOGIN_COM_SENHA_DESATIVADO') {
      return { erro: erro.message, login };
    }
    console.error('[login] falha ao autenticar no GLPI', erro);
    return { erro: 'Não foi possível falar com o GLPI agora. Tente novamente.', login };
  }

  redirect(destinoSeguro(dados.get('destino')));
}

export async function sair(): Promise<void> {
  (await cookies()).delete(COOKIE_SESSAO);
  redirect('/login');
}
