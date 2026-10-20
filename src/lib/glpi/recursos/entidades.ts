import { CriterioBusca } from '../busca';
import { requisitarGlpi } from '../cliente';
import { textoLimpo } from '../texto';
import { CAMPO_BUSCA_CHAMADO, EntidadeGlpi, Unidade } from '../tipos';

const TTL_MS = 10 * 60 * 1000;
const TAMANHO_PAGINA = 1000;

let emCache: { unidades: Unidade[]; expiraEm: number } | null = null;

function normalizar(bruto: EntidadeGlpi): Unidade {
  return {
    id: Number(bruto.id),
    nome: textoLimpo(bruto.completename) ?? textoLimpo(bruto.name) ?? `Unidade ${bruto.id}`,
  };
}

const SEPARADOR = ' > ';

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

export async function unidadeValida(valor: unknown): Promise<Unidade | null> {
  if (typeof valor !== 'string' || !/^\d+$/.test(valor)) return null;
  const id = Number(valor);
  return (await listarUnidades()).find((unidade) => unidade.id === id) ?? null;
}

export function criterioDaUnidade(unidade: Unidade | null | undefined): CriterioBusca[] {
  return unidade
    ? [{ campo: CAMPO_BUSCA_CHAMADO.entidade, tipo: 'under', valor: unidade.id, ligacao: 'AND' }]
    : [];
}
