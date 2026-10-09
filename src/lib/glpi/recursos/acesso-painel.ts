import { requisitarGlpi } from '../cliente';
import { lerConfigGlpi } from '../config';
import { ehErroGlpi } from '../erros';
import { GrupoGlpi, VinculoGrupoUsuarioGlpi } from '../tipos';

const TTL_GRUPO_MS = 5 * 60 * 1000;
const TAMANHO_PAGINA = 200;

let grupoEmCache: { grupo: GrupoGlpi; expiraEm: number } | null = null;

function lembrarGrupo(grupo: GrupoGlpi): GrupoGlpi {
  grupoEmCache = { grupo, expiraEm: Date.now() + TTL_GRUPO_MS };
  return grupo;
}

function lista<T>(dados: unknown): T[] {
  return Array.isArray(dados) ? (dados as T[]) : [];
}

export async function obterGrupoBloqueados(): Promise<GrupoGlpi | null> {
  if (grupoEmCache && grupoEmCache.expiraEm > Date.now()) return grupoEmCache.grupo;

  const nome = lerConfigGlpi().grupoBloqueados;
  const resposta = await requisitarGlpi<GrupoGlpi[]>('Group', {
    parametros: { 'searchText[name]': `^${nome}$`, range: '0-9' },
  });
  const grupo = lista<GrupoGlpi>(resposta.dados).find((candidato) => candidato.name === nome);

  return grupo ? lembrarGrupo({ id: Number(grupo.id), name: grupo.name }) : null;
}

export async function criarGrupoBloqueados(): Promise<GrupoGlpi> {
  const nome = lerConfigGlpi().grupoBloqueados;
  const resposta = await requisitarGlpi<{ id: number }>('Group', {
    metodo: 'POST',
    corpo: {
      input: {
        name: nome,
        entities_id: 0,
        is_recursive: 1,
        is_usergroup: 1,
        is_requester: 0,
        is_watcher: 0,
        is_assign: 0,
        is_task: 0,
        is_notify: 0,
        is_itemgroup: 0,
        is_manager: 0,
        comment: 'Usuários bloqueados no painel de chamados. Gerido pela tela Usuários do painel.',
      },
    },
  });

  return lembrarGrupo({ id: Number(resposta.dados.id), name: nome });
}

async function garantirGrupoBloqueados(): Promise<GrupoGlpi> {
  return (await obterGrupoBloqueados()) ?? criarGrupoBloqueados();
}

function vinculosDoGrupo(grupoId: number, inicio: number) {
  return requisitarGlpi<VinculoGrupoUsuarioGlpi[]>(`Group/${grupoId}/Group_User`, {
    parametros: { range: `${inicio}-${inicio + TAMANHO_PAGINA - 1}` },
  });
}

export async function listarBloqueados(): Promise<Set<number>> {
  const grupo = await obterGrupoBloqueados();
  if (!grupo) return new Set();

  const primeira = await vinculosDoGrupo(grupo.id, 0);
  const total = primeira.totalDisponivel ?? lista(primeira.dados).length;

  const inicios: number[] = [];
  for (let inicio = TAMANHO_PAGINA; inicio < total; inicio += TAMANHO_PAGINA) inicios.push(inicio);
  const demais = await Promise.all(inicios.map((inicio) => vinculosDoGrupo(grupo.id, inicio)));

  return new Set(
    [primeira, ...demais]
      .flatMap((pagina) => lista<VinculoGrupoUsuarioGlpi>(pagina.dados))
      .map((vinculo) => Number(vinculo.users_id)),
  );
}

async function vinculoDoUsuario(
  usuarioId: number,
  grupoId: number,
): Promise<VinculoGrupoUsuarioGlpi | null> {
  const resposta = await requisitarGlpi<VinculoGrupoUsuarioGlpi[]>(`User/${usuarioId}/Group_User`, {
    parametros: { range: `0-${TAMANHO_PAGINA - 1}` },
  });
  return lista<VinculoGrupoUsuarioGlpi>(resposta.dados).find((vinculo) => Number(vinculo.groups_id) === grupoId) ?? null;
}

export async function usuarioBloqueado(usuarioId: number): Promise<boolean> {
  const grupo = await obterGrupoBloqueados();
  if (!grupo) return false;
  return (await vinculoDoUsuario(usuarioId, grupo.id)) !== null;
}

function ehDuplicidade(erro: unknown): boolean {
  return (
    ehErroGlpi(erro) &&
    erro.status === 400 &&
    JSON.stringify(erro.detalhe ?? '').includes('Duplicate entry')
  );
}

export async function bloquearUsuario(usuarioId: number): Promise<void> {
  const grupo = await garantirGrupoBloqueados();
  try {
    await requisitarGlpi('Group_User', {
      metodo: 'POST',
      corpo: { input: { users_id: usuarioId, groups_id: grupo.id } },
    });
  } catch (erro) {
    if (!ehDuplicidade(erro)) throw erro;
  }
}

export async function desbloquearUsuario(usuarioId: number): Promise<void> {
  const grupo = await obterGrupoBloqueados();
  if (!grupo) return;

  const vinculo = await vinculoDoUsuario(usuarioId, grupo.id);
  if (!vinculo) return;

  await requisitarGlpi(`Group_User/${vinculo.id}`, { metodo: 'DELETE' });
}
