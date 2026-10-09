const ENTIDADES_HTML: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': "'",
  '&#39;': "'",
  '&#60;': '<',
  '&#62;': '>',
};

export function textoLimpo(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const limpo = String(valor)
    .replace(/&(amp|lt|gt|quot|#0?39|#60|#62);/g, (entidade) => ENTIDADES_HTML[entidade])
    .replace(/<[^>]*>/g, '')
    .trim();
  return limpo === '' ? null : limpo;
}
