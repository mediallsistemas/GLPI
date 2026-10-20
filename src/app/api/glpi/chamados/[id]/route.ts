import { NextResponse } from 'next/server';
import { exigirAcesso, exigirUnidades } from '@/lib/autenticacao/acesso';
import { ErroGlpi, obterChamado } from '@/lib/glpi';
import { respostaDeErro } from '@/lib/http/resposta';

export const dynamic = 'force-dynamic';

export async function GET(
  _requisicao: Request,
  contexto: { params: Promise<{ id: string }> },
) {
  try {
    const usuario = await exigirAcesso();
    const { id } = await contexto.params;
    const identificador = Number(id);

    if (!Number.isInteger(identificador) || identificador <= 0) {
      throw new ErroGlpi('Identificador de chamado inválido', {
        status: 400,
        codigo: 'ID_INVALIDO',
      });
    }

    const { permitidas } = await exigirUnidades(usuario, null);
    return NextResponse.json(await obterChamado(identificador, permitidas));
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
