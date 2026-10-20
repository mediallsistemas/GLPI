import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COR_DA_PRIORIDADE } from '@/lib/aparencia';
import { descreverIntervalo, formatarDataHora, formatarDiaCurto, formatarDuracao, formatarNumero } from '@/lib/formatacao';
import { escala } from '@/lib/grafico';
import { FatiaPainel, LinhaRelatorio, PontoDiario, RelatorioChamados } from '@/lib/glpi/tipos';
import { filtrosAplicados } from './comum';

const COR = {
  fundo: '#f5f7fb',
  texto: '#1e293b',
  superficie: '#ffffff',
  secundario: '#626976',
  suave: '#64748b',
  grade: '#f2f3f4',
  eixo: '#cbd5e1',
  borda: '#e6e7e9',
  trilho: '#f1f5f9',
  marinho: '#1e293b',
  marinhoTexto: '#fafbfc',
  marinhoSuave: '#94a3b8',
  destaque: '#fec95c',
  serie1: '#206bc4',
  serie2: '#f76707',
};

const STATUS: Record<number, { cor: string; vazado: boolean }> = {
  1: { cor: '#49bf4d', vazado: true },
  2: { cor: '#49bf4d', vazado: false },
  3: { cor: '#1b2f62', vazado: false },
  4: { cor: '#ffa500', vazado: false },
  5: { cor: '#1e293b', vazado: true },
  6: { cor: '#1e293b', vazado: false },
};

const MARGEM = 28;
const ALTURA_CABECALHO = 68;
const TOPO_CONTEUDO = ALTURA_CABECALHO + 18;
const RAIO = 6;
const ESPACO = 10;

const horario = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

type Pdf = jsPDF;

function largura(pdf: Pdf) {
  return pdf.internal.pageSize.getWidth();
}

function altura(pdf: Pdf) {
  return pdf.internal.pageSize.getHeight();
}

function fonte(pdf: Pdf, tamanho: number, cor: string, peso: 'normal' | 'bold' = 'normal') {
  pdf.setFont('helvetica', peso);
  pdf.setFontSize(tamanho);
  pdf.setTextColor(cor);
}

function caber(pdf: Pdf, texto: string, maximo: number): string {
  if (pdf.getTextWidth(texto) <= maximo) return texto;
  let cortado = texto;
  while (cortado.length > 1 && pdf.getTextWidth(`${cortado}…`) > maximo) cortado = cortado.slice(0, -1);
  return `${cortado.trimEnd()}…`;
}

function fundo(pdf: Pdf) {
  pdf.setFillColor(COR.fundo);
  pdf.rect(0, 0, largura(pdf), altura(pdf), 'F');
}

function cabecalho(pdf: Pdf, relatorio: RelatorioChamados) {
  pdf.setFillColor(COR.marinho);
  pdf.rect(0, 0, largura(pdf), ALTURA_CABECALHO, 'F');

  pdf.setFillColor(COR.destaque);
  pdf.roundedRect(MARGEM, 20, 3, 28, 1.5, 1.5, 'F');
  fonte(pdf, 15, COR.marinhoTexto, 'bold');
  pdf.text('Chamados GLPI', MARGEM + 12, 32);
  fonte(pdf, 9, COR.marinhoSuave);
  pdf.text('Visão geral do atendimento', MARGEM + 12, 46);

  const direita = largura(pdf) - MARGEM;
  filtrosAplicados(relatorio).forEach(([rotulo, valor], indice) => {
    const y = 30 + indice * 14;
    fonte(pdf, 9, COR.marinhoTexto, 'bold');
    const textoValor = caber(pdf, valor, 340);
    pdf.text(textoValor, direita, y, { align: 'right' });
    const larguraValor = pdf.getTextWidth(textoValor);
    fonte(pdf, 9, COR.marinhoSuave);
    pdf.text(`${rotulo}  `, direita - larguraValor, y, { align: 'right' });
  });
}

