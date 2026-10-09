export function Falha({ titulo, mensagem }: { titulo: string; mensagem: string }) {
  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
      <h2 className="text-base font-semibold">{titulo}</h2>
      <p className="mt-2 text-sm">{mensagem}</p>
    </div>
  );
}
