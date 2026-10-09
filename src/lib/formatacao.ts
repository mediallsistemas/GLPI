const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const numeroInteiro = new Intl.NumberFormat('pt-BR');
const numeroCompacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const percentual = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

export function formatarNumero(valor: number): string {
  return Math.abs(valor) >= 10_000 ? numeroCompacto.format(valor) : numeroInteiro.format(valor);
}

export function formatarPercentual(fracao: number): string {
  return percentual.format(fracao);
}

export function formatarDuracao(horas: number | null): string {
  if (horas === null) return '—';
  if (horas < 1) return `${Math.max(1, Math.round(horas * 60))} min`;
  if (horas < 48) return `${numeroInteiro.format(Math.round(horas * 10) / 10)} h`;
  return `${numeroInteiro.format(Math.round((horas / 24) * 10) / 10)} dias`;
}

export function formatarDataHora(valor: string | null): string {
  if (!valor) return '—';
  const data = new Date(valor.replace(' ', 'T'));
  return Number.isNaN(data.getTime()) ? valor : dataHora.format(data);
}

export function formatarDiaCurto(dia: string): string {
  const [, mes, diaDoMes] = dia.split('-');
  return `${diaDoMes}/${mes}`;
}

export function formatarDiaLongo(dia: string): string {
  const [ano, mes, diaDoMes] = dia.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(ano, mes - 1, diaDoMes)));
}
