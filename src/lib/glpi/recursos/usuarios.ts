import { requisitarGlpi } from '../cliente';
import { ehErroGlpi } from '../erros';
import { textoLimpo } from '../texto';
import { UsuarioGlpi, UsuarioPainel } from '../tipos';

const TTL_NOMES_MS = 60 * 60 * 1000;
const TAMANHO_PAGINA = 200;

const nomesEmCache = new Map<number, { nome: string; expiraEm: number }>();

function nomeDeExibicao(bruto: UsuarioGlpi): string {
  const completo = [bruto.firstname, bruto.realname].filter(Boolean).join(' ').trim();
  return completo || bruto.name || `Usuário ${bruto.id}`;
}

async function buscarNome(id: number): Promise<string> {
  try {
    const resposta = await requisitarGlpi<UsuarioGlpi>(`User/${id}`);
    return nomeDeExibicao(resposta.dados);
  } catch (erro) {
    if (ehErroGlpi(erro) && erro.status === 404) return `Usuário ${id}`;
    throw erro;
  }
}

export async function obterNomesDeUsuarios(ids: number[]): Promise<Map<number, string>> {
  const agora = Date.now();
  const unicos = [...new Set(ids)];
  const faltantes = unicos.filter((id) => (nomesEmCache.get(id)?.expiraEm ?? 0) <= agora);

  const nomes = await Promise.all(faltantes.map(buscarNome));
  faltantes.forEach((id, indice) => {
    nomesEmCache.set(id, { nome: nomes[indice], expiraEm: agora + TTL_NOMES_MS });
  });

  return new Map(unicos.map((id) => [id, nomesEmCache.get(id)!.nome]));
}

function rotuloExpandido(valor: number | string | undefined): string | null {
  return typeof valor === 'string' ? textoLimpo(valor) : null;
}

function normalizar(bruto: UsuarioGlpi): UsuarioPainel {
  return {
    id: Number(bruto.id),
    login: bruto.name ?? '',
    nome: textoLimpo(nomeDeExibicao(bruto)) ?? `Usuário ${bruto.id}`,
    ativo: Number(bruto.is_active) === 1,
    entidade: rotuloExpandido(bruto.entities_id),
    perfilPadrao: rotuloExpandido(bruto.profiles_id),
    ultimoAcesso: bruto.last_login ?? null,
  };
}

function paginaDeUsuarios(inicio: number) {
  return requisitarGlpi<UsuarioGlpi[]>('User', {
    parametros: {
      range: `${inicio}-${inicio + TAMANHO_PAGINA - 1}`,
      expand_dropdowns: true,
      sort: 'name',
      order: 'ASC',
    },
  });
}

export async function listarUsuarios(): Promise<UsuarioPainel[]> {
  const primeira = await paginaDeUsuarios(0);
  const total = primeira.totalDisponivel ?? (Array.isArray(primeira.dados) ? primeira.dados.length : 0);

  const inicios: number[] = [];
  for (let inicio = TAMANHO_PAGINA; inicio < total; inicio += TAMANHO_PAGINA) inicios.push(inicio);
  const demais = await Promise.all(inicios.map(paginaDeUsuarios));

  return [primeira, ...demais]
    .flatMap((pagina) => (Array.isArray(pagina.dados) ? pagina.dados : []))
    .map(normalizar)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}
