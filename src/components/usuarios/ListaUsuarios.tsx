'use client';

import { Dispatch, SetStateAction, useMemo, useState, useTransition } from 'react';
import { definirAcesso } from '@/app/usuarios/acoes';
import { InterruptorAcesso } from '@/components/usuarios/InterruptorAcesso';
import { formatarNumero } from '@/lib/formatacao';

export type LinhaUsuario = {
  id: number;
  login: string;
  nome: string;
  ativo: boolean;
  entidade: string | null;
  perfilPadrao: string | null;
  ultimoAcesso: string;
  liberado: boolean;
  administrador: boolean;
};

const CLASSE_CAMPO =
  'w-full rounded border border-borda bg-superficie px-3 py-2 text-sm outline-none transition-shadow placeholder:text-texto-suave focus:border-serie-1 focus:ring-2 focus:ring-serie-1/25 sm:max-w-xs';

const CLASSE_ETIQUETA =
  'inline-block rounded px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide whitespace-nowrap';

function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function atualizarConjunto(
  definir: Dispatch<SetStateAction<Set<number>>>,
  id: number,
  presente: boolean,
) {
  definir((anterior) => {
    const proximo = new Set(anterior);
    if (presente) proximo.add(id);
    else proximo.delete(id);
    return proximo;
  });
}

export function ListaUsuarios({ linhas, grupoExiste }: { linhas: LinhaUsuario[]; grupoExiste: boolean }) {
  const [busca, setBusca] = useState('');
  const [somenteBloqueados, setSomenteBloqueados] = useState(false);
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [liberados, setLiberados] = useState(
    () => new Set(linhas.filter((linha) => linha.liberado).map((linha) => linha.id)),
  );
  const [pendentes, setPendentes] = useState<Set<number>>(() => new Set());
  const [erro, setErro] = useState<string | null>(null);
  const [, iniciarTransicao] = useTransition();

  const visiveis = useMemo(() => {
    const termo = normalizarTexto(busca.trim());
    return linhas.filter((linha) => {
      if (!mostrarInativos && !linha.ativo) return false;
      if (somenteBloqueados && (linha.administrador || liberados.has(linha.id))) return false;
      if (termo === '') return true;
      return normalizarTexto(`${linha.nome} ${linha.login} ${linha.entidade ?? ''}`).includes(termo);
    });
  }, [linhas, busca, somenteBloqueados, mostrarInativos, liberados]);

  const totalBloqueados = linhas.filter((linha) => !linha.administrador && !liberados.has(linha.id)).length;

  function alternar(linha: LinhaUsuario) {
    const permitir = !liberados.has(linha.id);
    setErro(null);
    atualizarConjunto(setLiberados, linha.id, permitir);
    atualizarConjunto(setPendentes, linha.id, true);

    iniciarTransicao(async () => {
      const resultado = await definirAcesso(linha.id, permitir);
      if (!resultado.ok) {
        atualizarConjunto(setLiberados, linha.id, !permitir);
        setErro(`${linha.nome}: ${resultado.erro}`);
      }
      atualizarConjunto(setPendentes, linha.id, false);
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="sr-only">Buscar usuário</span>
          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por nome, login ou entidade"
            autoComplete="off"
            className={CLASSE_CAMPO}
          />
        </label>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={somenteBloqueados}
              onChange={(evento) => setSomenteBloqueados(evento.target.checked)}
              className="size-4 accent-serie-1"
            />
            Somente bloqueados
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={mostrarInativos}
              onChange={(evento) => setMostrarInativos(evento.target.checked)}
              className="size-4 accent-serie-1"
            />
            Mostrar inativos
          </label>
        </div>
      </div>

      <p className="text-sm text-texto-secundario">
        {formatarNumero(visiveis.length)} de {formatarNumero(linhas.length)} usuários ·{' '}
        {formatarNumero(totalBloqueados)} bloqueados no painel
      </p>

      {erro ? (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {erro}
        </p>
      ) : null}

      {visiveis.length === 0 ? (
        <p className="rounded-lg border border-borda bg-superficie p-6 text-sm text-texto-secundario">
          Nenhum usuário corresponde aos filtros.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-borda bg-superficie">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="bg-trilho text-xs uppercase tracking-wide text-texto-secundario">
              <tr>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Entidade</th>
                <th className="px-4 py-3 font-medium">Perfil padrão</th>
                <th className="px-4 py-3 font-medium">Último acesso ao GLPI</th>
                <th className="px-4 py-3 text-right font-medium">Acesso ao painel</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((linha) => {
                const ligado = linha.administrador || liberados.has(linha.id);
                return (
                  <tr key={linha.id} className={`border-t border-borda ${linha.ativo ? '' : 'text-texto-suave'}`}>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex flex-wrap items-center gap-2 font-medium">
                          {linha.nome}
                          {linha.administrador ? (
                            <span className={`${CLASSE_ETIQUETA} bg-destaque/30 text-foreground`}>
                              Administrador
                            </span>
                          ) : null}
                          {linha.ativo ? null : (
                            <span className={`${CLASSE_ETIQUETA} bg-trilho text-texto-secundario`}>Inativo</span>
                          )}
                        </span>
                        {linha.login !== linha.nome ? (
                          <span className="font-mono text-xs text-texto-suave">{linha.login}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">{linha.entidade ?? '—'}</td>
                    <td className="px-4 py-3">{linha.perfilPadrao ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{linha.ultimoAcesso}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-xs whitespace-nowrap text-texto-secundario">
                          {linha.administrador ? 'Sempre' : ligado ? 'Liberado' : 'Bloqueado'}
                        </span>
                        <InterruptorAcesso
                          ligado={ligado}
                          pendente={pendentes.has(linha.id)}
                          desabilitado={linha.administrador}
                          rotulo={`Acesso ao painel para ${linha.nome}`}
                          titulo={
                            linha.administrador
                              ? 'Administradores sempre têm acesso. Ajuste em PAINEL_ADMINISTRADORES.'
                              : !grupoExiste && ligado
                                ? 'O primeiro bloqueio cria o grupo no GLPI.'
                                : undefined
                          }
                          aoAlternar={() => alternar(linha)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
