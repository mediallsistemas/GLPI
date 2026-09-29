'use client';

import { KeyboardEvent, PointerEvent, useEffect, useRef, useState } from 'react';
import { formatarDiaCurto, formatarDiaLongo, formatarNumero } from '@/lib/formatacao';
import { PontoDiario } from '@/lib/glpi/tipos';

const ALTURA = 240;
const MARGEM = { topo: 12, direita: 48, base: 28, esquerda: 44 };
const DISTANCIA_MINIMA_ROTULOS = 14;
const LARGURA_TOOLTIP = 176;

const SERIES = [
  { chave: 'abertos', rotulo: 'Abertos', cor: 'var(--serie-1)' },
  { chave: 'solucionados', rotulo: 'Solucionados', cor: 'var(--serie-2)' },
] as const;

function escala(maximo: number): { topo: number; passo: number } {
  if (maximo <= 0) return { topo: 4, passo: 1 };
  const bruto = maximo / 4;
  const magnitude = 10 ** Math.floor(Math.log10(bruto));
  const normalizado = bruto / magnitude;
  const fator = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;
  const passo = Math.max(1, fator * magnitude);
  return { topo: Math.ceil(maximo / passo) * passo, passo };
}

function posicaoTooltip(xAtivo: number, largura: number): number {
  const aDireita = xAtivo + 12;
  if (aDireita + LARGURA_TOOLTIP <= largura) return aDireita;
  return Math.max(0, xAtivo - 12 - LARGURA_TOOLTIP);
}

function LinhaChave({ cor }: { cor: string }) {
  return <span aria-hidden className="inline-block h-0.5 w-3 rounded-full" style={{ background: cor }} />;
}

