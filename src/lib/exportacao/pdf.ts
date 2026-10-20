import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RelatorioChamados } from '@/lib/glpi/tipos';
import { COLUNAS, filtrosAplicados, indicadores } from './comum';

const COLUNAS_PDF = COLUNAS.filter((coluna) => coluna.chave !== 'solucionadoEm');

export function gerarPdf(relatorio: RelatorioChamados): Buffer {
  const documento = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  documento.setFontSize(16);
  documento.text('Chamados GLPI', 40, 44);
  documento.setFontSize(10);
  documento.text(filtrosAplicados(relatorio).map(([rotulo, valor]) => `${rotulo}: ${valor}`), 40, 64);

  autoTable(documento, {
    startY: 90,
    head: [['Indicador', 'Valor']],
    body: indicadores(relatorio).map(([rotulo, valor]) => [rotulo, String(valor)]),
    theme: 'grid',
    tableWidth: 320,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [22, 40, 70] },
  });

  autoTable(documento, {
    head: [COLUNAS_PDF.map((coluna) => coluna.titulo)],
    body: relatorio.chamados.map((linha) => COLUNAS_PDF.map((coluna) => String(linha[coluna.chave]))),
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [22, 40, 70] },
    didDrawPage: () => {
      documento.setFontSize(8);
      documento.text(
        `Página ${documento.getNumberOfPages()}`,
        documento.internal.pageSize.getWidth() - 80,
        documento.internal.pageSize.getHeight() - 20,
      );
    },
  });

  if (relatorio.truncado) {
    documento.setFontSize(8);
    documento.text('A lista excedeu o limite de leitura e está incompleta.', 40, documento.internal.pageSize.getHeight() - 20);
  }

  return Buffer.from(documento.output('arraybuffer'));
}
