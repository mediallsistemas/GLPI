const JANELA_MS = 15 * 60 * 1000;
const MAXIMO_FALHAS = 5;

const falhas = new Map<string, number[]>();

function recentes(chave: string): number[] {
  const limite = Date.now() - JANELA_MS;
  const lista = (falhas.get(chave) ?? []).filter((instante) => instante > limite);
  if (lista.length) falhas.set(chave, lista);
  else falhas.delete(chave);
  return lista;
}

export function minutosAteLiberar(chave: string): number {
  const lista = recentes(chave);
  if (lista.length < MAXIMO_FALHAS) return 0;
  return Math.ceil((lista[0] + JANELA_MS - Date.now()) / 60_000);
}

export function registrarFalha(chave: string): void {
  falhas.set(chave, [...recentes(chave), Date.now()]);
}

export function limparFalhas(chave: string): void {
  falhas.delete(chave);
}