function cartao(pdf: Pdf, x: number, y: number, w: number, h: number, destaque = false) {
  pdf.setDrawColor(COR.borda);
  pdf.setLineWidth(0.75);
  if (destaque) {
    pdf.setFillColor(COR.destaque);
    pdf.roundedRect(x, y, w, h, RAIO, RAIO, 'F');
    pdf.setFillColor(COR.superficie);
    pdf.roundedRect(x, y + 3.5, w, h - 3.5, RAIO, RAIO, 'F');
    pdf.rect(x, y + 3.5, w, RAIO, 'F');
    pdf.line(x, y + RAIO, x, y + h - RAIO);
    pdf.line(x + w, y + RAIO, x + w, y + h - RAIO);
    pdf.roundedRect(x, y + h - 2 * RAIO, w, 2 * RAIO, RAIO, RAIO, 'S');
    pdf.setFillColor(COR.superficie);
    pdf.rect(x + 0.5, y + h - 2 * RAIO - 0.5, w - 1, RAIO, 'F');
    return;
  }
  pdf.setFillColor(COR.superficie);
  pdf.roundedRect(x, y, w, h, RAIO, RAIO, 'FD');
}

function indicador(
  pdf: Pdf,
  caixa: { x: number; y: number; w: number; h: number },
  rotulo: string,
  valor: string,
  detalhe: string,
  destaque = false,
) {
  const { x, y, w, h } = caixa;
  cartao(pdf, x, y, w, h, destaque);
  const recuo = 14;
  fonte(pdf, 9, COR.secundario);
  pdf.text(rotulo, x + recuo, y + 22);
  fonte(pdf, destaque ? 44 : 22, COR.texto, 'bold');
  pdf.text(valor, x + recuo, destaque ? y + h / 2 + 14 : y + 48);
  fonte(pdf, 7.5, COR.suave);
  pdf.text(caber(pdf, detalhe, w - 2 * recuo), x + recuo, y + h - 14);
}

function secao(pdf: Pdf, caixa: { x: number; y: number; w: number; h: number }, titulo: string, subtitulo?: string) {
  const { x, y, w, h } = caixa;
  cartao(pdf, x, y, w, h);
  fonte(pdf, 11, COR.texto, 'bold');
  pdf.text(titulo, x + 14, y + 22);
  if (subtitulo) {
    fonte(pdf, 8.5, COR.secundario);
    pdf.text(caber(pdf, subtitulo, w - 28), x + 14, y + 35);
  }
  return { x: x + 14, y: y + (subtitulo ? 50 : 38), w: w - 28, h: h - (subtitulo ? 62 : 50) };
}

function iconeStatus(pdf: Pdf, status: number | undefined, x: number, y: number) {
  const aparencia = status ? STATUS[status] : undefined;
  if (!aparencia) return;
  if (aparencia.vazado) {
    pdf.setDrawColor(aparencia.cor);
    pdf.setLineWidth(1.4);
    pdf.circle(x, y, 2.9, 'S');
    return;
  }
  pdf.setFillColor(aparencia.cor);
  pdf.circle(x, y, 3.6, 'F');
}

function graficoEvolucao(pdf: Pdf, area: { x: number; y: number; w: number; h: number }, pontos: PontoDiario[]) {
  const series = [
    { chave: 'abertos' as const, rotulo: 'Abertos', cor: COR.serie1 },
    { chave: 'solucionados' as const, rotulo: 'Solucionados', cor: COR.serie2 },
  ];

  let xLegenda = area.x;
  fonte(pdf, 8, COR.secundario);
  for (const serie of series) {
    pdf.setDrawColor(serie.cor);
    pdf.setLineWidth(1.5);
    pdf.line(xLegenda, area.y - 3, xLegenda + 9, area.y - 3);
    pdf.text(serie.rotulo, xLegenda + 13, area.y);
    xLegenda += 13 + pdf.getTextWidth(serie.rotulo) + 14;
  }

  const margem = { topo: 16, direita: 34, base: 18, esquerda: 30 };
  const x0 = area.x + margem.esquerda;
  const larguraUtil = area.w - margem.esquerda - margem.direita;
  const topoY = area.y + margem.topo;
  const alturaUtil = area.h - margem.topo - margem.base;
  const total = pontos.length;
  const passoX = total > 1 ? larguraUtil / (total - 1) : 0;
  const { topo, passo } = escala(Math.max(...pontos.flatMap((p) => [p.abertos, p.solucionados]), 0));
  const px = (indice: number) => x0 + indice * passoX;
  const py = (valor: number) => topoY + alturaUtil - (valor / topo) * alturaUtil;

  fonte(pdf, 7.5, COR.suave);
  for (let valor = 0; valor <= topo; valor += passo) {
    pdf.setDrawColor(valor === 0 ? COR.eixo : COR.grade);
    pdf.setLineWidth(0.75);
    pdf.line(x0, py(valor), x0 + larguraUtil, py(valor));
    pdf.text(formatarNumero(valor), x0 - 6, py(valor) + 2.5, { align: 'right' });
  }

  const intervaloX = Math.max(1, Math.ceil(total / Math.max(2, Math.floor(larguraUtil / 52))));
  pontos.forEach((ponto, indice) => {
    if ((total - 1 - indice) % intervaloX !== 0) return;
    pdf.text(formatarDiaCurto(ponto.dia), px(indice), topoY + alturaUtil + 13, { align: 'center' });
  });

  for (const serie of series) {
    pdf.setDrawColor(serie.cor);
    pdf.setLineWidth(1.5);
    pdf.setLineJoin('round');
    pdf.setLineCap('round');
    for (let indice = 1; indice < total; indice++) {
      pdf.line(px(indice - 1), py(pontos[indice - 1][serie.chave]), px(indice), py(pontos[indice][serie.chave]));
    }
    if (total === 1) {
      pdf.setFillColor(serie.cor);
      pdf.circle(px(0), py(pontos[0][serie.chave]), 2, 'F');
    }
  }

  const ultimo = pontos[total - 1];
  if (ultimo && Math.abs(py(ultimo.abertos) - py(ultimo.solucionados)) >= 10) {
    fonte(pdf, 8, COR.secundario, 'bold');
    for (const serie of series) {
      pdf.text(formatarNumero(ultimo[serie.chave]), px(total - 1) + 6, py(ultimo[serie.chave]) + 3);
    }
  }
}

