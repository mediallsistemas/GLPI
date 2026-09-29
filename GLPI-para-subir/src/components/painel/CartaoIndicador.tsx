export function CartaoIndicador({
  rotulo,
  valor,
  detalhe,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-lg border border-borda bg-superficie p-5 ${destaque ? 'justify-between border-t-4 border-t-destaque sm:col-span-2 lg:row-span-2' : ''}`}
    >
      <span className="text-sm text-texto-secundario">{rotulo}</span>
      <span
        className={`font-semibold tracking-tight ${destaque ? 'text-6xl' : 'text-3xl'}`}
      >
        {valor}
      </span>
      {detalhe ? <span className="text-xs text-texto-suave">{detalhe}</span> : null}
    </div>
  );
}
