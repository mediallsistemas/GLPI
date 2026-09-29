import Link from 'next/link';
import { PeriodoPainel } from '@/lib/glpi/tipos';

export function FiltroPeriodo({
  atual,
  opcoes,
}: {
  atual: PeriodoPainel;
  opcoes: PeriodoPainel[];
}) {
  return (
    <nav aria-label="Período" className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-marinho-suave">Últimos</span>
      <div className="inline-flex rounded-md bg-white/10 p-0.5">
        {opcoes.map((dias) => {
          const selecionado = dias === atual;
          return (
            <Link
              key={dias}
              href={`/?dias=${dias}`}
              scroll={false}
              aria-current={selecionado ? 'page' : undefined}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                selecionado
                  ? 'bg-destaque font-semibold text-destaque-texto'
                  : 'text-marinho-texto hover:bg-white/10'
              }`}
            >
              {dias} dias
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
