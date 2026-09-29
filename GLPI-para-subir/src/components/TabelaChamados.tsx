import { IconeStatus } from '@/components/IconeStatus';
import { Chamado } from '@/lib/glpi/tipos';

const formatador = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function formatarData(valor: string | null): string {
  if (!valor) return '—';
  const data = new Date(valor.replace(' ', 'T'));
  return Number.isNaN(data.getTime()) ? valor : formatador.format(data);
}

const COR_DA_PRIORIDADE: Record<number, string> = {
  1: '#fff2f2',
  2: '#ffe0e0',
  3: '#ffcece',
  4: '#ffbfbf',
  5: '#ffadad',
  6: '#ff5555',
};

export function TabelaChamados({ chamados }: { chamados: Chamado[] }) {
  if (chamados.length === 0) {
    return (
      <p className="rounded-lg border border-borda p-6 text-sm">
        Nenhum chamado retornado pela instância GLPI.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-borda">
      <table className="w-full min-w-[42rem] text-left text-sm">
        <thead className="bg-trilho text-xs uppercase tracking-wide text-texto-secundario">
          <tr>
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Título</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Prioridade</th>
            <th className="px-4 py-3 font-medium">Atualizado</th>
          </tr>
        </thead>
        <tbody>
          {chamados.map((chamado) => (
            <tr
              key={chamado.id}
              className="border-t border-borda"
            >
              <td className="px-4 py-3 font-mono text-xs">{chamado.id}</td>
              <td className="px-4 py-3">{chamado.titulo}</td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-2">
                  <IconeStatus status={chamado.status} />
                  {chamado.statusRotulo}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className="inline-block rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap text-[#1e293b]"
                  style={{ background: COR_DA_PRIORIDADE[chamado.prioridade] ?? 'var(--trilho)' }}
                >
                  {chamado.prioridadeRotulo}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {formatarData(chamado.atualizadoEm)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
