export function escala(maximo: number): { topo: number; passo: number } {
  if (maximo <= 0) return { topo: 4, passo: 1 };
  const bruto = maximo / 4;
  const magnitude = 10 ** Math.floor(Math.log10(bruto));
  const normalizado = bruto / magnitude;
  const fator = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;
  const passo = Math.max(1, fator * magnitude);
  return { topo: Math.ceil(maximo / passo) * passo, passo };
}
