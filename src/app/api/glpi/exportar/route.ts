import { NextRequest } from 'next/server';
import { exigirAcesso, exigirUnidades } from '@/lib/autenticacao/acesso';
import { nomeDoArquivo } from '@/lib/exportacao/comum';
import { gerarExcel } from '@/lib/exportacao/excel';
import { gerarPdf } from '@/lib/exportacao/pdf';
import { intervaloDoPainel, montarRelatorio } from '@/lib/glpi';
import { respostaDeErro } from '@/lib/http/resposta';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TIPOS = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
} as const;

export async function GET(requisicao: NextRequest) {
  try {
    const usuario = await exigirAcesso();
    const parametros = requisicao.nextUrl.searchParams;
    const formato = parametros.get('formato') === 'pdf' ? 'pdf' : 'xlsx';
    const intervalo = intervaloDoPainel({
      dias: parametros.get('dias'),
      de: parametros.get('de'),
      ate: parametros.get('ate'),
    });
    const relatorio = await montarRelatorio(intervalo, await exigirUnidades(usuario, parametros.get('unidade')));
    const arquivo = formato === 'pdf' ? gerarPdf(relatorio) : await gerarExcel(relatorio);

    return new Response(new Uint8Array(arquivo), {
      headers: {
        'Content-Type': TIPOS[formato],
        'Content-Disposition': `attachment; filename="${nomeDoArquivo(relatorio, formato)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