export function GraficoEvolucao({ pontos }: { pontos: PontoDiario[] }) {
  const container = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);
  const [ativo, setAtivo] = useState<number | null>(null);

  useEffect(() => {
    const elemento = container.current;
    if (!elemento) return;
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width));
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const total = pontos.length;
  const areaX = Math.max(1, largura - MARGEM.esquerda - MARGEM.direita);
  const areaY = ALTURA - MARGEM.topo - MARGEM.base;
  const passoX = total > 1 ? areaX / (total - 1) : 0;
  const { topo, passo } = escala(Math.max(...pontos.flatMap((p) => [p.abertos, p.solucionados]), 0));

  const x = (indice: number) => MARGEM.esquerda + indice * passoX;
  const y = (valor: number) => MARGEM.topo + areaY - (valor / topo) * areaY;

  const marcasY = Array.from({ length: topo / passo + 1 }, (_, i) => i * passo);
  const intervaloX = Math.max(1, Math.ceil(total / Math.max(2, Math.floor(areaX / 72))));
  const marcasX = pontos
    .map((_, indice) => indice)
    .filter((indice) => (total - 1 - indice) % intervaloX === 0);

  const ultimo = pontos[total - 1];
  const rotulosFinaisCabem =
    ultimo !== undefined &&
    Math.abs(y(ultimo.abertos) - y(ultimo.solucionados)) >= DISTANCIA_MINIMA_ROTULOS;

  function aoMover(evento: PointerEvent<SVGRectElement>) {
    const caixa = evento.currentTarget.getBoundingClientRect();
    const indice = Math.round((evento.clientX - caixa.left) / (passoX || 1));
    setAtivo(Math.min(total - 1, Math.max(0, indice)));
  }

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return;
    evento.preventDefault();
    const delta = evento.key === 'ArrowLeft' ? -1 : 1;
    setAtivo((atual) => Math.min(total - 1, Math.max(0, (atual ?? total - 1) + delta)));
  }

  const pontoAtivo = ativo === null ? null : pontos[ativo];
  const somaAbertos = pontos.reduce((soma, p) => soma + p.abertos, 0);
  const somaSolucionados = pontos.reduce((soma, p) => soma + p.solucionados, 0);

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-4 text-xs text-texto-secundario">
        {SERIES.map((serie) => (
          <li key={serie.chave} className="flex items-center gap-1.5">
            <LinhaChave cor={serie.cor} />
            {serie.rotulo}
          </li>
        ))}
      </ul>

      <div
        ref={container}
        className="relative w-full min-w-0 rounded outline-none focus-visible:ring-2 focus-visible:ring-serie-1"
        tabIndex={0}
        onKeyDown={aoTeclar}
        onFocus={() => setAtivo((atual) => atual ?? total - 1)}
        onBlur={() => setAtivo(null)}
        aria-label={`Chamados por dia: ${somaAbertos} abertos e ${somaSolucionados} solucionados no período. Use as setas para navegar pelos dias.`}
      >
        <svg width={largura} height={ALTURA} className="block" aria-hidden>
          {marcasY.map((valor) => (
            <g key={valor}>
              <line
                x1={MARGEM.esquerda}
                x2={MARGEM.esquerda + areaX}
                y1={y(valor)}
                y2={y(valor)}
                stroke={valor === 0 ? 'var(--eixo)' : 'var(--grade)'}
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={MARGEM.esquerda - 8}
                y={y(valor)}
                dy="0.32em"
                textAnchor="end"
                className="fill-texto-suave text-[11px] tabular-nums"
              >
                {formatarNumero(valor)}
              </text>
            </g>
          ))}

          {marcasX.map((indice) => (
            <text
              key={indice}
              x={x(indice)}
              y={ALTURA - 8}
              textAnchor="middle"
              className="fill-texto-suave text-[11px] tabular-nums"
            >
              {formatarDiaCurto(pontos[indice].dia)}
            </text>
          ))}

          {pontoAtivo ? (
            <line
              x1={x(ativo!)}
              x2={x(ativo!)}
              y1={MARGEM.topo}
              y2={MARGEM.topo + areaY}
              stroke="var(--eixo)"
              strokeWidth={1}
            />
          ) : null}

          {SERIES.map((serie) => (
            <path
              key={serie.chave}
              d={pontos
                .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p[serie.chave])}`)
                .join(' ')}
              fill="none"
              stroke={serie.cor}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {SERIES.map((serie) => {
            const indice = ativo ?? total - 1;
            const ponto = pontos[indice];
            if (!ponto) return null;
            return (
              <circle
                key={serie.chave}
                cx={x(indice)}
                cy={y(ponto[serie.chave])}
                r={4}
                fill={serie.cor}
                stroke="var(--superficie)"
                strokeWidth={2}
              />
            );
          })}

          {ativo === null && rotulosFinaisCabem
            ? SERIES.map((serie) => (
                <text
                  key={serie.chave}
                  x={x(total - 1) + 10}
                  y={y(ultimo[serie.chave])}
                  dy="0.32em"
                  className="fill-texto-secundario text-xs font-medium tabular-nums"
                >
                  {formatarNumero(ultimo[serie.chave])}
                </text>
              ))
            : null}

          <rect
            x={MARGEM.esquerda - passoX / 2}
            y={MARGEM.topo}
            width={areaX + passoX}
            height={areaY}
            fill="transparent"
            onPointerMove={aoMover}
            onPointerLeave={() => setAtivo(null)}
          />
        </svg>

        {pontoAtivo ? (
          <div
            className="pointer-events-none absolute top-2 rounded-lg border border-borda bg-superficie px-3 py-2 text-xs shadow-lg"
            style={{ width: LARGURA_TOOLTIP, left: posicaoTooltip(x(ativo!), largura) }}
          >
            <div className="mb-1.5 text-texto-secundario">{formatarDiaLongo(pontoAtivo.dia)}</div>
            {SERIES.map((serie) => (
              <div key={serie.chave} className="flex items-center gap-2">
                <LinhaChave cor={serie.cor} />
                <span className="font-semibold tabular-nums">
                  {formatarNumero(pontoAtivo[serie.chave])}
                </span>
                <span className="text-texto-secundario">{serie.rotulo.toLowerCase()}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <details className="text-xs text-texto-secundario">
        <summary className="cursor-pointer select-none">Ver dados em tabela</summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="w-full text-left tabular-nums">
            <thead>
              <tr className="text-texto-suave">
                <th className="py-1 font-medium">Dia</th>
                <th className="py-1 text-right font-medium">Abertos</th>
                <th className="py-1 text-right font-medium">Solucionados</th>
              </tr>
            </thead>
            <tbody>
              {pontos.map((p) => (
                <tr key={p.dia} className="border-t border-borda">
                  <td className="py-1">{formatarDiaLongo(p.dia)}</td>
                  <td className="py-1 text-right">{p.abertos}</td>
                  <td className="py-1 text-right">{p.solucionados}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
