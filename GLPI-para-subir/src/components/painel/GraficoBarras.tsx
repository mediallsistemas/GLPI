'use client';

import { useState } from 'react';
import { IconeStatus } from '@/components/IconeStatus';
import { formatarNumero, formatarPercentual } from '@/lib/formatacao';
import { FatiaPainel } from '@/lib/glpi/tipos';

export function GraficoBarras({
  fatias,
  vazio = 'Nenhum chamado.',
}: {
  fatias: FatiaPainel[];
  vazio?: string;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const maximo = Math.max(...fatias.map((f) => f.valor), 0);
  const total = fatias.reduce((soma, f) => soma + f.valor, 0);

  if (total === 0) {
    return <p className="py-6 text-sm text-texto-suave">{vazio}</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {fatias.map((fatia, indice) => {
        const selecionado = ativo === indice;
        return (
          <li
            key={fatia.rotulo}
            tabIndex={0}
            onPointerEnter={() => setAtivo(indice)}
            onPointerLeave={() => setAtivo(null)}
            onFocus={() => setAtivo(indice)}
            onBlur={() => setAtivo(null)}
            aria-label={`${fatia.rotulo}: ${fatia.valor} (${formatarPercentual(fatia.valor / total)})`}
            className="relative grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 rounded-md px-1 py-1 outline-none hover:bg-trilho/60 focus-visible:ring-2 focus-visible:ring-serie-1 sm:grid-cols-[minmax(0,14rem)_1fr]"
          >
            <span className="flex min-w-0 items-center gap-2 text-sm text-texto-secundario">
              {fatia.status ? <IconeStatus status={fatia.status} /> : null}
              <span className="truncate" title={fatia.rotulo}>
                {fatia.rotulo}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-4 rounded-r transition-opacity"
                style={{
                  width: `${maximo ? (fatia.valor / maximo) * 85 : 0}%`,
                  minWidth: fatia.valor > 0 ? 2 : 0,
                  background: 'var(--serie-1)',
                  opacity: ativo === null || selecionado ? 1 : 0.55,
                }}
              />
              <span className="text-sm font-medium tabular-nums">{formatarNumero(fatia.valor)}</span>
            </span>
            {selecionado ? (
              <span className="pointer-events-none absolute right-1 -top-7 z-10 whitespace-nowrap rounded-lg border border-borda bg-superficie px-2.5 py-1 text-xs shadow-lg">
                <strong className="tabular-nums">{formatarPercentual(fatia.valor / total)}</strong>{' '}
                <span className="text-texto-secundario">do total</span>
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
