import { descreverIntervalo, formatarDuracao } from '@/lib/formatacao';
import { LinhaRelatorio, RelatorioChamados } from '@/lib/glpi/tipos';

export const COLUNAS: { chave: keyof LinhaRelatorio; titulo: string; largura: number }[] = [
  { chave: 'id', titulo: '#', largura: 8 },
  { chave: 'titulo', titulo: 'Título', largura: 40 },
  { chave: 'unidade', titulo: 'Unidade', largura: 30 },
  { chave: 'status', titulo: 'Status', largura: 22 },
  { chave: 'prioridade', titulo: 'Prioridade', largura: 12 },
  { chave: 'tipo', titulo: 'Tipo', largura: 12 },
  { chave: 'categoria', titulo: 'Categoria', largura: 22 },
  { chave: 'tecnicos', titulo: 'Técnicos', largura: 26 },
  { chave: 'abertoEm', titulo: 'Aberto em', largura: 19 },
  { chave: 'solucionadoEm', titulo: 'Solucionado em', largura: 19 },
];

export function filtrosAplicados(relatorio: RelatorioChamados): [string, string][] {
  const { painel, unidade } = relatorio;
  return [
    ['Período', descreverIntervalo(painel.inicio, painel.fim, painel.ateHoje)],
    ['Unidade', unidade ? unidade.nome : relatorio.restrito ? 'Todas as unidades do usuário' : 'Todas as unidades'],
  ];
}

export function indicadores(relatorio: RelatorioChamados): [string, string | number][] {
  const i = relatorio.painel.indicadores;
  return [
    ['Chamados em aberto (agora)', i.emAberto],
    ['Novos, sem atendimento (agora)', i.novos],
    ['Pendentes (agora)', i.pendentes],
    ['Abertos há mais de 30 dias (agora)', i.paradosHaMaisDe30Dias],
    ['Abertos no período', i.abertosNoPeriodo],
    ['Solucionados no período', i.solucionadosNoPeriodo],
    ['Mediana de solução', formatarDuracao(i.medianaSolucaoHoras)],
  ];
}

export function nomeDoArquivo(relatorio: RelatorioChamados, extensao: string): string {
  const unidade = relatorio.unidade ? `-unidade-${relatorio.unidade.id}` : '';
  return `chamados-${relatorio.painel.inicio}-a-${relatorio.painel.fim}${unidade}.${extensao}`;
}
