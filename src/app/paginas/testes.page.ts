import { ChangeDetectionStrategy, Component } from '@angular/core';
import backend from '../dados/backend.json';
import { COBERTURA_ANGULAR, COBERTURA_BLOCOS, COBERTURA_DOTNET, COBERTURA_ML, EXECUCOES_REGISTRADAS, META_COBERTURA } from '../dados/cobertura';
import frontend from '../dados/frontend.json';
import ml from '../dados/ml.json';
import { decimal, inteiro } from '../core/formato';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { CodigoComponent } from '../shared/layout/codigo.component';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

@Component({
  selector: 'app-testes',
  imports: [GraficoComponent, CodigoComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Testes declarados" [valor]="inteiro(total)" apoio="[TestMethod] + it() + def test_" icone="lucideFlaskConical" />
      <app-kpi-card rotulo="Testes .NET" [valor]="backend.testes.unidade + backend.testes.integracao + backend.testes.webapi" [apoio]="backend.testes.casosParametrizados + ' linhas [DataRow] a mais na execução'" icone="lucideServer" />
      <app-kpi-card rotulo="Specs Angular" [valor]="frontend.total.testes" [apoio]="frontend.total.specs + ' arquivos .spec.ts'" icone="lucideMonitor" />
      <app-kpi-card rotulo="Testes do ML" [valor]="ml.total.testes" apoio="pytest, com câmera e captura falsas" icone="lucideScanLine" />
    </div>

    <app-secao titulo="Pirâmide de testes" descricao="Muitos testes rápidos na base, menos de integração no meio e poucos ponta a ponta no topo: cada camada responde a uma pergunta diferente." id="piramide">
      <div class="grid gap-6 lg:grid-cols-2">
        <ol class="flex h-full flex-col justify-between gap-4" aria-label="Camadas de teste, do topo para a base">
          @for (c of camadas; track c.nome) {
            <li class="border-border bg-card flex flex-1 flex-wrap items-center gap-4 rounded-xl border p-5">
              <div class="min-w-0 flex-1">
                <p class="text-title-s text-foreground">{{ c.nome }}</p>
                <p class="text-body-s text-muted-foreground">{{ c.pergunta }}</p>
              </div>
              <span class="text-headline-s tabular" [class.text-muted-foreground]="c.qtd === 0">{{ inteiro(c.qtd) }}</span>
              <span class="text-label-m rounded-full px-2.5 py-1" [class]="c.existe ? 'bg-success-container text-on-success-container' : 'bg-muted text-muted-foreground'">
                {{ c.existe ? 'Existe' : 'Planejado' }}
              </span>
            </li>
          }
        </ol>
        <app-grafico titulo="Testes por camada" subtitulo="Quantidade declarada no código" [configurar]="graficoCamadas" [altura]="420" [tabela]="tabelaCamadas" resumo="Barras horizontais com os testes por camada: Angular, integração, unidade e Web API em .NET, serviço de ML, e zero em E2E e acessibilidade." />
      </div>
    </app-secao>

    <app-secao titulo="Onde estão os testes .NET" descricao="Arquivos com mais testes, por projeto. Os projetos de teste não referenciam a Web API de produção, exceto Tests.WebApi, que a sobe com WebApplicationFactory." id="dotnet">
      <app-grafico titulo="Os 15 arquivos com mais testes" subtitulo="MSTest; EF InMemory na integração" [configurar]="graficoArquivos" [altura]="460" [tabela]="tabelaArquivos" resumo="Barras horizontais com a quantidade de testes dos quinze maiores arquivos de teste do back-end." />
      <app-tabela-dados [colunas]="colunasArquivos" [linhas]="arquivos" legenda="arquivos de teste do back-end" arquivo="testes-dotnet" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Cobertura de código" descricao="Linhas ou statements executados pelos testes, por bloco e por pasta; a linha tracejada marca a meta de 75 %." id="cobertura">
      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico titulo="Cobertura por bloco" subtitulo="Angular, ML, .NET e totais" [configurar]="graficoBlocos" [altura]="420" [tabela]="tabelaBlocos" resumo="Barras horizontais com a cobertura de Angular, serviço de ML, .NET e totais, com uma linha vertical na meta de 75 por cento." />
        <app-grafico titulo="Cobertura do .NET por módulo" subtitulo="Domínio + Aplicação + Orm" [configurar]="graficoDotnet" [altura]="420" [tabela]="tabelaDotnet" resumo="Barras horizontais com a cobertura de linhas de cada módulo do back-end, do Dashboard com 94,7 por cento ao Funcionário com 7,9 por cento." />
        <app-grafico titulo="Cobertura do Angular por pasta" subtitulo="Linhas" [configurar]="graficoAngular" [altura]="420" [tabela]="tabelaAngular" resumo="Barras horizontais com a cobertura de linhas de cada pasta do front-end." />
        <app-grafico titulo="Cobertura do serviço de ML por pasta" subtitulo="O que falta depende de hardware ou modelo real" [configurar]="graficoMl" [altura]="420" [tabela]="tabelaMl" resumo="Barras horizontais com a cobertura de cada pasta do serviço de ML." />
      </div>
      <app-nota tom="aviso" titulo="Medição anterior à branch de segurança">
        Esta cobertura foi medida antes da branch de segurança, que acrescentou o projeto Tests.WebApi (a Web API era 0 % na prática) e dezenas de testes. Os números de .NET e
        ML de hoje tendem a ser maiores; não foram remedidos.
      </app-nota>
    </app-secao>

    <app-secao titulo="Execuções registradas" descricao="Contagem de testes executados (os [DataRow] expandem em vários casos) nos relatórios do projeto, em verde." id="execucoes">
      <app-tabela-dados [colunas]="colunasExecucoes" [linhas]="execucoes" legenda="execuções registradas dos testes" arquivo="execucoes-de-testes" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Lacunas conhecidas" id="lacunas">
      <ul class="grid gap-6 md:grid-cols-2">
        @for (l of lacunas; track l.titulo) {
          <li class="border-border bg-card flex h-full flex-col gap-2 rounded-xl border p-6">
            <p class="text-title-s text-foreground">{{ l.titulo }}</p>
            <p class="text-body-m text-muted-foreground">{{ l.texto }}</p>
          </li>
        }
      </ul>
      <app-nota tom="info" titulo="Pastas de componentes sem nenhum spec">
        Dos {{ frontend.total.componentes }} componentes, {{ semSpec.componentes }} estão em pastas sem nenhum arquivo de teste: {{ semSpec.pastas }}.
      </app-nota>
    </app-secao>

    <app-secao titulo="Como executar" id="executar">
      <div class="grid gap-6 lg:grid-cols-3">
        <app-codigo rotulo="Back-end (.NET)" [texto]="cmdDotnet" />
        <app-codigo rotulo="Serviço de ML" [texto]="cmdMl" />
        <app-codigo rotulo="Angular" [texto]="cmdAngular" />
      </div>
      <app-nota tom="aviso" titulo="Atenção ao disco">
        No ambiente do autor o Karma roda com o Edge (não há Chrome) e cada execução deixa de 200 a 400 MB de perfil em %TEMP%: use outro disco e apague depois. Detalhes no
        HANDOFF_PROMPT.md do software.
      </app-nota>
    </app-secao>
  `
})
export class TestesPage {
  protected readonly backend = backend;
  protected readonly frontend = frontend;
  protected readonly ml = ml;
  protected readonly inteiro = inteiro;

  protected readonly total = backend.testes.unidade + backend.testes.integracao + backend.testes.webapi + frontend.total.testes + ml.total.testes;

  protected readonly camadas = [
    { nome: 'E2E (Playwright)', pergunta: 'O fluxo completo funciona no navegador real, com a pilha real?', qtd: 0, existe: false },
    { nome: 'Acessibilidade e desempenho (axe, Lighthouse)', pergunta: 'A tela atende a requisitos não funcionais medidos?', qtd: 0, existe: false },
    { nome: 'Web API por HTTP (.NET)', pergunta: 'As rotas, os papéis e os erros se comportam como o contrato?', qtd: backend.testes.webapi, existe: true },
    { nome: 'Componente (Angular)', pergunta: 'A tela reage certo às entradas e às respostas simuladas da API?', qtd: frontend.total.testes, existe: true },
    { nome: 'Integração (.NET)', pergunta: 'As peças funcionam juntas, inclusive com o banco e o filtro por empresa?', qtd: backend.testes.integracao, existe: true },
    { nome: 'Unidade (.NET) e ML (pytest)', pergunta: 'A regra isolada está correta?', qtd: backend.testes.unidade + ml.total.testes, existe: true }
  ];

  protected readonly tabelaCamadas = { colunas: ['Camada', 'Testes'], linhas: this.camadas.map((c) => [c.nome, c.qtd]) };
  protected readonly graficoCamadas = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 48, top: 8, bottom: 8, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: eixoValor(t, { minInterval: 1, splitNumber: 4 }),
    yAxis: eixoCategoria(t, this.camadas.map((c) => c.nome), { inverse: true, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11, width: 130, overflow: 'break' } }),
    series: [{
      type: 'bar', barWidth: 22,
      data: this.camadas.map((c, i) => ({ value: c.qtd, itemStyle: { color: t.series[i % t.series.length], borderRadius: [0, 6, 6, 0] } })),
      label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte }
    }]
  });

  private readonly maiores = [...backend.testesPorArea].sort((a, b) => b.testes - a.testes).slice(0, 15);
  protected readonly tabelaArquivos = { colunas: ['Projeto', 'Arquivo', 'Testes'], linhas: this.maiores.map((a) => [a.projeto, a.arquivo, a.testes]) };
  protected readonly graficoArquivos = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: eixoValor(t, { minInterval: 1 }),
    yAxis: eixoCategoria(t, this.maiores.map((a) => a.arquivo), { inverse: true, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11 } }),
    series: [{
      type: 'bar', barWidth: 16,
      data: this.maiores.map((a) => ({ value: a.testes, itemStyle: { color: a.projeto.startsWith('Tests.Integracao') ? t.series[1] : a.projeto.startsWith('Tests.WebApi') ? t.series[3] : t.series[0], borderRadius: [0, 6, 6, 0] } })),
      label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte }
    }]
  });

  protected readonly arquivos: Linha[] = backend.testesPorArea.map((a) => ({ projeto: a.projeto, arquivo: a.arquivo, testes: a.testes }));
  protected readonly colunasArquivos: ColunaTabela[] = [
    { id: 'projeto', titulo: 'Projeto', filtravel: true },
    { id: 'arquivo', titulo: 'Arquivo', tipo: 'codigo', larguraMin: '14rem' },
    { id: 'testes', titulo: 'Testes', tipo: 'numero' }
  ];

  private barras(dados: readonly { nome?: string; bloco?: string; percentual: number }[], t: TemaGrafico, altura: number, marca = true) {
    const nomes = dados.map((d) => d.nome ?? d.bloco ?? '');
    return {
      ...baseDoGrafico(t),
      grid: { left: 8, right: 48, top: 8, bottom: 8, containLabel: true },
      tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => decimal(v, 1) + ' %' },
      xAxis: eixoValor(t, { max: 100, splitNumber: 4, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, formatter: '{value}%' } }),
      yAxis: eixoCategoria(t, nomes, { inverse: true, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11, width: 150, overflow: 'truncate' } }),
      series: [{
        type: 'bar', barWidth: nomes.length > 12 ? 12 : 20,
        data: dados.map((d) => ({ value: d.percentual, itemStyle: { color: d.percentual >= META_COBERTURA ? t.sucesso : d.percentual >= 50 ? t.series[0] : d.percentual >= 30 ? t.aviso : t.erro, borderRadius: [0, 6, 6, 0] } })),
        label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte, fontSize: 11, formatter: (p: { value: number }) => decimal(p.value, 1).replace(',0', '') + ' %' },
        markLine: marca ? { symbol: 'none', silent: true, lineStyle: { color: t.textoSecundario, type: 'dashed' }, label: { color: t.textoSecundario, formatter: 'meta ' + META_COBERTURA + ' %', position: 'insideEndTop' }, data: [{ xAxis: META_COBERTURA }] } : undefined
      }]
    };
  }

  protected readonly tabelaBlocos = { colunas: ['Bloco', 'Cobertura', 'Detalhe'], linhas: COBERTURA_BLOCOS.map((b) => [b.bloco, decimal(b.percentual, 1) + ' %', b.detalhe]) };
  protected readonly graficoBlocos = (t: TemaGrafico) => this.barras(COBERTURA_BLOCOS, t, 340);
  protected readonly tabelaDotnet = { colunas: ['Módulo', 'Cobertura'], linhas: COBERTURA_DOTNET.map((b) => [b.nome, decimal(b.percentual, 1) + ' %']) };
  protected readonly graficoDotnet = (t: TemaGrafico) => this.barras(COBERTURA_DOTNET, t, 340);
  protected readonly tabelaAngular = { colunas: ['Pasta', 'Cobertura'], linhas: COBERTURA_ANGULAR.map((b) => [b.nome, decimal(b.percentual, 0) + ' %']) };
  protected readonly graficoAngular = (t: TemaGrafico) => this.barras(COBERTURA_ANGULAR, t, 560);
  protected readonly tabelaMl = { colunas: ['Pasta', 'Cobertura'], linhas: COBERTURA_ML.map((b) => [b.nome, decimal(b.percentual, 1) + ' %']) };
  protected readonly graficoMl = (t: TemaGrafico) => this.barras(COBERTURA_ML, t, 220);

  protected readonly execucoes: Linha[] = EXECUCOES_REGISTRADAS.map((e) => ({ quando: e.quando, unidade: e.unidade, integracao: e.integracao, webapi: e.webapi, angular: e.angular, ml: e.ml, total: e.unidade + e.integracao + e.webapi + e.angular + e.ml }));
  protected readonly colunasExecucoes: ColunaTabela[] = [
    { id: 'quando', titulo: 'Quando' },
    { id: 'unidade', titulo: 'Unidade .NET', tipo: 'numero' },
    { id: 'integracao', titulo: 'Integração .NET', tipo: 'numero' },
    { id: 'webapi', titulo: 'Web API', tipo: 'numero' },
    { id: 'angular', titulo: 'Angular', tipo: 'numero' },
    { id: 'ml', titulo: 'ML', tipo: 'numero' },
    { id: 'total', titulo: 'Total', tipo: 'numero' }
  ];

  protected readonly lacunas = [
    { titulo: 'Sem E2E, sem axe e sem Lighthouse', texto: 'Nenhum teste ponta a ponta nem medição automática de acessibilidade ou de Web Vitals existe no repositório; estão planejados (Playwright, axe-core nos specs, Lighthouse CI).' },
    { titulo: 'Notificações falsas nos specs', texto: 'Os specs usam um serviço de notificação falso; por isso nunca detectaram o defeito em que nenhum toast aparecia (o sonner errado era importado). Falta um teste que renderize o HlmToaster.' },
    { titulo: 'Hardware real', texto: 'Webcam (monitoramento, verificação e login facial), prova de vida contra foto e tela e o desempenho do YOLO ao vivo nunca foram medidos.' },
    { titulo: 'Fluxos de escrita no navegador', texto: 'Os fluxos de escrita ponta a ponta no navegador, a imagem do ML em contêiner e o CI nunca foram exercitados (Docker e CI fora de escopo).' }
  ];

  protected readonly semSpec = (() => {
    const pastas = frontend.areas.filter((a) => a.componentes > 0 && a.specs === 0);
    return { componentes: pastas.reduce((a, p) => a + p.componentes, 0), pastas: pastas.map((p) => p.area).join(', ') };
  })();

  protected readonly cmdDotnet = 'cd Server\ndotnet test';
  protected readonly cmdMl = 'cd MachineLeaning\npy -m pytest -q';
  protected readonly cmdAngular = 'cd Client\nnpx ng test --watch=false \\\n  --karma-config=<caminho>/karma.edge.conf.js';
}
