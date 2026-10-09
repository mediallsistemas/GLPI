import { ParametrosBusca, requisitarGlpi } from './cliente';

const TAMANHO_PAGINA = 200;
const MAXIMO_PADRAO = 5000;

export type CriterioBusca = {
  campo: number;
  tipo: 'equals' | 'notequals' | 'contains' | 'morethan' | 'lessthan';
  valor: string | number;
  ligacao?: 'AND' | 'OR';
};

export type OpcoesBusca = {
  criterios?: CriterioBusca[];
  campos: number[];
  ordenarPor?: number;
  ordem?: 'ASC' | 'DESC';
  maximo?: number;
};

export type LinhaBusca = Record<string, unknown>;

export type ResultadoBusca = {
  linhas: LinhaBusca[];
  total: number;
  truncado: boolean;
};

type RespostaBuscaGlpi = {
  totalcount?: number;
  data?: LinhaBusca[] | Record<string, LinhaBusca>;
};

function montarParametros(opcoes: OpcoesBusca, inicio: number, fim: number): ParametrosBusca {
  const parametros: ParametrosBusca = {
    range: `${inicio}-${fim}`,
    sort: opcoes.ordenarPor,
    order: opcoes.ordem ?? 'DESC',
  };

  (opcoes.criterios ?? []).forEach((criterio, indice) => {
    if (indice > 0) parametros[`criteria[${indice}][link]`] = criterio.ligacao ?? 'AND';
    parametros[`criteria[${indice}][field]`] = criterio.campo;
    parametros[`criteria[${indice}][searchtype]`] = criterio.tipo;
    parametros[`criteria[${indice}][value]`] = criterio.valor;
  });

  opcoes.campos.forEach((campo, indice) => {
    parametros[`forcedisplay[${indice}]`] = campo;
  });

  return parametros;
}

async function buscarPagina(itemtype: string, opcoes: OpcoesBusca, inicio: number, fim: number) {
  const resposta = await requisitarGlpi<RespostaBuscaGlpi | null>(`search/${itemtype}`, {
    parametros: montarParametros(opcoes, inicio, fim),
  });

  const dados = resposta.dados?.data ?? [];
  return {
    linhas: Array.isArray(dados) ? dados : Object.values(dados),
    total: resposta.dados?.totalcount ?? resposta.totalDisponivel ?? 0,
  };
}

export async function buscarTodos(itemtype: string, opcoes: OpcoesBusca): Promise<ResultadoBusca> {
  const maximo = opcoes.maximo ?? MAXIMO_PADRAO;
  const primeira = await buscarPagina(itemtype, opcoes, 0, Math.min(TAMANHO_PAGINA, maximo) - 1);
  const alvo = Math.min(primeira.total, maximo);

  const inicios: number[] = [];
  for (let inicio = TAMANHO_PAGINA; inicio < alvo; inicio += TAMANHO_PAGINA) inicios.push(inicio);

  const demais = await Promise.all(
    inicios.map((inicio) =>
      buscarPagina(itemtype, opcoes, inicio, Math.min(inicio + TAMANHO_PAGINA, alvo) - 1),
    ),
  );

  const linhas = [primeira, ...demais].flatMap((pagina) => pagina.linhas);

  return { linhas, total: primeira.total, truncado: primeira.total > linhas.length };
}
