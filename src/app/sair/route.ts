import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_SESSAO } from '@/lib/autenticacao/sessao-usuario';

const AVISOS_CONHECIDOS = ['acesso-removido'];

export async function GET(requisicao: NextRequest) {
  const destino = new URL('/login', requisicao.url);
  const aviso = requisicao.nextUrl.searchParams.get('aviso');
  if (aviso && AVISOS_CONHECIDOS.includes(aviso)) destino.searchParams.set('aviso', aviso);

  const resposta = NextResponse.redirect(destino);
  resposta.cookies.delete(COOKIE_SESSAO);
  return resposta;
}
