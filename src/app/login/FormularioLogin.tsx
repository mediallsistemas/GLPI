'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { entrar, EstadoLogin } from './acoes';

const ESTADO_INICIAL: EstadoLogin = { erro: null, login: '' };

const CLASSE_CAMPO =
  'w-full rounded border border-borda bg-superficie px-3 py-2 text-sm outline-none transition-shadow placeholder:text-texto-suave focus:border-serie-1 focus:ring-2 focus:ring-serie-1/25';

function BotaoEntrar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded bg-destaque px-4 py-2.5 text-sm font-semibold text-destaque-texto transition-[filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-serie-1 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? 'Entrando…' : 'Entrar'}
    </button>
  );
}

export function FormularioLogin({ destino }: { destino: string }) {
  const [estado, acao] = useActionState(entrar, ESTADO_INICIAL);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="destino" value={destino} />

      {estado.erro ? (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {estado.erro}
        </p>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Usuário</span>
        <input
          name="login"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus
          defaultValue={estado.login}
          className={CLASSE_CAMPO}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Senha</span>
        <input
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className={CLASSE_CAMPO}
        />
      </label>

      <BotaoEntrar />
    </form>
  );
}
