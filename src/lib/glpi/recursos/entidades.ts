import { CriterioBusca, CriterioCampo } from '../busca';
import { requisitarGlpi } from '../cliente';
import { textoLimpo } from '../texto';
import { CAMPO_BUSCA_CHAMADO, EntidadeGlpi, EscopoUnidades, Unidade } from '../tipos';

const TTL_MS = 10 * 60 * 1000;
const TAMANHO_PAGINA = 1000;
const SEPARADOR = ' > ';
const NENHUMA_UNIDADE = -1;

export type FiltroUnidades = {
  unidades: Unidade[];
  unidade: Unidade | null;
  restrito: boolean;
  semUnidade: boolean;
  permitidas: Set<number>;
  criterios: CriterioBusca[];
};

let emCache: { unidades: Unidade[]; expiraEm: number } | null = null;

function idDoPai(bruto: EntidadeGlpi): number | null {
  if (bruto.entities_id === null || bruto.entities_id === undefined || bruto.entities_id === '') return null;
  const pai = Number(bruto.entities_id);
  return Number.isInteger(pai) && pai !== Number(bruto.id) ? pai : null;
}

function normalizar(bruto: EntidadeGlpi): Unidade {
  return {
    id: Number(bruto.id),
    nome: textoLimpo(bruto.completename) ?? textoLimpo(bruto.name) ?? `Unidade ${bruto.id}`,
    pai: idDoPai(bruto),
  };
}

function semRaizComum(unidades: Unidade[]): Unidade[] {
  const raizes = new Set(unidades.map((unidade) => unidade.nome.split(SEPARADOR)[0]));
  if (raizes.size !== 1 || unidades.length < 2) return unidades;

  const prefixo = `${[...raizes][0]}${SEPARADOR}`;
  return unidades.map((unidade) =>
    unidade.nome.startsWith(prefixo) ? { ...unidade, nome: unidade.nome.slice(prefixo.length) } : unidade,
  );
}

export async function listarUnidades(): Promise<Unidade[]> {
  if (emCache && emCache.expiraEm > Date.now()) return emCache.unidades;

  const resposta = await requisitarGlpi<EntidadeGlpi[]>('Entity', {
    parametros: { range: `0-${TAMANHO_PAGINA - 1}`, expand_dropdowns: false },
  });

  const unidades = semRaizComum(
    (Array.isArray(resposta.dados) ? resposta.dados : [])
      .map(normalizar)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })),
  );

  emCache = { unidades, expiraEm: Date.now() + TTL_MS };
  return unidades;
}

export async function nomeSemRaiz(): Promise<(completo: string) => string> {
  const raizes = (await listarUnidades()).filter((unidade) => unidade.pai === null);
  if (raizes.length !== 1) return (completo) => completo;
  const prefixo = `${raizes[0].nome}${SEPARADOR}`;
  return (completo) => (completo.startsWith(prefixo) ? completo.slice(prefixo.length) : completo);
}

function arvore(unidades: Unidade[]) {
  const existentes = new Set(unidades.map((unidade) => unidade.id));
  const filhos = new Map<number, number[]>();
  for (const unidade of unidades) {
    if (unidade.pai === null || !existentes.has(unidade.pai)) continue;
    filhos.set(unidade.pai, [...(filhos.get(unidade.pai) ?? []), unidade.id]);
  }

  const subarvore = (id: number): number[] => [id, ...(filhos.get(id) ?? []).flatMap(subarvore)];
  const raizes = unidades
    .filter((unidade) => unidade.pai === null || !existentes.has(unidade.pai))
    .map((unidade) => unidade.id);

  return { existentes, filhos, subarvore, raizes };
}

function criteriosDoAlvo(unidades: Unidade[], alvo: Set<number>): CriterioBusca[] {
  if (alvo.size === unidades.length) return [];

  const { filhos, subarvore, raizes } = arvore(unidades);

  const cobrir = (id: number): Pick<CriterioCampo, 'tipo' | 'valor'>[] => {
    if (subarvore(id).every((membro) => alvo.has(membro))) return [{ tipo: 'under', valor: id }];
    return [
      ...(alvo.has(id) ? [{ tipo: 'equals' as const, valor: id }] : []),
      ...(filhos.get(id) ?? []).flatMap(cobrir),
    ];
  };

  const condicoes = raizes.flatMap(cobrir);
  const grupo: CriterioBusca[] = (condicoes.length ? condicoes : [{ tipo: 'equals' as const, valor: NENHUMA_UNIDADE }]).map(
    (condicao, indice) => ({
      campo: CAMPO_BUSCA_CHAMADO.entidade,
      ...condicao,
      ligacao: indice ? ('OR' as const) : undefined,
    }),
  );

  return [{ grupo, ligacao: 'AND' }];
}

export async function filtroDeUnidades(escopo: EscopoUnidades, idSelecionada: unknown): Promise<FiltroUnidades> {
  const todas = await listarUnidades();
  const { existentes, subarvore } = arvore(todas);

  const permitidas = new Set(
    escopo.completo
      ? existentes
      : escopo.autorizacoes
          .filter((autorizacao) => existentes.has(autorizacao.entidade))
          .flatMap((autorizacao) => (autorizacao.recursiva ? subarvore(autorizacao.entidade) : [autorizacao.entidade])),
  );

  const unidades = todas.filter((unidade) => permitidas.has(unidade.id));
  const unidade =
    typeof idSelecionada === 'string' && /^\d+$/.test(idSelecionada)
      ? (unidades.find((candidata) => candidata.id === Number(idSelecionada)) ?? null)
      : null;

  const alvo = unidade ? new Set(subarvore(unidade.id).filter((id) => permitidas.has(id))) : permitidas;

  return {
    unidades,
    unidade,
    restrito: permitidas.size < todas.length,
    semUnidade: permitidas.size === 0,
    permitidas,
    criterios: criteriosDoAlvo(todas, alvo),
  };
}