function graficoBarras(pdf: Pdf, area: { x: number; y: number; w: number; h: number }, fatias: FatiaPainel[], vazio: string) {
  const total = fatias.reduce((soma, fatia) => soma + fatia.valor, 0);
  if (total === 0) {
    fonte(pdf, 9, COR.suave);
    pdf.text(vazio, area.x, area.y + 14);
    return;
  }

  const maximo = Math.max(...fatias.map((fatia) => fatia.valor));
  const larguraRotulo = Math.min(150, area.w * 0.42);
  const linha = Math.min(19, area.h / fatias.length);
  const larguraBarras = area.w - larguraRotulo - 10;

  fatias.forEach((fatia, indice) => {
    const centro = area.y + indice * linha + linha / 2;
    let xTexto = area.x;
    if (fatia.status) {
      iconeStatus(pdf, fatia.status, area.x + 3.6, centro);
      xTexto += 13;
    }
    fonte(pdf, 8.5, COR.secundario);
    pdf.text(caber(pdf, fatia.rotulo, larguraRotulo - (xTexto - area.x) - 6), xTexto, centro + 3);

    const xBarra = area.x + larguraRotulo;
    const comprimento = fatia.valor > 0 ? Math.max(1.5, (fatia.valor / maximo) * larguraBarras * 0.85) : 0;
    if (comprimento) {
      pdf.setFillColor(COR.serie1);
      pdf.roundedRect(xBarra, centro - 5.5, comprimento, 11, 1.5, 1.5, 'F');
      pdf.rect(xBarra, centro - 5.5, Math.min(2, comprimento), 11, 'F');
    }
    fonte(pdf, 8.5, COR.texto, 'bold');
    pdf.text(formatarNumero(fatia.valor), xBarra + comprimento + 6, centro + 3);
  });
}

