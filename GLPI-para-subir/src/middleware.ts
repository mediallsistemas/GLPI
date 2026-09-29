import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_SESSAO, verificarSessao } from '@/lib/autenticacao/sessao-usuario';

export async function middleware(requisicao: NextRequest) {
  const usuario = await verificarSessao(requisicao.cookies.get(COOKIE_SESSAO)?.value);
  if (usuario) return NextResponse.next();

  const { pathname, search } = requisicao.nextUrl;

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ erro: 'Sessão expirada ou inexistente.', codigo: 'NAO_AUTENTICADO' }, { status: 401 });
  }

  const destino = new URL('/login', requisicao.url);
  if (pathname !== '/') destino.searchParams.set('de', `${pathname}${search}`);
  else if (search) destino.searchParams.set('de', `/${search}`);

  const resposta = NextResponse.redirect(destino);
  resposta.cookies.delete(COOKIE_SESSAO);
  return resposta;
}

export const config = {
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
};
