import Link from 'next/link';
import { ReactNode } from 'react';
import { MenuUsuario } from '@/components/MenuUsuario';
import { UsuarioSessao } from '@/lib/autenticacao/sessao-usuario';

export type Tela = 'painel' | 'usuarios';

const TELAS: { chave: Tela; rotulo: string; href: string }[] = [
  { chave: 'painel', rotulo: 'Painel', href: '/' },
  { chave: 'usuarios', rotulo: 'Usuários', href: '/usuarios' },
];

export function Cabecalho({
  usuario,
  administrador,
  ativo,
  subtitulo,
  acoes,
}: {
  usuario: UsuarioSessao;
  administrador: boolean;
  ativo: Tela;
  subtitulo: string;
  acoes?: ReactNode;
}) {
  return (
    <header className="bg-marinho text-marinho-texto">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-8 w-1 rounded-full bg-destaque" />
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold tracking-tight">Chamados GLPI</h1>
              <p className="text-sm text-marinho-suave">{subtitulo}</p>
            </div>
          </div>

          {administrador ? (
            <nav aria-label="Seções" className="inline-flex rounded-md bg-white/10 p-0.5">
              {TELAS.map((tela) => {
                const selecionada = tela.chave === ativo;
                return (
                  <Link
                    key={tela.chave}
                    href={tela.href}
                    aria-current={selecionada ? 'page' : undefined}
                    className={`rounded px-3 py-1.5 text-sm transition-colors ${
                      selecionada
                        ? 'bg-white/15 font-semibold text-marinho-texto'
                        : 'text-marinho-suave hover:bg-white/10 hover:text-marinho-texto'
                    }`}
                  >
                    {tela.rotulo}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {acoes}
          {acoes ? <span aria-hidden className="hidden h-8 w-px bg-white/15 sm:block" /> : null}
          <MenuUsuario usuario={usuario} />
        </div>
      </div>
    </header>
  );
}
