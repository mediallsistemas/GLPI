import { NextRequest, NextResponse } from 'next/server';
import { montarPainel, periodoValido } from '@/lib/glpi';
import { respostaDeErro } from '@/lib/http/resposta';

export const dynamic = 'force-dynamic';

export async function GET(requisicao: NextRequest) {
  try {
    const periodo = periodoValido(requisicao.nextUrl.searchParams.get('dias'));
    return NextResponse.json(await montarPainel(periodo));
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
