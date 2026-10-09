'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MouseEvent, useOptimistic, useTransition } from 'react';
import { PeriodoPainel } from '@/lib/glpi/tipos';

export function FiltroPeriodo({
  atual,
  opcoes,
}: {
  atual: PeriodoPainel;
  opcoes: PeriodoPainel[];
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [selecionado, selecionar] = useOptimistic(atual);

  function escolher(evento: MouseEvent<HTMLAnchorElement>, dias: PeriodoPainel) {
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.button !== 0) return;
    evento.preventDefault();
    if (dias === selecionado) return;
    iniciarTransicao(() => {
      selecionar(dias);
      router.push(`/?dias=${dias}`, { scroll: false });
    });
  }

  return (
    <nav aria-label="Período" aria-busy={pendente || undefined} className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-marinho-suave">Últimos</span>
      <div className="inline-flex rounded-md bg-white/10 p-0.5">
        {opcoes.map((dias) => {
          const ativo = dias === selecionado;
          return (
            <Link
              key={dias}
              href={`/?dias=${dias}`}
              scroll={false}
              onClick={(evento) => escolher(evento, dias)}
              aria-current={ativo ? 'page' : undefined}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                ativo ? 'bg-destaque font-semibold text-destaque-texto' : 'text-marinho-texto hover:bg-white/10'
              }`}
            >
              {dias} dias
            </Link>
          );
        })}
      </div>
      <span role="status" className="min-w-[5.5rem] text-sm text-marinho-suave">
        {pendente ? 'Atualizando…' : ''}
      </span>
    </nav>
  );
}
