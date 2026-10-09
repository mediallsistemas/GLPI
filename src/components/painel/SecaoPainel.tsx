import { ReactNode } from 'react';

export function SecaoPainel({
  titulo,
  subtitulo,
  children,
  className = '',
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex min-w-0 flex-col gap-4 rounded-lg border border-borda bg-superficie p-5 ${className}`}>
      <header>
        <h2 className="text-base font-semibold">{titulo}</h2>
        {subtitulo ? <p className="text-sm text-texto-secundario">{subtitulo}</p> : null}
      </header>
      {children}
    </section>
  );
}
