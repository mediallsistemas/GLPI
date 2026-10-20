import { ParametrosBusca, requisitarGlpi } from './cliente';

const TAMANHO_PAGINA = 200;
const MAXIMO_PADRAO = 5000;

export type CriterioCampo = {
  campo: number;
  tipo: 'equals' | 'notequals' | 'contains' | 'morethan' | 'lessthan' | 'under';
  valor: string | number;
  ligacao?: 'AND' | 'OR';
};

export type GrupoCriterios = {
  grupo: CriterioBusca[];
  ligacao?: 'AND' | 'OR';
};

export type CriterioBusca = CriterioCampo | GrupoCriterios;

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

function adicionarCriterios(parametros: ParametrosBusca, prefixo: string, criterios: CriterioBusca[]) {
  criterios.forEach((criterio, indice) => {
    const chave = `${prefixo}[${indice}]`;
    if (indice > 0) parametros[`${chave}[link]`] = criterio.ligacao ?? 'AND';
    if ('grupo' in criterio) {
      adicionarCriterios(parametros, `${chave}[criteria]`, criterio.grupo);
      return;
    }
    parametros[`${chave}[field]`] = criterio.campo;
    parametros[`${chave}[searchtype]`] = criterio.tipo;
    parametros[`${chave}[value]`] = criterio.valor;
  });
}

function montarParametros(opcoes: OpcoesBusca, inicio: number, fim: number): ParametrosBusca {
  const parametros: ParametrosBusca = {
    range: `${inicio}-${fim}`,
    sort: opcoes.ordenarPor,
    order: opcoes.ordem ?? 'DESC',
  };

  adicionarCriterios(parametros, 'criteria', opcoes.criterios ?? []);

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
