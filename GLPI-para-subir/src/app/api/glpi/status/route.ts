import { NextResponse } from 'next/server';
import { lerConfigGlpi, requisitarGlpi } from '@/lib/glpi';
import { respostaDeErro } from '@/lib/http/resposta';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = lerConfigGlpi();
    const resposta = await requisitarGlpi<Record<string, unknown>>('getFullSession');

    return NextResponse.json({
      conectado: true,
      urlApi: config.urlApi,
      sessao: resposta.dados,
    });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
