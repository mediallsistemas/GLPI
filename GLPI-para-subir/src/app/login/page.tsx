import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_SESSAO, verificarSessao } from '@/lib/autenticacao/sessao-usuario';
import { FormularioLogin } from './FormularioLogin';

export const metadata: Metadata = { title: 'Entrar — Chamados GLPI' };

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ de?: string }>;
}) {
  const usuario = await verificarSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  if (usuario) redirect('/');

  const { de } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span aria-hidden className="h-8 w-1 rounded-full bg-destaque" />
          <div className="flex flex-col">
            <span className="text-xl font-semibold tracking-tight">Chamados GLPI</span>
            <span className="text-sm text-texto-secundario">Visão geral do atendimento</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-borda bg-superficie shadow-sm">
          <div className="h-1 bg-marinho" />
          <div className="flex flex-col gap-5 p-6 sm:p-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold">Entre na sua conta</h1>
              <p className="text-sm text-texto-secundario">
                Use o mesmo usuário e senha do GLPI.
              </p>
            </div>
            <FormularioLogin destino={de ?? '/'} />
          </div>
        </div>
      </div>
    </main>
  );
}
