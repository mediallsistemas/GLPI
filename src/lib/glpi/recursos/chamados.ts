import { buscarTodos, LinhaBusca } from '../busca';
import { requisitarGlpi } from '../cliente';
import { textoLimpo } from '../texto';
import {
  CAMPO_BUSCA_CHAMADO as CAMPO,
  Chamado,
  ChamadoGlpi,
  PaginaDeChamados,
  rotuloPrioridade,
  rotuloStatus,
  rotuloTipo,
  Unidade,
} from '../tipos';
import { criterioDaUnidade } from './entidades';

const LIMITE_PADRAO = 25;
const LIMITE_MAXIMO = 100;

export type FiltroChamados = {
  inicio?: number;
  limite?: number;
  ordenarPor?: keyof ChamadoGlpi;
  ordem?: 'ASC' | 'DESC';
  unidade?: Unidade | null;
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

function normalizarLinha(linha: LinhaBusca): Chamado {
  const numero = (campo: number) => Number(linha[campo]) || 0;
  const status = numero(CAMPO.status);
  const prioridade = numero(CAMPO.prioridade);
  const tipo = numero(CAMPO.tipo);
  return {
    id: numero(CAMPO.id),
    titulo: textoLimpo(linha[CAMPO.titulo]) ?? '',
    descricao: textoLimpo(linha[CAMPO.descricao]) ?? '',
    status,
    statusRotulo: rotuloStatus(status),
    prioridade,
    prioridadeRotulo: rotuloPrioridade(prioridade),
    tipo,
    tipoRotulo: rotuloTipo(tipo),
    abertoEm: textoLimpo(linha[CAMPO.abertoEm]) ?? '',
    atualizadoEm: textoLimpo(linha[CAMPO.atualizadoEm]) ?? '',
    solucionadoEm: textoLimpo(linha[CAMPO.solucionadoEm]),
    fechadoEm: textoLimpo(linha[CAMPO.fechadoEm]),
  };
}

async function listarChamadosDaUnidade(
  unidade: Unidade,
  inicio: number,
  limite: number,
  ordem: 'ASC' | 'DESC',
): Promise<PaginaDeChamados> {
  const resultado = await buscarTodos('Ticket', {
    criterios: criterioDaUnidade(unidade),
    campos: [
      CAMPO.titulo,
      CAMPO.status,
      CAMPO.prioridade,
      CAMPO.tipo,
      CAMPO.abertoEm,
      CAMPO.atualizadoEm,
      CAMPO.solucionadoEm,
      CAMPO.fechadoEm,
    ],
    ordenarPor: CAMPO.atualizadoEm,
    ordem,
    maximo: inicio + limite,
  });

  return {
    itens: resultado.linhas.slice(inicio, inicio + limite).map(normalizarLinha),
    total: resultado.total,
    inicio,
    limite,
  };
}

export async function listarChamados(
  filtro: FiltroChamados = {},
): Promise<PaginaDeChamados> {
  const inicio = Math.max(0, filtro.inicio ?? 0);
  const limite = Math.min(Math.max(1, filtro.limite ?? LIMITE_PADRAO), LIMITE_MAXIMO);

  if (filtro.unidade) {
    return listarChamadosDaUnidade(filtro.unidade, inicio, limite, filtro.ordem ?? 'DESC');
  }

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
