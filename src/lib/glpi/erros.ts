export class ErroGlpi extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly detalhe?: unknown;

  constructor(
    mensagem: string,
    opcoes: { status?: number; codigo?: string; detalhe?: unknown } = {},
  ) {
    super(mensagem);
    this.name = 'ErroGlpi';
    this.status = opcoes.status ?? 500;
    this.codigo = opcoes.codigo ?? 'ERRO_GLPI';
    this.detalhe = opcoes.detalhe;
  }
}

export function ehErroGlpi(erro: unknown): erro is ErroGlpi {
  return erro instanceof ErroGlpi;
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message;
  return String(erro);
}
