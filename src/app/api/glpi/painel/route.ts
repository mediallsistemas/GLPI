import { NextRequest, NextResponse } from 'next/server';
import { exigirAcesso, exigirUnidades } from '@/lib/autenticacao/acesso';
import { intervaloDoPainel, montarPainel } from '@/lib/glpi';
import { respostaDeErro } from '@/lib/http/resposta';

export const dynamic = 'force-dynamic';

export async function GET(requisicao: NextRequest) {
  try {
    const usuario = await exigirAcesso();
    const parametros = requisicao.nextUrl.searchParams;
    const intervalo = intervaloDoPainel({
      dias: parametros.get('dias'),
      de: parametros.get('de'),
      ate: parametros.get('ate'),
    });
    const { criterios } = await exigirUnidades(usuario, parametros.get('unidade'));
    return NextResponse.json(await montarPainel(intervalo, criterios));
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
