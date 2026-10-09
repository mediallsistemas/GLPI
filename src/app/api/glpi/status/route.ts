import { NextResponse } from 'next/server';
import { exigirAcesso } from '@/lib/autenticacao/acesso';
import { lerConfigGlpi, requisitarGlpi } from '@/lib/glpi';
import { respostaDeErro } from '@/lib/http/resposta';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await exigirAcesso({ somenteAdministrador: true });
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
