import { buscarTodos, CriterioBusca } from '../busca';
import { textoLimpo } from '../texto';
import {
  CAMPO_BUSCA_CHAMADO as CAMPO,
  IntervaloPainel,
  LinhaRelatorio,
  RelatorioChamados,
  rotuloPrioridade,
  rotuloStatus,
  rotuloTipo,
  Unidade,
} from '../tipos';
import { comNomesDeTecnicos, criteriosDoIntervalo, lista, montarPainel } from './painel';

const MAXIMO_LINHAS = 10_000;

export async function montarRelatorio(
  intervalo: IntervaloPainel,
  filtro: { unidade: Unidade | null; restrito: boolean; criterios: CriterioBusca[] },
): Promise<RelatorioChamados> {
  const { unidade, restrito, criterios } = filtro;
  const [painel, resultado] = await Promise.all([
    montarPainel(intervalo, criterios),
    buscarTodos('Ticket', {
      criterios: [...criteriosDoIntervalo(CAMPO.abertoEm, intervalo.inicio, intervalo.fim), ...criterios],
      campos: [
        CAMPO.titulo,
        CAMPO.status,
        CAMPO.prioridade,
        CAMPO.tipo,
        CAMPO.categoria,
        CAMPO.tecnico,
        CAMPO.abertoEm,
        CAMPO.solucionadoEm,
        CAMPO.entidade,
      ],
      ordenarPor: CAMPO.abertoEm,
      maximo: MAXIMO_LINHAS,
    }),
  ]);

  const comTecnicos = await comNomesDeTecnicos(
    resultado.linhas.map((linha) => ({
      linha,
      id: Number(linha[CAMPO.id]) || 0,
      status: Number(linha[CAMPO.status]) || 0,
      prioridade: Number(linha[CAMPO.prioridade]) || 0,
      tipo: Number(linha[CAMPO.tipo]) || 0,
      abertoEm: textoLimpo(linha[CAMPO.abertoEm]),
      solucionadoEm: textoLimpo(linha[CAMPO.solucionadoEm]),
      categoria: textoLimpo(linha[CAMPO.categoria]),
      tecnicos: lista(linha[CAMPO.tecnico]),
    })),
  );

  const chamados: LinhaRelatorio[] = comTecnicos.map((c) => ({
    id: c.id,
    titulo: textoLimpo(c.linha[CAMPO.titulo]) ?? '',
    unidade: textoLimpo(c.linha[CAMPO.entidade]) ?? '',
    status: rotuloStatus(c.status),
    prioridade: rotuloPrioridade(c.prioridade),
    tipo: rotuloTipo(c.tipo),
    categoria: c.categoria ?? 'Sem categoria',
    tecnicos: c.tecnicos.join(', ') || 'Sem técnico',
    abertoEm: c.abertoEm ?? '',
    solucionadoEm: c.solucionadoEm ?? '',
  }));

  return { painel, unidade, restrito, chamados, truncado: resultado.truncado };
}
