import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import metricas from '../dados/metricas.json';
import { decimal, inteiro } from '../core/formato';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { ConceitosComponent, type Conceito } from '../shared/layout/conceitos.component';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import type { TomStatus } from '../shared/layout/status-badge.component';
import { TabelaDadosComponent, type Celula, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const lh = metricas.lighthouse!;
const e2e = metricas.e2e!;
const pacote = metricas.pacote!;

const NOMES: Record<string, string> = {
  login: 'Login', home: 'Início', clientes: 'Clientes', condutores: 'Condutores', veiculos: 'Veículos', alugueis: 'Aluguéis',
  devolucoes: 'Devoluções', 'aluguel-form': 'Novo aluguel', 'veiculo-form': 'Novo veículo', 'cliente-form': 'Novo cliente', 'devolucao-form': 'Devolução'
};
const nome = (t: string) => NOMES[t] ?? t;
const desktop = lh.telas.filter((t) => t.formato === 'desktop');
const celular = lh.telas.filter((t) => t.formato === 'mobile');
const faixa = (xs: number[], casas = 0) => {
  const a = Math.min(...xs);
  const b = Math.max(...xs);
  return a === b ? decimal(a, casas) : `${decimal(a, casas)} a ${decimal(b, casas)}`;
};

@Component({
  selector: 'app-acessibilidade',
  imports: [MatTabsModule, GraficoComponent, ConceitosComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Acessibilidade (Lighthouse)" valor="100" [apoio]="'em todas as ' + lh.telas.length + ' medições, desktop e celular'" icone="lucideEye" />
      <app-kpi-card rotulo="Desempenho no desktop" [valor]="faixaDesempenhoDesktop" [apoio]="'LCP de ' + faixaLcpDesktop + ' s'" icone="lucideGauge" />
      <app-kpi-card rotulo="Desempenho no celular" [valor]="faixaDesempenhoCelular" [apoio]="'4G lenta e CPU 4× mais lenta; LCP de ' + faixaLcpCelular + ' s'" icone="lucideTimer" />
      <app-kpi-card rotulo="Violações do axe-core" valor="0" [apoio]="auditorias + ' auditorias de página inteira, claro e escuro; mais 21 telas × 2 temas nos specs'" icone="lucideShieldCheck" />
    </div>

    <app-secao titulo="Como se mede" descricao="Quatro instrumentos que rodam localmente contra o build de produção e geram números repetíveis." id="instrumentos">
      <app-conceitos [itens]="conceitos" />
    </app-secao>

    <app-secao titulo="Lighthouse por tela" descricao="Mediana de 3 rodadas por tela, build de produção com cache frio. Telas logadas usam a sessão de uma empresa de teste." id="lighthouse">
      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico titulo="Nota de desempenho" subtitulo="Desktop e celular, por tela" [configurar]="graficoDesempenho" [altura]="380" [tabela]="tabelaDesempenho" resumo="Barras agrupadas com a nota de desempenho do Lighthouse de onze telas, no desktop entre 97 e 99 e no celular entre 66 e 82." />
        <app-grafico titulo="LCP: maior elemento visível" subtitulo="Segundos; meta de 2,5 s" [configurar]="graficoLcp" [altura]="380" [tabela]="tabelaLcp" resumo="Barras agrupadas com o tempo de LCP de onze telas, abaixo de 1,1 segundo no desktop e entre 3,7 e 4,9 segundos no celular, com uma linha na meta de 2,5 segundos." />
      </div>
      <app-tabela-dados [colunas]="colunasLighthouse" [linhas]="linhasLighthouse" legenda="resultado do Lighthouse por tela e formato" arquivo="lighthouse" [tamanhoInicial]="12" />
      <app-nota tom="info" titulo="Como ler o celular">
        A única oportunidade apontada é JavaScript não usado, de 150 ms por tela e 600 ms no início. O celular simula rede 4G lenta e CPU 4 vezes mais lenta, por isso as notas são mais baixas; no desktop todas passam de 97.
      </app-nota>
    </app-secao>

    <app-secao titulo="Acessibilidade com o axe-core" descricao="Duas camadas: nos specs do Karma, cada tela isolada, e no Playwright, a página inteira com cabeçalho, landmarks e título." id="axe">
      <div class="grid gap-6 md:grid-cols-2">
        <app-nota tom="sucesso" titulo="Specs do Karma (componente)">
          21 telas nos temas claro e escuro, com WCAG 2.0, 2.1 e 2.2 níveis A e AA e boas práticas, no Edge real, de modo que o contraste vale. O auditor desliga as transições de cor durante a medição: sem isso o axe lê o fundo no meio da transição de 150 ms e acusa contraste falso no tema escuro.
        </app-nota>
        <app-nota tom="sucesso" titulo="Playwright (página inteira)">
          {{ auditorias }} auditorias de {{ paginas }} páginas nos dois temas, todas com 0 violações. Regras de página inteira (região, main, h1, landmark único) só fazem sentido aqui, não no componente isolado.
        </app-nota>
      </div>
      <app-tabela-dados [colunas]="colunasAxe" [linhas]="linhasAxe" legenda="auditorias do axe-core na página inteira" arquivo="axe-pagina-inteira" [tamanhoInicial]="12" />
    </app-secao>

    <app-secao titulo="Ponta a ponta e tarefas" descricao="Três fluxos críticos e duas auditorias no Playwright, com o banco LocadoraDeVeiculos_Metricas e limpeza pela API." id="e2e">
      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico titulo="Tarefas cronometradas" subtitulo="Piso automatizado, sem hesitação humana: tempo em segundos e quantidade de cliques" [configurar]="graficoTarefas" [altura]="300" [tabela]="tabelaTarefas" resumo="Barras com o tempo em segundos de cada tarefa e uma linha com os cliques: cadastrar cliente 0,9 s e 3 cliques, criar aluguel 0,7 s e 5 cliques, registrar devolução 0,5 s e 2 cliques." />
        <app-tabela-dados [colunas]="colunasFluxos" [linhas]="fluxos" legenda="testes de ponta a ponta" arquivo="e2e" [tamanhoInicial]="10" />
      </div>
      <app-nota tom="aviso" titulo="Limite honesto">
        Máquina não hesita, não lê e não se perde: esses tempos são o menor valor possível. A experiência de pessoas reais (SUS, tarefas e heurísticas) tem protocolo pronto e ainda não foi coletada.
      </app-nota>
    </app-secao>

    <app-secao titulo="Tamanho do pacote" descricao="Build de produção do front-end." id="pacote">
      <div class="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <app-grafico titulo="Bruto e comprimido" subtitulo="KiB; o inicial é o que o login baixa" [configurar]="graficoPacote" [altura]="300" [tabela]="tabelaPacote" resumo="Barras agrupadas com o tamanho bruto e comprimido do pacote inicial, do que é carregado sob demanda e do total." />
        <app-tabela-dados [colunas]="colunasPacote" [linhas]="linhasPacote" legenda="tamanho do pacote do front-end" arquivo="pacote" [tamanhoInicial]="10" />
      </div>
    </app-secao>

    <app-secao titulo="O que as medições fizeram corrigir" descricao="Defeitos reais achados pelos instrumentos, com a medida antes e depois." id="correcoes">
      <app-tabela-dados [colunas]="colunasCorrecoes" [linhas]="correcoes" legenda="correções originadas das medições" arquivo="correcoes-das-medicoes" [tamanhoInicial]="10" />
    </app-secao>
  `
})
export class AcessibilidadePage {
  protected readonly lh = lh;
  protected readonly faixaDesempenhoDesktop = faixa(desktop.map((t) => t.desempenho));
  protected readonly faixaDesempenhoCelular = faixa(celular.map((t) => t.desempenho));
  protected readonly faixaLcpDesktop = faixa(desktop.map((t) => t.lcp_ms / 1000), 2);
  protected readonly faixaLcpCelular = faixa(celular.map((t) => t.lcp_ms / 1000), 1);
  protected readonly auditorias = e2e.acessibilidade.length;
  protected readonly paginas = new Set(e2e.acessibilidade.map((a) => a.pagina.replace(/ \((light|dark)\)/, ''))).size;

  protected readonly conceitos: Conceito[] = [
    { termo: 'Lighthouse', definicao: 'Mede em laboratório a nota de desempenho, acessibilidade e boas práticas de uma página, simulando rede e processador. Não mede o uso real de pessoas.', noSistema: `Lighthouse ${lh.versao} no Edge, 11 telas em desktop e celular, mediana de ${lh.rodadas} rodadas.` },
    { termo: 'LCP e CLS', definicao: 'LCP é o tempo até o maior elemento visível aparecer; o bom fica abaixo de 2,5 s. CLS soma os deslocamentos inesperados do layout durante o carregamento; o bom fica abaixo de 0,1.', noSistema: 'No desktop, LCP entre 0,84 e 1,09 s e CLS máximo de 0,036.' },
    { termo: 'TBT no lugar do INP', definicao: 'INP, a resposta às interações, só existe em medição de campo. O laboratório usa o TBT, o tempo em que a página ficou bloqueada para interação.', noSistema: 'TBT de 0 a 21 ms no desktop e de 27 a 310 ms no celular simulado.' },
    { termo: 'axe-core e WCAG', definicao: 'Biblioteca que aplica as regras automatizáveis das diretrizes de acessibilidade (WCAG): nome acessível, contraste, landmarks, rótulos. Não substitui o teste com leitor de tela.', noSistema: 'Roda nos specs do Karma e no Playwright; qualquer violação falha o teste.' }
  ];

  private readonly telas = [...new Set(lh.telas.map((t) => t.tela))];
  private valor(formato: string, tela: string, campo: 'desempenho' | 'lcp_ms'): number {
    const r = lh.telas.find((t) => t.formato === formato && t.tela === tela);
    return r ? (campo === 'lcp_ms' ? Number((r.lcp_ms / 1000).toFixed(2)) : r.desempenho) : 0;
  }

  protected readonly tabelaDesempenho = {
    colunas: ['Tela', 'Desktop', 'Celular'],
    linhas: this.telas.map((t) => [nome(t), this.valor('desktop', t, 'desempenho'), this.valor('mobile', t, 'desempenho')])
  };
  protected readonly graficoDesempenho = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.telas.map(nome), { axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 10, interval: 0, rotate: 35 } }),
      yAxis: eixoValor(t, { max: 100, min: 0 }),
      series: [
        { name: 'Desktop', type: 'bar', data: this.telas.map((x) => this.valor('desktop', x, 'desempenho')), itemStyle: { color: t.series[0], borderRadius: [4, 4, 0, 0] } },
        { name: 'Celular', type: 'bar', data: this.telas.map((x) => this.valor('mobile', x, 'desempenho')), itemStyle: { color: t.series[3], borderRadius: [4, 4, 0, 0] } }
      ]
    };
  };

  protected readonly tabelaLcp = {
    colunas: ['Tela', 'Desktop (s)', 'Celular (s)'],
    linhas: this.telas.map((t) => [nome(t), decimal(this.valor('desktop', t, 'lcp_ms'), 2), decimal(this.valor('mobile', t, 'lcp_ms'), 2)])
  };
  protected readonly graficoLcp = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => decimal(v, 2) + ' s' },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.telas.map(nome), { axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 10, interval: 0, rotate: 35 } }),
      yAxis: eixoValor(t, { name: 's', nameTextStyle: { color: t.textoSecundario } }),
      series: [
        {
          name: 'Desktop', type: 'bar', data: this.telas.map((x) => this.valor('desktop', x, 'lcp_ms')), itemStyle: { color: t.series[0], borderRadius: [4, 4, 0, 0] },
          markLine: { symbol: 'none', silent: true, lineStyle: { color: t.erro, type: 'dashed' }, label: { color: t.erro, formatter: 'meta 2,5 s' }, data: [{ yAxis: 2.5 }] }
        },
        { name: 'Celular', type: 'bar', data: this.telas.map((x) => this.valor('mobile', x, 'lcp_ms')), itemStyle: { color: t.series[3], borderRadius: [4, 4, 0, 0] } }
      ]
    };
  };

  private readonly tomNota = (v: Celula): TomStatus => (Number(v) >= 90 ? 'success' : Number(v) >= 50 ? 'warning' : 'error');
  protected readonly linhasLighthouse: Linha[] = lh.telas.map((t) => ({
    tela: nome(t.tela), formato: t.formato === 'desktop' ? 'Desktop' : 'Celular', desempenho: t.desempenho, acessibilidade: t.acessibilidade, boasPraticas: t.boasPraticas,
    lcp: Number((t.lcp_ms / 1000).toFixed(2)), cls: Number(t.cls.toFixed(3)), tbt: t.tbt_ms, transferido: Math.round(t.transferencia_kb)
  }));
  protected readonly colunasLighthouse: ColunaTabela[] = [
    { id: 'tela', titulo: 'Tela', filtravel: true },
    { id: 'formato', titulo: 'Formato', filtravel: true },
    { id: 'desempenho', titulo: 'Desempenho', tipo: 'selo', tom: this.tomNota },
    { id: 'acessibilidade', titulo: 'Acessibilidade', tipo: 'selo', tom: this.tomNota, secundaria: true },
    { id: 'boasPraticas', titulo: 'Boas práticas', tipo: 'selo', tom: this.tomNota, secundaria: true },
    { id: 'lcp', titulo: 'LCP (s)', tipo: 'numero' },
    { id: 'cls', titulo: 'CLS', tipo: 'numero', secundaria: true },
    { id: 'tbt', titulo: 'TBT (ms)', tipo: 'numero', secundaria: true },
    { id: 'transferido', titulo: 'Transferido (KB)', tipo: 'numero', secundaria: true }
  ];

  protected readonly linhasAxe: Linha[] = e2e.acessibilidade.map((a) => {
    const m = a.pagina.match(/^(.*) \((light|dark)\)$/);
    return { pagina: m ? m[1] : a.pagina, tema: m ? (m[2] === 'light' ? 'Claro' : 'Escuro') : '—', violacoes: a.violacoes };
  });
  protected readonly colunasAxe: ColunaTabela[] = [
    { id: 'pagina', titulo: 'Página', filtravel: true },
    { id: 'tema', titulo: 'Tema', filtravel: true },
    { id: 'violacoes', titulo: 'Violações', tipo: 'selo', tom: (v: Celula): TomStatus => (Number(v) === 0 ? 'success' : 'error') }
  ];

  protected readonly tabelaTarefas = { colunas: ['Tarefa', 'Tempo (s)', 'Cliques', 'Preenchimentos'], linhas: e2e.tarefas.map((t) => [t.tarefa, decimal(t.tempoS), t.cliques, t.preenchimentos]) };
  protected readonly graficoTarefas = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, e2e.tarefas.map((x) => x.tarefa.replace(' (pessoa física)', '')), { axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11, interval: 0, width: 90, overflow: 'break' } }),
      yAxis: [eixoValor(t, { name: 's', nameTextStyle: { color: t.textoSecundario } }), eixoValor(t, { name: 'cliques', nameTextStyle: { color: t.textoSecundario }, splitLine: { show: false }, minInterval: 1 })],
      series: [
        { name: 'Tempo (s)', type: 'bar', data: e2e.tarefas.map((x) => x.tempoS), itemStyle: { color: t.series[0], borderRadius: [4, 4, 0, 0] }, barWidth: 36 },
        { name: 'Cliques', type: 'line', yAxisIndex: 1, data: e2e.tarefas.map((x) => x.cliques), symbol: 'diamond', symbolSize: 9, lineStyle: { color: t.texto, type: 'dashed', width: 2 }, itemStyle: { color: t.texto } }
      ]
    };
  };

  protected readonly fluxos: Linha[] = [
    { fluxo: 'Cadastrar um cliente pessoa física e vê-lo na lista', resultado: 'Aprovado' },
    { fluxo: 'Criar um aluguel (reserva) e vê-lo como Reservado na lista', resultado: 'Aprovado' },
    { fluxo: 'Registrar uma devolução e ver condutor e cliente na lista', resultado: 'Aprovado' },
    { fluxo: 'Telas-chave sem violações de acessibilidade, tema claro', resultado: 'Aprovado' },
    { fluxo: 'Telas-chave sem violações de acessibilidade, tema escuro', resultado: 'Aprovado' }
  ];
  protected readonly colunasFluxos: ColunaTabela[] = [
    { id: 'fluxo', titulo: 'Teste', larguraMin: '18rem' },
    { id: 'resultado', titulo: 'Resultado', tipo: 'selo', tom: (): TomStatus => 'success' }
  ];

  private readonly partes = pacote.filter((p) => p.parte !== 'Total');
  protected readonly linhasPacote: Linha[] = pacote.map((p) => ({ parte: p.parte, arquivos: p.arquivos, bruto: p.brutoKb, gzip: p.gzipKb }));
  protected readonly colunasPacote: ColunaTabela[] = [
    { id: 'parte', titulo: 'Parte', larguraMin: '12rem' },
    { id: 'arquivos', titulo: 'Arquivos', tipo: 'numero', secundaria: true },
    { id: 'bruto', titulo: 'Bruto (KiB)', tipo: 'numero' },
    { id: 'gzip', titulo: 'gzip (KiB)', tipo: 'numero' }
  ];
  protected readonly tabelaPacote = { colunas: ['Parte', 'Bruto (KiB)', 'gzip (KiB)'], linhas: pacote.map((p) => [p.parte, inteiro(Math.round(p.brutoKb)), inteiro(Math.round(p.gzipKb))]) };
  protected readonly graficoPacote = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    const nomes = pacote.map((p) => p.parte.replace(' (index.html)', '').replace(' (rotas e bibliotecas)', ''));
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => inteiro(Math.round(v)) + ' KiB' },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, nomes),
      yAxis: eixoValor(t),
      series: [
        { name: 'Bruto', type: 'bar', data: pacote.map((p) => p.brutoKb), itemStyle: { color: t.series[0], borderRadius: [4, 4, 0, 0] } },
        { name: 'gzip', type: 'bar', data: pacote.map((p) => p.gzipKb), itemStyle: { color: t.series[2], borderRadius: [4, 4, 0, 0] } }
      ]
    };
  };

  protected readonly correcoes: Linha[] = [
    { achado: 'A tela inicial deslocava o layout ao carregar o gráfico', instrumento: 'Lighthouse', antes: 'CLS 0,148 no desktop', depois: 'CLS 0,003' },
    { achado: 'Tela de login sem o landmark main', instrumento: 'Lighthouse', antes: 'Acessibilidade 98', depois: 'Acessibilidade 100' },
    { achado: 'jsPDF (cerca de 410 kB) carregado só para abrir as listas', instrumento: 'Pacote', antes: 'Aluguéis e devoluções com cerca de 460 KB transferidos', depois: 'Cerca de 320 KB: o PDF só carrega quando se exporta' },
    { achado: 'Selects com aria-label no wrapper, em 5 telas', instrumento: 'axe-core', antes: 'select-name crítico', depois: 'Sem violação' },
    { achado: 'Botões de busca e do menu do usuário com nome acessível diferente do texto visível', instrumento: 'axe-core', antes: 'label-content-name-mismatch', depois: 'Sem violação' },
    { achado: 'Dois aside sem nome na mesma página', instrumento: 'axe-core', antes: 'landmark-unique', depois: 'Sem violação' }
  ];
  protected readonly colunasCorrecoes: ColunaTabela[] = [
    { id: 'achado', titulo: 'Achado', larguraMin: '18rem' },
    { id: 'instrumento', titulo: 'Instrumento', filtravel: true, secundaria: true },
    { id: 'antes', titulo: 'Antes', larguraMin: '12rem' },
    { id: 'depois', titulo: 'Depois', larguraMin: '12rem' }
  ];
}
