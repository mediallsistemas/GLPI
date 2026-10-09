export const STATUS_CHAMADO = {
  1: 'Novo',
  2: 'Em atendimento (atribuído)',
  3: 'Em atendimento (planejado)',
  4: 'Pendente',
  5: 'Solucionado',
  6: 'Fechado',
} as const;

export const PRIORIDADE_CHAMADO = {
  1: 'Muito baixa',
  2: 'Baixa',
  3: 'Média',
  4: 'Alta',
  5: 'Muito alta',
  6: 'Crítica',
} as const;

export const TIPO_CHAMADO = {
  1: 'Incidente',
  2: 'Requisição',
} as const;

export const STATUS_EM_ABERTO = [1, 2, 3, 4] as const;

export const FILTRO_STATUS_EM_ABERTO = 'notold';

export const CAMPO_BUSCA_CHAMADO = {
  titulo: 1,
  id: 2,
  prioridade: 3,
  tecnico: 5,
  categoria: 7,
  status: 12,
  tipo: 14,
  abertoEm: 15,
  solucionadoEm: 17,
  atualizadoEm: 19,
} as const;

export type StatusChamado = keyof typeof STATUS_CHAMADO;
export type PrioridadeChamado = keyof typeof PRIORIDADE_CHAMADO;
export type TipoChamado = keyof typeof TIPO_CHAMADO;

export type ChamadoGlpi = {
  id: number;
  name: string;
  content: string;
  status: number;
  urgency: number;
  impact: number;
  priority: number;
  type: number;
  date: string;
  date_mod: string;
  solvedate: string | null;
  closedate: string | null;
  users_id_recipient: number;
  entities_id: number;
};

export type Chamado = {
  id: number;
  titulo: string;
  descricao: string;
  status: number;
  statusRotulo: string;
  prioridade: number;
  prioridadeRotulo: string;
  tipo: number;
  tipoRotulo: string;
  abertoEm: string;
  atualizadoEm: string;
  solucionadoEm: string | null;
  fechadoEm: string | null;
};

export type UsuarioGlpi = {
  id: number;
  name: string;
  realname: string | null;
  firstname: string | null;
  is_active: number;
};

export type PaginaDeChamados = {
  itens: Chamado[];
  total: number | null;
  inicio: number;
  limite: number;
};

export type ResumoChamado = {
  id: number;
  status: number;
  prioridade: number;
  tipo: number;
  abertoEm: string | null;
  solucionadoEm: string | null;
  categoria: string | null;
  tecnicos: string[];
};

export type PeriodoPainel = 7 | 30 | 90;

export type FatiaPainel = {
  rotulo: string;
  valor: number;
  status?: number;
};

export type PontoDiario = {
  dia: string;
  abertos: number;
  solucionados: number;
};

export type PainelChamados = {
  periodoDias: PeriodoPainel;
  inicio: string;
  geradoEm: string;
  indicadores: {
    emAberto: number;
    novos: number;
    pendentes: number;
    paradosHaMaisDe30Dias: number;
    abertosNoPeriodo: number;
    solucionadosNoPeriodo: number;
    medianaSolucaoHoras: number | null;
  };
  evolucaoDiaria: PontoDiario[];
  emAbertoPorStatus: FatiaPainel[];
  emAbertoPorPrioridade: FatiaPainel[];
  emAbertoPorTecnico: FatiaPainel[];
  categoriasNoPeriodo: FatiaPainel[];
  amostraIncompleta: boolean;
};

function rotulo(
  mapa: Record<number, string>,
  valor: number,
  padrao: string,
): string {
  return mapa[valor] ?? padrao;
}

export function rotuloStatus(valor: number): string {
  return rotulo(STATUS_CHAMADO, valor, 'Desconhecido');
}

export function rotuloPrioridade(valor: number): string {
  return rotulo(PRIORIDADE_CHAMADO, valor, 'Não definida');
}

export function rotuloTipo(valor: number): string {
  return rotulo(TIPO_CHAMADO, valor, 'Não definido');
}
