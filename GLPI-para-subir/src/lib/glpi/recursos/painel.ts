import { buscarTodos, LinhaBusca } from '../busca';
import {
  CAMPO_BUSCA_CHAMADO as CAMPO,
  FatiaPainel,
  FILTRO_STATUS_EM_ABERTO,
  PainelChamados,
  PeriodoPainel,
  PontoDiario,
  ResumoChamado,
  rotuloPrioridade,
  rotuloStatus,
  STATUS_EM_ABERTO,
} from '../tipos';
import { obterNomesDeUsuarios } from './usuarios';

const FUSO_HORARIO = 'America/Sao_Paulo';
const MAXIMO_FATIAS = 8;
const SEPARADOR_MULTIPLOS = '$$##$$';

export const PERIODOS_PAINEL: PeriodoPainel[] = [7, 30, 90];

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

function texto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const limpo = String(valor)
    .replace(/&(amp|lt|gt|quot|#0?39|#60|#62);/g, (entidade) => ENTIDADES_HTML[entidade])
    .replace(/<[^>]*>/g, '')
    .trim();
  return limpo === '' ? null : limpo;
}

function numero(valor: unknown): number {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function lista(valor: unknown): string[] {
  if (valor === null || valor === undefined) return [];
  return String(valor)
    .split(SEPARADOR_MULTIPLOS)
    .map((parte) => texto(parte.split('$#$')[0]))
    .filter((parte): parte is string => parte !== null);
}

function normalizar(linha: LinhaBusca): ResumoChamado {
  return {
    id: numero(linha[CAMPO.id]),
    status: numero(linha[CAMPO.status]),
    prioridade: numero(linha[CAMPO.prioridade]),
    tipo: numero(linha[CAMPO.tipo]),
    abertoEm: texto(linha[CAMPO.abertoEm]),
    solucionadoEm: texto(linha[CAMPO.solucionadoEm]),
    categoria: texto(linha[CAMPO.categoria]),
    tecnicos: lista(linha[CAMPO.tecnico]),
  };
}

function hojeNoFuso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO_HORARIO }).format(new Date());
}

function somarDias(dia: string, dias: number): string {
  const [ano, mes, diaDoMes] = dia.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, diaDoMes + dias)).toISOString().slice(0, 10);
}

function instante(dataGlpi: string): number {
  return Date.parse(`${dataGlpi.replace(' ', 'T')}Z`);
}

function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

function contar(chaves: string[]): Map<string, number> {
  const contagem = new Map<string, number>();
  for (const chave of chaves) contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  return contagem;
}

function maiores(contagem: Map<string, number>, rotuloOutros: string): FatiaPainel[] {
  const ordenadas = [...contagem.entries()]
    .map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));

  if (ordenadas.length <= MAXIMO_FATIAS) return ordenadas;

  const principais = ordenadas.slice(0, MAXIMO_FATIAS - 1);
  const resto = ordenadas.slice(MAXIMO_FATIAS - 1).reduce((soma, fatia) => soma + fatia.valor, 0);
  return [...principais, { rotulo: rotuloOutros, valor: resto }];
}

async function comNomesDeTecnicos(chamados: ResumoChamado[]): Promise<ResumoChamado[]> {
  const ids = chamados.flatMap((c) => c.tecnicos).filter((t) => /^\d+$/.test(t)).map(Number);
  if (ids.length === 0) return chamados;

  const nomes = await obterNomesDeUsuarios(ids);
  return chamados.map((c) => ({
    ...c,
    tecnicos: c.tecnicos.map((t) => (/^\d+$/.test(t) ? (nomes.get(Number(t)) ?? t) : t)),
  }));
}

export function periodoValido(valor: unknown): PeriodoPainel {
  const convertido = Number(valor);
  return PERIODOS_PAINEL.find((periodo) => periodo === convertido) ?? 30;
}

