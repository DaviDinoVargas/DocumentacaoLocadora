import { ChangeDetectionStrategy, Component } from '@angular/core';
import backend from '../dados/backend.json';
import { COBERTURA_ML, EXECUCOES_REGISTRADAS, META_COBERTURA } from '../dados/cobertura';
import frontend from '../dados/frontend.json';
import metricas from '../dados/metricas.json';
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

const cob = metricas.cobertura!;
const mut = metricas.mutacao!;
const e2e = metricas.e2e!;

const totalCobertas = cob.dotnet!.cobertas + cob.angular!.cobertas + COBERTURA_ML.cobertas;
const totalLinhas = cob.dotnet!.linhas + cob.angular!.linhas + COBERTURA_ML.linhas;
const totalPct = (totalCobertas / totalLinhas) * 100;

@Component({
  selector: 'app-testes',
  imports: [GraficoComponent, CodigoComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Testes declarados" [valor]="inteiro(total)" apoio="[TestMethod], it() e def test_" icone="lucideFlaskConical" />
      <app-kpi-card rotulo="Cobertura de linhas" [valor]="decimal(totalPct) + ' %'" [apoio]="inteiro(totalCobertas) + ' de ' + inteiro(totalLinhas) + ' (.NET, Angular e ML)'" icone="lucideTarget" />
      <app-kpi-card rotulo="Pontuação de mutação" [valor]="decimal(mut.pct) + ' %'" [apoio]="mut.mortos + ' de ' + mut.total + ' mutantes mortos nos handlers de negócio'" icone="lucideSwords" />
      <app-kpi-card rotulo="Specs Angular" [valor]="frontend.total.testes" [apoio]="frontend.total.specs + ' arquivos .spec.ts'" icone="lucideMonitor" />
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
              <span class="text-headline-s tabular">{{ inteiro(c.qtd) }}</span>
            </li>
          }
        </ol>
        <app-grafico titulo="Testes por camada" subtitulo="Quantidade declarada no código" [configurar]="graficoCamadas" [altura]="420" [tabela]="tabelaCamadas" resumo="Barras horizontais com os testes por camada: Angular, integração, unidade e Web API em .NET, serviço de ML, ponta a ponta e acessibilidade." />
      </div>
    </app-secao>

    <app-secao titulo="Onde estão os testes .NET" descricao="Arquivos com mais testes, por projeto. Os projetos de teste não referenciam a Web API de produção, exceto Tests.WebApi, que a sobe com WebApplicationFactory." id="dotnet">
      <app-grafico titulo="Os 15 arquivos com mais testes" subtitulo="MSTest; EF InMemory na integração" [configurar]="graficoArquivos" [altura]="460" [tabela]="tabelaArquivos" resumo="Barras horizontais com a quantidade de testes dos quinze maiores arquivos de teste do back-end." />
      <app-tabela-dados [colunas]="colunasArquivos" [linhas]="arquivos" legenda="arquivos de teste do back-end" arquivo="testes-dotnet" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Cobertura de código" descricao="Linhas ou instruções executadas pelos testes, medidas em {{ cob.medidoEm.split('-').reverse().join('/') }}; a linha tracejada marca a meta de 80 %." id="cobertura">
      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico titulo="Cobertura por bloco" subtitulo="Angular, ML, .NET e o total ponderado" [configurar]="graficoBlocos" [altura]="380" [tabela]="tabelaBlocos" resumo="Barras horizontais com a cobertura de Angular, serviço de ML, .NET e do total, todas acima da linha da meta de 80 por cento." />
        <app-grafico titulo="Cobertura do .NET por projeto" subtitulo="Linhas de produção, sem migrations" [configurar]="graficoDotnet" [altura]="380" [tabela]="tabelaDotnet" resumo="Barras horizontais com a cobertura de linhas de cada projeto do back-end: Domínio, Infraestrutura, Web API e Aplicação, todas acima de 90 por cento." />
      </div>
      <app-nota tom="info" titulo="Como se mede">
        .NET: coletor de cobertura do SDK nos três projetos de teste, mesclado por linha (o máximo de acertos de cada linha) e sem migrations. Angular: Karma com cobertura no Edge. ML: coverage.py com ramos. Os três números somam linhas e instruções, que não são a mesma unidade; o total é uma conta ponderada, não um número oficial de ferramenta.
      </app-nota>
    </app-secao>

    <app-secao titulo="Mutação: os testes pegam erro?" descricao="O Stryker.NET altera o código dos handlers de negócio (troca um operador, apaga uma linha) e verifica se algum teste falha. Cobertura diz que a linha rodou; mutação diz que o teste notaria um defeito nela." id="mutacao">
      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico titulo="Destino dos mutantes" subtitulo="Handlers de Core.Aplicacao, exceto autenticação e auditoria" [configurar]="graficoMutantes" [altura]="380" [tabela]="tabelaMutantes" resumo="Rosca com os mutantes mortos pelos testes, os que sobreviveram e os que não são alcançados por nenhum teste." />
        <app-grafico titulo="Arquivos com menor pontuação" subtitulo="Mutantes mortos em cada arquivo, em %" [configurar]="graficoArquivosMutacao" [altura]="380" [tabela]="tabelaArquivosMutacao" resumo="Barras horizontais com a pontuação de mutação dos quinze arquivos com menor resultado." />
      </div>
      <app-nota tom="info" titulo="O que sobrou de propósito">
        Linhas de log e de catch, edição sob rastreamento do EF (mutante equivalente), a fronteira de "agora" no painel e da validade do cupom (dependem do milissegundo) e a revogação do refresh token ao trocar a senha, que a sessão já derruba pelo carimbo de segurança.
      </app-nota>
    </app-secao>

    <app-secao titulo="Execuções registradas" descricao="Contagem de testes executados, todos em verde, em marcos do projeto." id="execucoes">
      <app-tabela-dados [colunas]="colunasExecucoes" [linhas]="execucoes" legenda="execuções registradas dos testes" arquivo="execucoes-de-testes" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="O que ainda não está coberto" id="lacunas">
      <ul class="grid gap-6 md:grid-cols-2">
        @for (l of lacunas; track l.titulo) {
          <li class="border-border bg-card flex h-full flex-col gap-2 rounded-xl border p-6">
            <p class="text-title-s text-foreground">{{ l.titulo }}</p>
            <p class="text-body-m text-muted-foreground">{{ l.texto }}</p>
          </li>
        }
      </ul>
    </app-secao>

    <app-secao titulo="Como executar" id="executar">
      <div class="grid gap-6 lg:grid-cols-3">
        <app-codigo rotulo="Back-end (.NET)" [texto]="cmdDotnet" />
        <app-codigo rotulo="Serviço de ML" [texto]="cmdMl" />
        <app-codigo rotulo="Angular" [texto]="cmdAngular" />
      </div>
      <app-nota tom="aviso" titulo="Atenção ao disco">
        Cada execução do Karma deixa de 200 a 400 MB de perfil do navegador em %TEMP%: use outro disco e apague depois.
      </app-nota>
    </app-secao>
  `
})
export class TestesPage {
  protected readonly backend = backend;
  protected readonly frontend = frontend;
  protected readonly ml = ml;
  protected readonly cob = cob;
  protected readonly mut = mut;
  protected readonly inteiro = inteiro;
  protected readonly decimal = decimal;
  protected readonly totalCobertas = totalCobertas;
  protected readonly totalLinhas = totalLinhas;
  protected readonly totalPct = totalPct;

  protected readonly total = backend.testes.unidade + backend.testes.integracao + backend.testes.webapi + frontend.total.testes + ml.total.testes;

  protected readonly camadas = [
    { nome: 'Ponta a ponta (Playwright)', pergunta: 'O fluxo completo funciona no navegador real, com a pilha real?', qtd: e2e.aprovados },
    { nome: 'Acessibilidade e desempenho', pergunta: 'A tela atende ao axe-core e ao Lighthouse? (auditorias de página inteira e medições)', qtd: e2e.acessibilidade.length + (metricas.lighthouse?.telas.length ?? 0) },
    { nome: 'Web API por HTTP (.NET)', pergunta: 'As rotas, os papéis e os erros se comportam como o contrato?', qtd: backend.testes.webapi },
    { nome: 'Componente (Angular)', pergunta: 'A tela reage certo às entradas e às respostas simuladas da API?', qtd: frontend.total.testes },
    { nome: 'Integração (.NET)', pergunta: 'As peças funcionam juntas, inclusive com o banco e o filtro por empresa?', qtd: backend.testes.integracao },
    { nome: 'Unidade (.NET) e ML (pytest)', pergunta: 'A regra isolada está correta?', qtd: backend.testes.unidade + ml.total.testes }
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

  private readonly blocos = [
    { nome: 'Angular', pct: cob.angular!.pct, detalhe: `${inteiro(cob.angular!.cobertas)} de ${inteiro(cob.angular!.linhas)} linhas` },
    { nome: 'Serviço de ML', pct: COBERTURA_ML.pct, detalhe: `${inteiro(COBERTURA_ML.cobertas)} de ${inteiro(COBERTURA_ML.linhas)} instruções (${COBERTURA_ML.comRamos} % com ramos)` },
    { nome: '.NET', pct: cob.dotnet!.pct, detalhe: `${inteiro(cob.dotnet!.cobertas)} de ${inteiro(cob.dotnet!.linhas)} linhas` },
    { nome: 'Total ponderado', pct: Number(totalPct.toFixed(1)), detalhe: `${inteiro(totalCobertas)} de ${inteiro(totalLinhas)}` }
  ];
  protected readonly tabelaBlocos = { colunas: ['Bloco', 'Cobertura', 'Detalhe'], linhas: this.blocos.map((b) => [b.nome, decimal(b.pct) + ' %', b.detalhe]) };

  private barras(nomes: string[], valores: number[], t: TemaGrafico, comMeta: boolean) {
    return {
      ...baseDoGrafico(t),
      grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
      tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => decimal(v) + ' %' },
      xAxis: eixoValor(t, { max: 100, splitNumber: 4, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, formatter: '{value}%' } }),
      yAxis: eixoCategoria(t, nomes, { inverse: true, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11, width: 150, overflow: 'truncate' } }),
      series: [{
        type: 'bar', barWidth: nomes.length > 8 ? 12 : 22,
        data: valores.map((v) => ({ value: v, itemStyle: { color: v >= META_COBERTURA ? t.sucesso : v >= 50 ? t.series[0] : v >= 30 ? t.aviso : t.erro, borderRadius: [0, 6, 6, 0] } })),
        label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte, fontSize: 11, formatter: (p: { value: number }) => decimal(p.value) + ' %' },
        markLine: comMeta ? { symbol: 'none', silent: true, lineStyle: { color: t.textoSecundario, type: 'dashed' }, label: { color: t.textoSecundario, formatter: 'meta ' + META_COBERTURA + ' %', position: 'insideEndTop' }, data: [{ xAxis: META_COBERTURA }] } : undefined
      }]
    };
  }

  protected readonly graficoBlocos = (t: TemaGrafico) => this.barras(this.blocos.map((b) => b.nome), this.blocos.map((b) => b.pct), t, true);

  protected readonly tabelaDotnet = { colunas: ['Projeto', 'Linhas', 'Cobertas', 'Cobertura'], linhas: cob.dotnet!.assemblies.map((a) => [a.nome, inteiro(a.linhas), inteiro(a.cobertas), decimal(a.pct) + ' %']) };
  protected readonly graficoDotnet = (t: TemaGrafico) => this.barras(cob.dotnet!.assemblies.map((a) => a.nome), cob.dotnet!.assemblies.map((a) => a.pct), t, true);

  private readonly mutantes = [
    { name: 'Mortos pelos testes', value: mut.mortos },
    { name: 'Sobreviveram', value: mut.sobreviveram },
    { name: 'Sem teste que os alcance', value: mut.semCobertura }
  ];
  protected readonly tabelaMutantes = { colunas: ['Destino', 'Mutantes'], linhas: this.mutantes.map((m) => [m.name, m.value]) };
  protected readonly graficoMutantes = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'item' },
    legend: { ...baseDoGrafico(t).legend, bottom: 0 },
    series: [{
      type: 'pie', radius: ['46%', '70%'], center: ['50%', '42%'],
      itemStyle: { borderColor: t.fundoDica, borderWidth: 2, borderRadius: 6 },
      label: { color: t.texto, fontFamily: t.fonte, formatter: '{c}' },
      data: this.mutantes.map((m, i) => ({ ...m, itemStyle: { color: [t.sucesso, t.erro, t.aviso][i] } }))
    }]
  });

  private readonly piores = mut.arquivos.slice(0, 15);
  protected readonly tabelaArquivosMutacao = { colunas: ['Arquivo', 'Mortos', 'Total', 'Pontuação'], linhas: this.piores.map((a) => [a.arquivo, a.mortos, a.total, a.pct + ' %']) };
  protected readonly graficoArquivosMutacao = (t: TemaGrafico) => this.barras(this.piores.map((a) => a.arquivo.replace('CommandHandler', '').replace('QueryHandler', '').replace('.cs', '')), this.piores.map((a) => a.pct), t, false);

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
    { titulo: 'Hardware real', texto: 'Webcam em uso (monitoramento, verificação e login facial), prova de vida em campo e o desempenho do YOLO ao vivo ainda não foram medidos.' },
    { titulo: 'Usabilidade com pessoas', texto: 'O protocolo (SUS, tarefas cronometradas e heurísticas de Nielsen) está pronto, mas a coleta com participantes não aconteceu; os tempos de tarefa são o piso automatizado.' },
    { titulo: 'Poucos fluxos ponta a ponta', texto: 'O Playwright cobre três fluxos críticos e duas auditorias. Os demais fluxos de escrita são cobertos por testes de API e de componente, não pelo navegador.' },
    { titulo: 'Mutantes que sobraram', texto: `${mut.sobreviveram} mutantes sobreviveram e ${mut.semCobertura} não têm teste que os alcance; os aceitos de propósito estão descritos na seção de mutação.` }
  ];

  protected readonly cmdDotnet = 'cd Server\ndotnet test';
  protected readonly cmdMl = 'cd MachineLeaning\npy -m pytest -q';
  protected readonly cmdAngular = 'cd Client\nnpx ng test --watch=false \\\n  --karma-config=<caminho>/karma.edge.conf.js';
}
