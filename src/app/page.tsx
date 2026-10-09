import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AvisoConfiguracao } from '@/components/AvisoConfiguracao';
import { MenuUsuario } from '@/components/MenuUsuario';
import { COOKIE_SESSAO, verificarSessao } from '@/lib/autenticacao/sessao-usuario';
import { TabelaChamados } from '@/components/TabelaChamados';
import { CartaoIndicador } from '@/components/painel/CartaoIndicador';
import { FiltroPeriodo } from '@/components/painel/FiltroPeriodo';
import { GraficoBarras } from '@/components/painel/GraficoBarras';
import { GraficoEvolucao } from '@/components/painel/GraficoEvolucao';
import { SecaoPainel } from '@/components/painel/SecaoPainel';
import { formatarDiaCurto, formatarDuracao, formatarNumero } from '@/lib/formatacao';
import {
  ehErroGlpi,
  listarChamados,
  mensagemDeErro,
  montarPainel,
  PERIODOS_PAINEL,
  periodoValido,
} from '@/lib/glpi';
import { Chamado, PainelChamados } from '@/lib/glpi/tipos';

export const dynamic = 'force-dynamic';

const horario = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

async function carregar(periodo: ReturnType<typeof periodoValido>) {
  try {
    const [painel, recentes] = await Promise.all([
      montarPainel(periodo),
      listarChamados({ limite: 10 }),
    ]);
    return { painel, recentes: recentes.itens, falha: null };
  } catch (erro) {
    return {
      painel: null,
      recentes: [] as Chamado[],
      falha: {
        mensagem: mensagemDeErro(erro),
        configuracao: ehErroGlpi(erro) && erro.codigo === 'CONFIGURACAO_INVALIDA',
      },
    };
  }
}

function Falha({ mensagem }: { mensagem: string }) {
  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
      <h2 className="text-base font-semibold">Não foi possível consultar o GLPI</h2>
      <p className="mt-2 text-sm">{mensagem}</p>
    </div>
  );
}

function Painel({ painel, recentes }: { painel: PainelChamados; recentes: Chamado[] }) {
  const { indicadores } = painel;
  const periodo = `desde ${formatarDiaCurto(painel.inicio)}`;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoIndicador
          destaque
          rotulo="Chamados em aberto"
          valor={formatarNumero(indicadores.emAberto)}
          detalhe={`${formatarNumero(indicadores.paradosHaMaisDe30Dias)} abertos há mais de 30 dias`}
        />
        <CartaoIndicador
          rotulo="Novos, sem atendimento"
          valor={formatarNumero(indicadores.novos)}
        />
        <CartaoIndicador rotulo="Pendentes" valor={formatarNumero(indicadores.pendentes)} />
        <CartaoIndicador
          rotulo="Abertos no período"
          valor={formatarNumero(indicadores.abertosNoPeriodo)}
          detalhe={periodo}
        />
        <CartaoIndicador
          rotulo="Solucionados no período"
          valor={formatarNumero(indicadores.solucionadosNoPeriodo)}
          detalhe={`Mediana de solução: ${formatarDuracao(indicadores.medianaSolucaoHoras)}`}
        />
      </div>

      <SecaoPainel
        titulo="Abertos × solucionados por dia"
        subtitulo={`Últimos ${painel.periodoDias} dias`}
      >
        <GraficoEvolucao pontos={painel.evolucaoDiaria} />
      </SecaoPainel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SecaoPainel titulo="Em aberto por status">
          <GraficoBarras fatias={painel.emAbertoPorStatus} vazio="Nenhum chamado em aberto." />
        </SecaoPainel>
        <SecaoPainel titulo="Em aberto por prioridade">
          <GraficoBarras fatias={painel.emAbertoPorPrioridade} vazio="Nenhum chamado em aberto." />
        </SecaoPainel>
        <SecaoPainel titulo="Em aberto por técnico" subtitulo="Chamados com mais de um técnico contam para cada um">
          <GraficoBarras fatias={painel.emAbertoPorTecnico} vazio="Nenhum chamado em aberto." />
        </SecaoPainel>
        <SecaoPainel titulo="Categorias mais abertas" subtitulo={`Chamados abertos ${periodo}`}>
          <GraficoBarras fatias={painel.categoriasNoPeriodo} vazio="Nenhum chamado aberto no período." />
        </SecaoPainel>
      </div>

      <SecaoPainel titulo="Atualizados recentemente">
        <TabelaChamados chamados={recentes} />
      </SecaoPainel>

      <p className="text-xs text-texto-suave">
        Atualizado em {horario.format(new Date(painel.geradoEm))}.
        {painel.amostraIncompleta
          ? ' O volume excedeu o limite de leitura; os totais estão exatos, mas as distribuições usam uma amostra.'
          : ''}
      </p>
    </>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const usuario = await verificarSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  if (!usuario) redirect('/login');

  const periodo = periodoValido((await searchParams).dias);
  const { painel, recentes, falha } = await carregar(periodo);

  return (
    <>
      <header className="bg-marinho text-marinho-texto">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-8 w-1 rounded-full bg-destaque" />
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold tracking-tight">Chamados GLPI</h1>
              <p className="text-sm text-marinho-suave">Visão geral do atendimento</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <FiltroPeriodo atual={periodo} opcoes={PERIODOS_PAINEL} />
            <span aria-hidden className="hidden h-8 w-px bg-white/15 sm:block" />
            <MenuUsuario usuario={usuario} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        {falha?.configuracao ? <AvisoConfiguracao mensagem={falha.mensagem} /> : null}
        {falha && !falha.configuracao ? <Falha mensagem={falha.mensagem} /> : null}
        {painel ? <Painel painel={painel} recentes={recentes} /> : null}
      </main>
    </>
  );
}
