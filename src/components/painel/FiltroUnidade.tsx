'use client';

import { useRouter } from 'next/navigation';
import { ChangeEvent, useOptimistic, useTransition } from 'react';
import { Unidade } from '@/lib/glpi/tipos';

export function FiltroUnidade({
  unidades,
  selecionada,
  consultaPeriodo,
  rotuloTodas,
}: {
  unidades: Unidade[];
  selecionada: number | null;
  consultaPeriodo: string;
  rotuloTodas: string;
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [valor, definirValor] = useOptimistic(selecionada === null ? '' : String(selecionada));

  if (unidades.length === 0) return null;
  if (unidades.length === 1) {
    return (
      <p className="text-sm text-marinho-suave">
        Unidade <span className="font-semibold text-marinho-texto">{unidades[0].nome}</span>
      </p>
    );
  }

  function escolher(evento: ChangeEvent<HTMLSelectElement>) {
    const escolhida = evento.target.value;
    iniciarTransicao(() => {
      definirValor(escolhida);
      router.push(`/?${consultaPeriodo}${escolhida ? `&unidade=${escolhida}` : ''}`, { scroll: false });
    });
  }

  return (
    <label aria-busy={pendente || undefined} className="flex items-center gap-1.5 text-sm text-marinho-suave">
      Unidade
      <select
        value={valor}
        onChange={escolher}
        className="max-w-[16rem] rounded border border-white/20 bg-white/10 px-2 py-1 text-sm text-marinho-texto [color-scheme:dark] outline-none focus:border-destaque"
      >
        <option value="" className="bg-marinho text-marinho-texto">{rotuloTodas}</option>
        {unidades.map((unidade) => (
          <option key={unidade.id} value={unidade.id} className="bg-marinho text-marinho-texto">
            {unidade.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
