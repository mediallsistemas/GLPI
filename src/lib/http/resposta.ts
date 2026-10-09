import { NextResponse } from 'next/server';
import { ehErroGlpi, mensagemDeErro } from '@/lib/glpi/erros';

export function respostaDeErro(erro: unknown): NextResponse {
  if (ehErroGlpi(erro)) {
    return NextResponse.json(
      { erro: erro.message, codigo: erro.codigo },
      { status: erro.status },
    );
  }

  return NextResponse.json(
    { erro: mensagemDeErro(erro), codigo: 'ERRO_INESPERADO' },
    { status: 500 },
  );
}