function paginaResumo(pdf: Pdf, relatorio: RelatorioChamados) {
  const { painel } = relatorio;
  const { indicadores: i } = painel;
  const periodo = descreverIntervalo(painel.inicio, painel.fim, painel.ateHoje);
  const util = largura(pdf) - 2 * MARGEM;
  const coluna = (util - 3 * ESPACO) / 4;
  const linhaCartao = 82;
  const y = TOPO_CONTEUDO;

  indicador(
    pdf,
    { x: MARGEM, y, w: 2 * coluna + ESPACO, h: 2 * linhaCartao + ESPACO },
    'Chamados em aberto',
    formatarNumero(i.emAberto),
    `Agora · ${formatarNumero(i.paradosHaMaisDe30Dias)} abertos há mais de 30 dias`,
    true,
  );
  const pequenos: [string, string, string][] = [
    ['Novos, sem atendimento', formatarNumero(i.novos), 'Agora'],
    ['Pendentes', formatarNumero(i.pendentes), 'Agora'],
    ['Abertos no período', formatarNumero(i.abertosNoPeriodo), periodo],
    ['Solucionados no período', formatarNumero(i.solucionadosNoPeriodo), `Mediana de solução: ${formatarDuracao(i.medianaSolucaoHoras)}`],
  ];
  pequenos.forEach(([rotulo, valor, detalhe], indice) => {
    const x = MARGEM + (2 + (indice % 2)) * (coluna + ESPACO);
    const yCartao = y + Math.floor(indice / 2) * (linhaCartao + ESPACO);
    indicador(pdf, { x, y: yCartao, w: coluna, h: linhaCartao }, rotulo, valor, detalhe);
  });

  const ySecao = y + 2 * linhaCartao + 2 * ESPACO;
  const area = secao(
    pdf,
    { x: MARGEM, y: ySecao, w: util, h: altura(pdf) - ySecao - 34 },
    'Abertos × solucionados por dia',
    `${formatarNumero(painel.periodoDias)} ${painel.periodoDias === 1 ? 'dia' : 'dias'}, ${periodo}`,
  );
  graficoEvolucao(pdf, { ...area, y: area.y + 2 }, painel.evolucaoDiaria);
}

function paginaDistribuicoes(pdf: Pdf, relatorio: RelatorioChamados) {
  const { painel } = relatorio;
  const periodo = descreverIntervalo(painel.inicio, painel.fim, painel.ateHoje);
  const util = largura(pdf) - 2 * MARGEM;
  const w = (util - ESPACO) / 2;
  const h = (altura(pdf) - TOPO_CONTEUDO - 34 - ESPACO) / 2;

  const blocos: [string, string, FatiaPainel[], string][] = [
    ['Em aberto por status', 'Situação agora, independe do período', painel.emAbertoPorStatus, 'Nenhum chamado em aberto.'],
    ['Em aberto por prioridade', 'Situação agora, independe do período', painel.emAbertoPorPrioridade, 'Nenhum chamado em aberto.'],
    [
      'Em aberto por técnico',
      'Situação agora · chamados com mais de um técnico contam para cada um',
      painel.emAbertoPorTecnico,
      'Nenhum chamado em aberto.',
    ],
    ['Categorias mais abertas', `Chamados abertos ${periodo}`, painel.categoriasNoPeriodo, 'Nenhum chamado aberto no período.'],
  ];

  blocos.forEach(([titulo, subtitulo, fatias, vazio], indice) => {
    const x = MARGEM + (indice % 2) * (w + ESPACO);
    const y = TOPO_CONTEUDO + Math.floor(indice / 2) * (h + ESPACO);
    graficoBarras(pdf, secao(pdf, { x, y, w, h }, titulo, subtitulo), fatias, vazio);
  });
}

const COLUNAS_TABELA: { chave: keyof LinhaRelatorio; titulo: string; largura?: number }[] = [
  { chave: 'id', titulo: '#', largura: 38 },
  { chave: 'titulo', titulo: 'Título' },
  { chave: 'unidade', titulo: 'Unidade', largura: 128 },
  { chave: 'status', titulo: 'Status', largura: 118 },
  { chave: 'prioridade', titulo: 'Prioridade', largura: 66 },
  { chave: 'categoria', titulo: 'Categoria', largura: 92 },
  { chave: 'tecnicos', titulo: 'Técnicos', largura: 100 },
  { chave: 'abertoEm', titulo: 'Aberto em', largura: 82 },
];

