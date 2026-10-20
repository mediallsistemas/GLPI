import ExcelJS from 'exceljs';
import { RelatorioChamados } from '@/lib/glpi/tipos';
import { COLUNAS, filtrosAplicados, indicadores } from './comum';

export async function gerarExcel(relatorio: RelatorioChamados): Promise<Buffer> {
  const livro = new ExcelJS.Workbook();

  const resumo = livro.addWorksheet('Resumo');
  resumo.columns = [{ width: 38 }, { width: 50 }];
  resumo.addRow(['Chamados GLPI']).font = { bold: true, size: 14 };
  resumo.addRow([]);
  filtrosAplicados(relatorio).forEach((linha) => (resumo.addRow(linha).getCell(1).font = { bold: true }));
  resumo.addRow([]);
  indicadores(relatorio).forEach((linha) => resumo.addRow(linha));
  if (relatorio.truncado) {
    resumo.addRow([]);
    resumo.addRow(['A lista de chamados excedeu o limite de leitura e está incompleta.']);
  }

  const chamados = livro.addWorksheet('Chamados abertos no período');
  chamados.columns = COLUNAS.map(({ chave, titulo, largura }) => ({ key: chave, header: titulo, width: largura }));
  chamados.getRow(1).font = { bold: true };
  chamados.views = [{ state: 'frozen', ySplit: 1 }];
  chamados.autoFilter = { from: 'A1', to: { row: 1, column: COLUNAS.length } };
  relatorio.chamados.forEach((linha) => chamados.addRow(linha));

  return Buffer.from(await livro.xlsx.writeBuffer());
}
