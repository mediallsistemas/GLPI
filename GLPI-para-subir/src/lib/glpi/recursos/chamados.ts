import { requisitarGlpi } from '../cliente';
import {
  Chamado,
  ChamadoGlpi,
  PaginaDeChamados,
  rotuloPrioridade,
  rotuloStatus,
  rotuloTipo,
} from '../tipos';

const LIMITE_PADRAO = 25;
const LIMITE_MAXIMO = 100;

export type FiltroChamados = {
  inicio?: number;
  limite?: number;
  ordenarPor?: keyof ChamadoGlpi;
  ordem?: 'ASC' | 'DESC';
};

function normalizar(bruto: ChamadoGlpi): Chamado {
  return {
    id: bruto.id,
    titulo: bruto.name,
    descricao: bruto.content ?? '',
    status: bruto.status,
    statusRotulo: rotuloStatus(bruto.status),
    prioridade: bruto.priority,
    prioridadeRotulo: rotuloPrioridade(bruto.priority),
    tipo: bruto.type,
    tipoRotulo: rotuloTipo(bruto.type),
    abertoEm: bruto.date,
    atualizadoEm: bruto.date_mod,
    solucionadoEm: bruto.solvedate,
    fechadoEm: bruto.closedate,
  };
}

export async function listarChamados(
  filtro: FiltroChamados = {},
): Promise<PaginaDeChamados> {
  const inicio = Math.max(0, filtro.inicio ?? 0);
  const limite = Math.min(Math.max(1, filtro.limite ?? LIMITE_PADRAO), LIMITE_MAXIMO);

  const resposta = await requisitarGlpi<ChamadoGlpi[]>('Ticket', {
    parametros: {
      range: `${inicio}-${inicio + limite - 1}`,
      sort: filtro.ordenarPor ?? 'date_mod',
      order: filtro.ordem ?? 'DESC',
      expand_dropdowns: false,
    },
  });

  const bruto = Array.isArray(resposta.dados) ? resposta.dados : [];

  return {
    itens: bruto.map(normalizar),
    total: resposta.totalDisponivel,
    inicio,
    limite,
  };
}

export async function obterChamado(id: number): Promise<Chamado> {
  const resposta = await requisitarGlpi<ChamadoGlpi>(`Ticket/${id}`);
  return normalizar(resposta.dados);
}
