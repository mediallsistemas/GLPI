'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, MouseEvent, useOptimistic, useState, useTransition } from 'react';
import { IntervaloPainel, PeriodoPainel } from '@/lib/glpi/tipos';

const CLASSE_DATA =
  'rounded border border-white/20 bg-white/10 px-2 py-1 text-sm text-marinho-texto [color-scheme:dark] outline-none focus:border-destaque';

export function FiltroPeriodo({
  intervalo,
  opcoes,
  hoje,
}: {
  intervalo: IntervaloPainel;
  opcoes: PeriodoPainel[];
  hoje: string;
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [selecionado, selecionar] = useOptimistic<PeriodoPainel | 'datas' | null>(intervalo.atalho ?? 'datas');
  const [de, setDe] = useState(intervalo.inicio);
  const [ate, setAte] = useState(intervalo.fim);
  const intervaloInvalido = !de || !ate || de > ate;

  function navegar(alvo: PeriodoPainel | 'datas', destino: string) {
    iniciarTransicao(() => {
      selecionar(alvo);
      router.push(destino, { scroll: false });
    });
  }

  function escolherAtalho(evento: MouseEvent<HTMLAnchorElement>, dias: PeriodoPainel) {
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.button !== 0) return;
    evento.preventDefault();
    if (dias === selecionado) return;
    navegar(dias, `/?dias=${dias}`);
  }

  function aplicarDatas(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (intervaloInvalido) return;
    navegar('datas', `/?de=${de}&ate=${ate}`);
  }

  return (
    <div aria-busy={pendente || undefined} className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <nav aria-label="Período" className="flex items-center gap-2">
        <span className="text-sm text-marinho-suave">Últimos</span>
        <div className="inline-flex rounded-md bg-white/10 p-0.5">
          {opcoes.map((dias) => {
            const ativo = dias === selecionado;
            return (
              <Link
                key={dias}
                href={`/?dias=${dias}`}
                scroll={false}
                onClick={(evento) => escolherAtalho(evento, dias)}
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
      </nav>

      <form onSubmit={aplicarDatas} aria-label="Intervalo de datas" className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-sm text-marinho-suave">
          De
          <input
            type="date"
            value={de}
            max={ate || hoje}
            onChange={(evento) => setDe(evento.target.value)}
            className={CLASSE_DATA}
            required
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-marinho-suave">
          até
          <input
            type="date"
            value={ate}
            min={de || undefined}
            max={hoje}
            onChange={(evento) => setAte(evento.target.value)}
            className={CLASSE_DATA}
            required
          />
        </label>
        <button
          type="submit"
          disabled={intervaloInvalido || pendente}
          className={`rounded px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            selecionado === 'datas'
              ? 'bg-destaque font-semibold text-destaque-texto'
              : 'bg-white/10 text-marinho-texto hover:bg-white/15'
          }`}
        >
          Aplicar
        </button>
      </form>

      <span role="status" className="min-w-[5.5rem] text-sm text-marinho-suave">
        {pendente ? 'Atualizando…' : ''}
      </span>
    </div>
  );
}
