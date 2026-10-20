const CLASSE_BOTAO = 'rounded bg-white/10 px-3 py-1.5 text-sm text-marinho-texto transition-colors hover:bg-white/15';

export function BotoesExportar({ consulta }: { consulta: string }) {
  return (
    <div aria-label="Exportar" role="group" className="flex items-center gap-2">
      <span className="text-sm text-marinho-suave">Exportar</span>
      <a href={`/api/glpi/exportar?formato=xlsx&${consulta}`} download className={CLASSE_BOTAO}>
        Excel
      </a>
      <a href={`/api/glpi/exportar?formato=pdf&${consulta}`} download className={CLASSE_BOTAO}>
        PDF
      </a>
    </div>
  );
}
