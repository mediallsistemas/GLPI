import { requisitarGlpi } from '../cliente';
import { Autorizacao, AutorizacaoGlpi } from '../tipos';

const TTL_MS = 5 * 60 * 1000;

const emCache = new Map<number, { autorizacoes: Autorizacao[]; expiraEm: number }>();

export async function autorizacoesDoUsuario(idUsuario: number): Promise<Autorizacao[]> {
  const guardado = emCache.get(idUsuario);
  if (guardado && guardado.expiraEm > Date.now()) return guardado.autorizacoes;

  const resposta = await requisitarGlpi<AutorizacaoGlpi[]>(`User/${idUsuario}/Profile_User`, {
    parametros: { range: '0-999', expand_dropdowns: false },
  });

  const autorizacoes = (Array.isArray(resposta.dados) ? resposta.dados : []).map((bruto) => ({
    entidade: Number(bruto.entities_id),
    recursiva: Number(bruto.is_recursive) === 1,
  }));

  emCache.set(idUsuario, { autorizacoes, expiraEm: Date.now() + TTL_MS });
  return autorizacoes;
}
