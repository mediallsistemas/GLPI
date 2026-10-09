'use client';

export function InterruptorAcesso({
  ligado,
  pendente,
  desabilitado,
  rotulo,
  titulo,
  aoAlternar,
}: {
  ligado: boolean;
  pendente: boolean;
  desabilitado: boolean;
  rotulo: string;
  titulo?: string;
  aoAlternar: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      aria-busy={pendente || undefined}
      title={titulo}
      disabled={desabilitado || pendente}
      onClick={aoAlternar}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-serie-1 disabled:cursor-not-allowed ${
        ligado ? 'bg-serie-1' : 'bg-eixo'
      } ${pendente ? 'opacity-60' : ''} ${desabilitado && !pendente ? 'opacity-50' : ''}`}
    >
      <span
        aria-hidden
        className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
          ligado ? 'translate-x-5.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
