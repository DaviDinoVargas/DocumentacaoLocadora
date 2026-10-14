import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import backend from '../dados/backend.json';
import endpoints from '../dados/endpoints.json';
import frontend from '../dados/frontend.json';
import meta from '../dados/meta.json';
import ml from '../dados/ml.json';
import seguranca from '../dados/seguranca.json';
import visao from '../dados/visaoGeral.json';
import { inteiro } from '../core/formato';
import { PAGINAS } from '../core/paginas';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

@Component({
  selector: 'app-visao-geral',
  imports: [RouterLink, NgIcon, HlmBadgeImports, GraficoComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho>
      <span hlmBadge variant="secondary">Branch {{ meta.branch }}</span>
      <span hlmBadge variant="secondary">Commit {{ meta.commit }}</span>
      <span hlmBadge variant="outline">Código de {{ meta.ultimoCommit }}</span>
      <span hlmBadge variant="outline">{{ inteiro(meta.commitsNoRepositorio) }} commits</span>
    </app-pagina-cabecalho>

    <app-secao titulo="O que é o sistema" id="sobre">
      <div class="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div class="text-body-l text-foreground prose-doc flex flex-col gap-3">
          <p>
            A <strong>Locadora de Veículos</strong> é um produto web <strong>multiempresa</strong> que apoia a operação de uma locadora:
            clientes e condutores, frota, planos de cobrança, aluguéis, devoluções, cupons e um painel com os números do mês.
            Foi construído como TCC da Academia do Programador.
          </p>
          <p>
            Locadoras lidam com dados cadastrais sensíveis, com dinheiro e com um ativo físico cujo estado precisa ser conferido na saída e na
            devolução. Por isso o sistema nasceu com três diferenciais.
          </p>
        </div>
        <ul class="flex flex-col gap-3">
          @for (d of diferenciais; track d.titulo) {
            <li class="border-border bg-card flex gap-3 rounded-xl border p-4">
              <span class="bg-primary-container text-on-primary-container flex size-10 shrink-0 items-center justify-center rounded-full">
                <ng-icon [name]="d.icone" class="text-lg" aria-hidden="true" />
              </span>
              <div>
                <p class="text-title-s text-foreground">{{ d.titulo }}</p>
                <p class="text-body-s text-muted-foreground">{{ d.texto }}</p>
              </div>
            </li>
          }
        </ul>
      </div>
    </app-secao>

    <app-secao titulo="O sistema em números" descricao="Todos os valores abaixo foram contados no código-fonte (tools/extrair-dados.mjs), não digitados." id="numeros">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-kpi-card rotulo="Endpoints HTTP" [valor]="totalEndpoints" [apoio]="endpoints.dotnet.length + ' na Web API · ' + endpoints.ml.length + ' no serviço de ML'" icone="lucideRoute" />
        <app-kpi-card rotulo="Módulos de negócio" [valor]="backend.modulos.length" apoio="com controller, commands/queries e validadores" icone="lucideBriefcase" />
        <app-kpi-card rotulo="Rotas do front-end" [valor]="frontend.rotas.length" [apoio]="frontend.total.componentes + ' componentes standalone'" icone="lucideMonitor" />
        <app-kpi-card rotulo="Linhas de código" [valor]="inteiro(codigoTotal)" apoio="back-end + front-end + ML (sem testes nem migrations)" icone="lucideCode" />
        <app-kpi-card rotulo="Testes declarados" [valor]="inteiro(visao.totalTestes)" apoio="MSTest, Karma/Jasmine e pytest" icone="lucideFlaskConical" />
        <app-kpi-card rotulo="Verificações de ataque" [valor]="rodada.aprovadas + ' / ' + rodada.total" [apoio]="rodada.reprovadas + ' reprovadas · ' + rodada.informativas + ' informativas'" icone="lucideShieldAlert" />
        <app-kpi-card rotulo="Achados de segurança" valor="29 de 35" apoio="corrigidos · 4 parciais · 2 ignorados por decisão" icone="lucideShieldCheck" />
        <app-kpi-card rotulo="Acurácia facial (LFW)" [valor]="acuracia" apoio="SFace, protocolo oficial de 10 dobras" icone="lucideScanFace" />
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <app-grafico
          titulo="Código por componente"
          subtitulo="Linhas não vazias; migrations e código gerado do Spartan ficam de fora"
          [configurar]="graficoComponentes"
          [altura]="300"
          [tabela]="tabelaComponentes"
          resumo="Barras horizontais com as linhas de código de back-end, front-end, serviço de ML, testes e scripts de ataque."
        />
        <app-grafico
          titulo="Testes declarados por camada"
          subtitulo="[TestMethod], it() e def test_ encontrados no código"
          [configurar]="graficoTestes"
          [altura]="300"
          [tabela]="tabelaTestes"
          resumo="Barras com a quantidade de testes por camada: unidade, integração e Web API em .NET, Angular e Python."
        />
      </div>

      <app-grafico
        titulo="Módulos × complexidade"
        subtitulo="Linhas por camada (barras empilhadas, eixo à esquerda) e quantidade de endpoints (linha, eixo à direita)"
        [configurar]="graficoModulos"
        [altura]="380"
        [tabela]="tabelaModulos"
        resumo="Barras empilhadas com as linhas de código de cada módulo de negócio, divididas em domínio, aplicação, infraestrutura e Web API, e uma linha com o número de endpoints."
      />
    </app-secao>

    <app-secao titulo="As peças do sistema" descricao="Quatro componentes de software e uma borda, falando só por HTTP." id="pecas">
      <app-tabela-dados [colunas]="colunasPecas" [linhas]="pecas" legenda="componentes do sistema" [tamanhoInicial]="10" arquivo="componentes" />
    </app-secao>

    <app-secao titulo="Como percorrer a documentação" descricao="As 16 páginas seguem do geral para o específico; o cubo ao lado monta uma peça a cada página." id="indice">
      <ul class="grid gap-3 sm:grid-cols-2">
        @for (p of paginas; track p.caminho; let i = $index) {
          @if (i > 0) {
            <li>
              <a
                [routerLink]="'/' + p.caminho"
                class="border-border bg-card hover:bg-surface-container flex h-full gap-3 rounded-xl border p-4 transition-colors"
              >
                <span class="bg-secondary text-secondary-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
                  <ng-icon [name]="p.icone" class="text-lg" aria-hidden="true" />
                </span>
                <span class="min-w-0">
                  <span class="text-title-s text-foreground block">{{ i + 1 }}. {{ p.titulo }}</span>
                  <span class="text-body-s text-muted-foreground block">{{ p.resumo }}</span>
                </span>
              </a>
            </li>
          }
        }
      </ul>
    </app-secao>

    <app-nota tom="info" titulo="De onde vem cada informação">
      O código vence o texto: os números vêm do repositório do software (branch {{ meta.branch }}), os capítulos e as tabelas de métricas do
      material do TCC (LaTeX e apresentação) e os resultados da bateria de segurança. Onde o material e o código divergem, a página
      <a routerLink="/observacoes" class="text-primary underline">Observações</a> registra o conflito.
    </app-nota>
  `
})
export class VisaoGeralPage {
  protected readonly meta = meta;
  protected readonly backend = backend;
  protected readonly frontend = frontend;
  protected readonly endpoints = endpoints;
  protected readonly visao = visao;
  protected readonly rodada = seguranca.rodada!;
  protected readonly inteiro = inteiro;
  protected readonly paginas = PAGINAS;

  protected readonly totalEndpoints = endpoints.dotnet.length + endpoints.ml.length;
  protected readonly codigoTotal = visao.tamanhos.backend + visao.tamanhos.frontend + visao.tamanhos.ml;
  protected readonly acuracia = `${(seguranca.lfw!.acuracia * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

  protected readonly diferenciais = [
    { icone: 'lucideCalendarCheck', titulo: 'Cobrança calculada no servidor', texto: 'O valor do aluguel nunca é confiado ao navegador: plano, taxas e cupom são recalculados na API.' },
    { icone: 'lucideScanLine', titulo: 'Visão computacional', texto: 'A câmera lê a placa do veículo e abre a devolução correspondente; o rosto cadastrado entra como alternativa de login.' },
    { icone: 'lucideShieldCheck', titulo: 'Segurança desde a base', texto: 'Dados de cada empresa isolados no DbContext, sessão curta com refresh rotativo e uma bateria de ataques automatizada.' }
  ];

  protected readonly pecas: Linha[] = [
    { componente: 'Interface', tecnologia: 'Angular 21, Spartan UI, Tailwind v4, tokens Material 3, ECharts', responsabilidade: 'Telas, validação de entrada, papéis na navegação', linhas: visao.tamanhos.frontend, testes: frontend.total.testes },
    { componente: 'Web API', tecnologia: '.NET 8, MediatR, FluentValidation, Identity, EF Core', responsabilidade: 'Regras de negócio, autenticação, autorização, isolamento por empresa', linhas: visao.tamanhos.backend, testes: backend.testes.unidade + backend.testes.integracao + backend.testes.webapi },
    { componente: 'Banco', tecnologia: 'SQL Server + EF Core (migrations)', responsabilidade: 'Persistência; filtro global por empresa e exclusão lógica no DbContext', linhas: backend.camadas.infraestrutura, testes: '—' },
    { componente: 'Serviço de ML', tecnologia: 'Python 3.11, FastAPI, YOLOv8n, Tesseract, MediaPipe, SFace, MiniFASNet', responsabilidade: 'Placas, reconhecimento facial com prova de vida, assistente por regras', linhas: ml.total.loc, testes: ml.total.testes },
    { componente: 'Borda', tecnologia: 'nginx (fora de escopo desta etapa)', responsabilidade: 'Serve o Angular e encaminha /api/ e só /api/ml/chat ao ML', linhas: '—', testes: '—' }
  ];

  protected readonly colunasPecas: ColunaTabela[] = [
    { id: 'componente', titulo: 'Componente' },
    { id: 'tecnologia', titulo: 'Tecnologia', larguraMin: '16rem' },
    { id: 'responsabilidade', titulo: 'Responsabilidade', secundaria: true, larguraMin: '16rem' },
    { id: 'linhas', titulo: 'Linhas', tipo: 'numero' },
    { id: 'testes', titulo: 'Testes', tipo: 'numero' }
  ];

  private readonly dadosComponentes = [
    ['Back-end (.NET)', visao.tamanhos.backend],
    ['Front-end (Angular)', visao.tamanhos.frontend],
    ['Serviço de ML (Python)', visao.tamanhos.ml],
    ['Testes (todas as camadas)', visao.tamanhos.testes],
    ['Scripts de ataque (Python)', visao.tamanhos.ataques]
  ] as const;

  protected readonly tabelaComponentes = {
    colunas: ['Componente', 'Linhas'],
    linhas: this.dadosComponentes.map(([n, v]) => [n, inteiro(v)])
  };

  protected readonly graficoComponentes = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => inteiro(v) + ' linhas' },
    xAxis: eixoValor(t, { splitNumber: 3 }),
    yAxis: eixoCategoria(t, this.dadosComponentes.map(([n]) => n), { inverse: true }),
    series: [
      {
        type: 'bar',
        data: this.dadosComponentes.map(([, v], i) => ({ value: v, itemStyle: { color: t.series[i % t.series.length], borderRadius: [0, 6, 6, 0] } })),
        barWidth: 22,
        label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte, formatter: (p: { value: number }) => inteiro(p.value) }
      }
    ]
  });

  private readonly dadosTestes = [
    ['Unidade (.NET)', backend.testes.unidade],
    ['Integração (.NET)', backend.testes.integracao],
    ['Web API (.NET)', backend.testes.webapi],
    ['Angular', frontend.total.testes],
    ['Serviço de ML', ml.total.testes]
  ] as const;

  protected readonly tabelaTestes = {
    colunas: ['Camada', 'Testes'],
    linhas: this.dadosTestes.map(([n, v]) => [n, inteiro(v)])
  };

  protected readonly graficoTestes = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => inteiro(v) + ' testes' },
    xAxis: eixoCategoria(t, this.dadosTestes.map(([n]) => n), { axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11, interval: 0, width: 70, overflow: 'break' } }),
    yAxis: eixoValor(t),
    series: [
      {
        type: 'bar',
        data: this.dadosTestes.map(([, v], i) => ({ value: v, itemStyle: { color: t.series[i % t.series.length], borderRadius: [6, 6, 0, 0] } })),
        barWidth: 34,
        label: { show: true, position: 'top', color: t.texto, fontFamily: t.fonte }
      }
    ]
  });

  private readonly modulos = [...backend.modulos].sort((a, b) => b.total - a.total);

  protected readonly tabelaModulos = {
    colunas: ['Módulo', 'Domínio', 'Aplicação', 'Infra', 'Web API', 'Endpoints'],
    linhas: this.modulos.map((m) => [m.nome, inteiro(m.dominio), inteiro(m.aplicacao), inteiro(m.infraestrutura), inteiro(m.webapi), m.endpoints])
  };

  protected readonly graficoModulos = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    const camadas: [string, 'dominio' | 'aplicacao' | 'infraestrutura' | 'webapi'][] = [
      ['Domínio', 'dominio'], ['Aplicação', 'aplicacao'], ['Infraestrutura', 'infraestrutura'], ['Web API', 'webapi']
    ];
    return {
      ...base,
      grid: { left: 8, right: 8, top: 44, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.modulos.map((m) => m.nome), { axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11, interval: 0, rotate: 35 } }),
      yAxis: [
        eixoValor(t, { name: 'linhas', nameTextStyle: { color: t.textoSecundario } }),
        eixoValor(t, { name: 'endpoints', nameTextStyle: { color: t.textoSecundario }, splitLine: { show: false } })
      ],
      series: [
        ...camadas.map(([nome, chave], i) => ({
          name: nome, type: 'bar', stack: 'linhas', data: this.modulos.map((m) => m[chave]),
          itemStyle: { color: t.series[i] }, emphasis: { focus: 'series' }
        })),
        {
          name: 'Endpoints', type: 'line', yAxisIndex: 1, data: this.modulos.map((m) => m.endpoints), symbol: 'diamond', symbolSize: 9,
          lineStyle: { color: t.texto, width: 2, type: 'dashed' }, itemStyle: { color: t.texto }
        }
      ]
    };
  };
}
