const APARENCIA: Record<number, { cor: string; vazado: boolean }> = {
  1: { cor: 'var(--status-novo)', vazado: true },
  2: { cor: 'var(--status-novo)', vazado: false },
  3: { cor: 'var(--status-planejado)', vazado: false },
  4: { cor: 'var(--status-pendente)', vazado: false },
  5: { cor: 'var(--status-encerrado)', vazado: true },
  6: { cor: 'var(--status-encerrado)', vazado: false },
};

export function IconeStatus({ status }: { status: number }) {
  const aparencia = APARENCIA[status];
  if (!aparencia) return null;

  return (
    <span
      aria-hidden
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={
        aparencia.vazado
          ? { boxShadow: `inset 0 0 0 2px ${aparencia.cor}` }
          : { background: aparencia.cor }
      }
    />
  );
}
