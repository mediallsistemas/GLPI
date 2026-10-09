import { sair } from '@/app/login/acoes';
import { UsuarioSessao } from '@/lib/autenticacao/sessao-usuario';

export function MenuUsuario({ usuario }: { usuario: UsuarioSessao }) {
  const iniciais = usuario.nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold"
      >
        {iniciais}
      </span>
      <div className="hidden flex-col leading-tight sm:flex">
        <span className="text-sm font-medium">{usuario.nome}</span>
        <span className="text-xs text-marinho-suave">{usuario.perfil}</span>
      </div>
      <form action={sair}>
        <button
          type="submit"
          className="rounded px-2.5 py-1.5 text-sm text-marinho-texto transition-colors hover:bg-white/10"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
