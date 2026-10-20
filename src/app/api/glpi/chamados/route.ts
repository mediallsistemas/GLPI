import { NextRequest, NextResponse } from 'next/server';
import { exigirAcesso, exigirUnidades } from '@/lib/autenticacao/acesso';
import { listarChamados } from '@/lib/glpi';
import { respostaDeErro } from '@/lib/http/resposta';

export const dynamic = 'force-dynamic';

function numero(valor: string | null): number | undefined {
  if (valor === null) return undefined;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : undefined;
}

export async function GET(requisicao: NextRequest) {
  try {
    const usuario = await exigirAcesso();
    const parametros = requisicao.nextUrl.searchParams;
    const { criterios } = await exigirUnidades(usuario, parametros.get('unidade'));

    const pagina = await listarChamados({
      inicio: numero(parametros.get('inicio')),
      limite: numero(parametros.get('limite')),
      ordem: parametros.get('ordem') === 'ASC' ? 'ASC' : 'DESC',
      criterios,
    });

    return NextResponse.json(pagina);
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