export async function montarPainel(periodoDias: PeriodoPainel = 30): Promise<PainelChamados> {
  const hoje = hojeNoFuso();
  const inicio = somarDias(hoje, -(periodoDias - 1));
  const limiteInferior = `${somarDias(inicio, -1)} 23:59:59`;

  const [emAberto, abertos, solucionados] = await Promise.all([
    buscarTodos('Ticket', {
      criterios: [{ campo: CAMPO.status, tipo: 'equals', valor: FILTRO_STATUS_EM_ABERTO }],
      campos: [CAMPO.status, CAMPO.prioridade, CAMPO.abertoEm, CAMPO.tecnico],
      ordenarPor: CAMPO.abertoEm,
    }),
    buscarTodos('Ticket', {
      criterios: [{ campo: CAMPO.abertoEm, tipo: 'morethan', valor: limiteInferior }],
      campos: [CAMPO.abertoEm, CAMPO.categoria],
      ordenarPor: CAMPO.abertoEm,
    }),
    buscarTodos('Ticket', {
      criterios: [{ campo: CAMPO.solucionadoEm, tipo: 'morethan', valor: limiteInferior }],
      campos: [CAMPO.abertoEm, CAMPO.solucionadoEm],
      ordenarPor: CAMPO.solucionadoEm,
    }),
  ]);

  const chamadosEmAberto = await comNomesDeTecnicos(emAberto.linhas.map(normalizar));
  const chamadosAbertos = abertos.linhas.map(normalizar);
  const chamadosSolucionados = solucionados.linhas.map(normalizar);

  const abertosPorDia = contar(chamadosAbertos.flatMap((c) => (c.abertoEm ? [c.abertoEm.slice(0, 10)] : [])));
  const solucionadosPorDia = contar(
    chamadosSolucionados.flatMap((c) => (c.solucionadoEm ? [c.solucionadoEm.slice(0, 10)] : [])),
  );

  const evolucaoDiaria: PontoDiario[] = Array.from({ length: periodoDias }, (_, indice) => {
    const dia = somarDias(inicio, indice);
    return { dia, abertos: abertosPorDia.get(dia) ?? 0, solucionados: solucionadosPorDia.get(dia) ?? 0 };
  });

  const porStatus = contar(chamadosEmAberto.map((c) => String(c.status)));
  const porPrioridade = contar(chamadosEmAberto.map((c) => String(c.prioridade)));
  const limiteParado = instante(`${somarDias(hoje, -30)} 00:00:00`);

  const horasDeSolucao = chamadosSolucionados.flatMap((c) =>
    c.abertoEm && c.solucionadoEm
      ? [(instante(c.solucionadoEm) - instante(c.abertoEm)) / 3_600_000]
      : [],
  );

  return {
    periodoDias,
    inicio,
    geradoEm: new Date().toISOString(),
    indicadores: {
      emAberto: emAberto.total,
      novos: porStatus.get('1') ?? 0,
      pendentes: porStatus.get('4') ?? 0,
      paradosHaMaisDe30Dias: chamadosEmAberto.filter(
        (c) => c.abertoEm !== null && instante(c.abertoEm) < limiteParado,
      ).length,
      abertosNoPeriodo: abertos.total,
      solucionadosNoPeriodo: solucionados.total,
      medianaSolucaoHoras: mediana(horasDeSolucao.filter((horas) => horas >= 0)),
    },
    evolucaoDiaria,
    emAbertoPorStatus: STATUS_EM_ABERTO.map((status) => ({
      rotulo: rotuloStatus(status),
      valor: porStatus.get(String(status)) ?? 0,
      status,
    })),
    emAbertoPorPrioridade: [...porPrioridade.keys()]
      .map(Number)
      .sort((a, b) => b - a)
      .map((prioridade) => ({
        rotulo: rotuloPrioridade(prioridade),
        valor: porPrioridade.get(String(prioridade)) ?? 0,
      })),
    emAbertoPorTecnico: maiores(
      contar(chamadosEmAberto.flatMap((c) => (c.tecnicos.length ? c.tecnicos : ['Sem técnico']))),
      'Outros técnicos',
    ),
    categoriasNoPeriodo: maiores(
      contar(chamadosAbertos.map((c) => c.categoria ?? 'Sem categoria')),
      'Outras categorias',
    ),
    amostraIncompleta: emAberto.truncado || abertos.truncado || solucionados.truncado,
  };
}
