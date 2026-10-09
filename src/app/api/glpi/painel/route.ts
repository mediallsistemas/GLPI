import { NextRequest, NextResponse } from 'next/server';
import { exigirAcesso } from '@/lib/autenticacao/acesso';
import { intervaloDoPainel, montarPainel } from '@/lib/glpi';
import { respostaDeErro } from '@/lib/http/resposta';

export const dynamic = 'force-dynamic';

export async function GET(requisicao: NextRequest) {
  try {
    await exigirAcesso();
    const parametros = requisicao.nextUrl.searchParams;
    const intervalo = intervaloDoPainel({
      dias: parametros.get('dias'),
      de: parametros.get('de'),
      ate: parametros.get('ate'),
    });
    return NextResponse.json(await montarPainel(intervalo));
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
