import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Cabecalho } from '@/components/Cabecalho';
import { Falha } from '@/components/Falha';
import { LinhaUsuario, ListaUsuarios } from '@/components/usuarios/ListaUsuarios';
import { administradoresConfigurados, ehAdministrador } from '@/lib/autenticacao/acesso';
import { COOKIE_SESSAO, verificarSessao } from '@/lib/autenticacao/sessao-usuario';
import { formatarDataHora } from '@/lib/formatacao';
import { lerConfigGlpi, listarLiberados, listarUsuarios, mensagemDeErro, obterGrupoPainel } from '@/lib/glpi';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Usuários — Chamados GLPI' };

type Carga =
  | { linhas: LinhaUsuario[]; grupoExiste: boolean; falha: null }
  | { linhas: null; grupoExiste: false; falha: string };

async function carregar(): Promise<Carga> {
  try {
    const administradores = administradoresConfigurados();
    const [usuarios, grupo] = await Promise.all([listarUsuarios(), obterGrupoPainel()]);
    const liberados = grupo ? await listarLiberados() : new Set<number>();

    const linhas = usuarios.map((usuario) => ({
      ...usuario,
      ultimoAcesso: formatarDataHora(usuario.ultimoAcesso),
      liberado: liberados.has(usuario.id),
      administrador: administradores.includes(usuario.login.trim().toLowerCase()),
    }));

    return { linhas, grupoExiste: grupo !== null, falha: null };
  } catch (erro) {
    return { linhas: null, grupoExiste: false, falha: mensagemDeErro(erro) };
  }
}

function nomeDoGrupo(): string {
  try {
    return lerConfigGlpi().grupoPainel;
  } catch {
    return 'Painel de chamados';
  }
}

export default async function PaginaUsuarios() {
  const usuario = await verificarSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  if (!usuario) redirect('/login');
  if (!ehAdministrador(usuario.login)) redirect('/');

  const carga = await carregar();
  const grupo = nomeDoGrupo();

  return (
    <>
      <Cabecalho usuario={usuario} administrador ativo="usuarios" subtitulo="Quem pode entrar no painel" />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Usuários do GLPI</h2>
          <p className="text-sm text-texto-secundario">
            Quem está liberado entra no painel com o próprio usuário e senha do GLPI. A liberação é guardada no
            GLPI como participação no grupo <span className="font-medium text-foreground">{grupo}</span>.
          </p>
        </div>

        {carga.falha !== null ? (
          <Falha titulo="Não foi possível listar os usuários do GLPI" mensagem={carga.falha} />
        ) : (
          <>
            {carga.grupoExiste ? null : (
              <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
                O grupo <span className="font-medium">{grupo}</span> ainda não existe no GLPI. Ele será criado
                automaticamente na primeira liberação.
              </p>
            )}
            <ListaUsuarios linhas={carga.linhas} grupoExiste={carga.grupoExiste} />
          </>
        )}
      </main>
    </>
  );
}