function tabelaChamados(pdf: Pdf, relatorio: RelatorioChamados) {
  const util = largura(pdf) - 2 * MARGEM;
  fonte(pdf, 11, COR.texto, 'bold');
  pdf.text('Chamados abertos no período', MARGEM, TOPO_CONTEUDO + 4);
  fonte(pdf, 8.5, COR.secundario);
  const quantidade = relatorio.chamados.length;
  pdf.text(
    `${formatarNumero(quantidade)} ${quantidade === 1 ? 'chamado' : 'chamados'}, ${descreverIntervalo(
      relatorio.painel.inicio,
      relatorio.painel.fim,
      relatorio.painel.ateHoje,
    )}${relatorio.truncado ? ' · lista incompleta: excedeu o limite de leitura' : ''}`,
    MARGEM,
    TOPO_CONTEUDO + 17,
  );

  if (quantidade === 0) {
    cartao(pdf, MARGEM, TOPO_CONTEUDO + 28, util, 44);
    fonte(pdf, 9, COR.suave);
    pdf.text('Nenhum chamado aberto no período.', MARGEM + 14, TOPO_CONTEUDO + 54);
    return;
  }

  const indiceStatus = COLUNAS_TABELA.findIndex((coluna) => coluna.chave === 'status');
  const indicePrioridade = COLUNAS_TABELA.findIndex((coluna) => coluna.chave === 'prioridade');

  autoTable(pdf, {
    startY: TOPO_CONTEUDO + 28,
    margin: { top: TOPO_CONTEUDO, left: MARGEM, right: MARGEM, bottom: 36 },
    tableWidth: util,
    columns: COLUNAS_TABELA.map((coluna) => ({ header: coluna.titulo.toUpperCase(), dataKey: coluna.chave })),
    body: relatorio.chamados.map((linha) => ({ ...linha, abertoEm: formatarDataHora(linha.abertoEm) })),
    theme: 'plain',
    rowPageBreak: 'avoid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      textColor: COR.texto,
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
      lineColor: COR.borda,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: { fillColor: COR.trilho, textColor: COR.secundario, fontStyle: 'normal', fontSize: 6.5 },
    bodyStyles: { fillColor: COR.superficie, lineWidth: { top: 0.75 } },
    columnStyles: Object.fromEntries(
      COLUNAS_TABELA.map((coluna, indice) => [
        indice,
        {
          ...(coluna.largura ? { cellWidth: coluna.largura } : { cellWidth: 'auto' as const }),
          ...(coluna.chave === 'id' ? { font: 'courier', fontSize: 7 } : {}),
          ...(coluna.chave === 'status' ? { cellPadding: { top: 5, bottom: 5, left: 19, right: 6 } } : {}),
        },
      ]),
    ),
    willDrawCell: (dado) => {
      if (dado.section === 'body' && dado.column.index === indicePrioridade) dado.cell.text = [];
    },
    didDrawCell: (dado) => {
      if (dado.section !== 'body') return;
      const linha = dado.row.raw as LinhaRelatorio;
      const centro = dado.cell.y + dado.cell.height / 2;
      if (dado.column.index === indiceStatus) {
        iconeStatus(pdf, linha.codigoStatus, dado.cell.x + 9.5, centro);
      }
      if (dado.column.index === indicePrioridade) {
        fonte(pdf, 7, COR.texto, 'bold');
        const texto = linha.prioridade;
        const larguraPilula = pdf.getTextWidth(texto) + 9;
        pdf.setFillColor(COR_DA_PRIORIDADE[linha.codigoPrioridade] ?? COR.trilho);
        pdf.roundedRect(dado.cell.x + 6, centro - 6, larguraPilula, 12, 2.5, 2.5, 'F');
        pdf.text(texto, dado.cell.x + 10.5, centro + 2.4);
      }
    },
    willDrawPage: (dado) => {
      if (dado.pageNumber === 1) return;
      fundo(pdf);
      cabecalho(pdf, relatorio);
    },
  });
}

function rodapes(pdf: Pdf, relatorio: RelatorioChamados) {
  const total = pdf.getNumberOfPages();
  const gerado = `Atualizado em ${horario.format(new Date(relatorio.painel.geradoEm))}`;
  const amostra = relatorio.painel.amostraIncompleta
    ? ' · o volume excedeu o limite de leitura; os totais estão exatos, mas as distribuições usam uma amostra'
    : '';
  for (let pagina = 1; pagina <= total; pagina++) {
    pdf.setPage(pagina);
    fonte(pdf, 7.5, COR.suave);
    pdf.text(`${gerado}${amostra}`, MARGEM, altura(pdf) - 16);
    pdf.text(`Página ${pagina} de ${total}`, largura(pdf) - MARGEM, altura(pdf) - 16, { align: 'right' });
  }
}

export function gerarPdf(relatorio: RelatorioChamados): Buffer {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  fundo(pdf);
  cabecalho(pdf, relatorio);
  paginaResumo(pdf, relatorio);

  pdf.addPage();
  fundo(pdf);
  cabecalho(pdf, relatorio);
  paginaDistribuicoes(pdf, relatorio);

  pdf.addPage();
  fundo(pdf);
  cabecalho(pdf, relatorio);
  tabelaChamados(pdf, relatorio);

  rodapes(pdf, relatorio);
  return Buffer.from(pdf.output('arraybuffer'));
}
