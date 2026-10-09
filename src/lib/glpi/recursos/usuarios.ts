import { requisitarGlpi } from '../cliente';
import { ehErroGlpi } from '../erros';
import { UsuarioGlpi } from '../tipos';

const TTL_NOMES_MS = 60 * 60 * 1000;

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
