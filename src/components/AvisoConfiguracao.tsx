export function AvisoConfiguracao({ mensagem }: { mensagem: string }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
      <h2 className="text-base font-semibold">Integração ainda não configurada</h2>
      <p className="mt-2 text-sm">{mensagem}</p>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm">
        <li>
          Copie <code className="font-mono">.env.example</code> para{' '}
          <code className="font-mono">.env.local</code>.
        </li>
        <li>Preencha a URL da instância GLPI e os tokens de aplicação e de usuário.</li>
        <li>
          Reinicie o servidor e confira{' '}
          <code className="font-mono">/api/glpi/status</code>.
        </li>
      </ol>
    </div>
  );
}
