import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import backend from '../dados/backend.json';
import endpoints from '../dados/endpoints.json';
import frontend from '../dados/frontend.json';
import metricas from '../dados/metricas.json';
import ml from '../dados/ml.json';
import seguranca from '../dados/seguranca.json';
import visao from '../dados/visaoGeral.json';
import { COBERTURA_ML } from '../dados/cobertura';
import { ITENS_SEGURANCA } from '../dados/seguranca-itens';
import { inteiro, percentual } from '../core/formato';
import { PAGINAS } from '../core/paginas';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

@Component({
  selector: 'app-visao-geral',
  imports: [RouterLink, NgIcon, GraficoComponent, KpiCardComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <app-secao titulo="O que é o sistema" id="sobre">
      <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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
        <ul class="flex flex-col gap-4">
          @for (d of diferenciais; track d.titulo) {
            <li class="border-border bg-card flex gap-4 rounded-xl border p-5">
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

    <app-secao titulo="O sistema em números" descricao="Contagens do código e resultados das execuções de teste de 14 de outubro de 2026." id="numeros">
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <app-kpi-card rotulo="Endpoints HTTP" [valor]="totalEndpoints" [apoio]="endpoints.dotnet.length + ' na Web API · ' + endpoints.ml.length + ' no serviço de ML'" icone="lucideRoute" />
        <app-kpi-card rotulo="Módulos de negócio" [valor]="backend.modulos.length" apoio="com controller, commands/queries e validadores" icone="lucideBriefcase" />
        <app-kpi-card rotulo="Rotas do front-end" [valor]="frontend.rotas.length" [apoio]="frontend.total.componentes + ' componentes standalone'" icone="lucideMonitor" />
        <app-kpi-card rotulo="Cobertura de linhas" [valor]="cobertura" apoio=".NET, Angular e ML somados; mutação em 76 %" icone="lucideTarget" />
        <app-kpi-card rotulo="Testes declarados" [valor]="inteiro(visao.totalTestes)" apoio="MSTest, Karma/Jasmine e pytest" icone="lucideFlaskConical" />
        <app-kpi-card rotulo="Verificações de ataque" [valor]="rodada.aprovadas + ' / ' + rodada.total" [apoio]="rodada.reprovadas + ' reprovadas · ' + rodada.informativas + ' informativas'" icone="lucideShieldAlert" />
        <app-kpi-card rotulo="Achados de segurança" [valor]="corrigidosDeTotal" [apoio]="resumoAchados" icone="lucideShieldCheck" />
        <app-kpi-card rotulo="Acurácia facial (LFW)" [valor]="acuracia" apoio="SFace, protocolo oficial de 10 dobras" icone="lucideScanFace" />
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico
          titulo="Achados de segurança por situação"
          subtitulo="Os 35 achados S1–S35 do relatório de segurança"
          [configurar]="graficoAchados"
          [altura]="300"
          [tabela]="tabelaAchados"
          [resumo]="'Rosca com os achados de segurança: ' + resumoAchados + '.'"
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

    <app-secao titulo="Fluxos principais" descricao="Os três caminhos que resumem o sistema: operar uma locação, entrar com segurança e manter os dados íntegros." id="fluxos">
      <div class="grid gap-6 lg:grid-cols-3">
        @for (f of fluxos; track f.titulo) {
          <article class="border-border bg-card flex h-full flex-col gap-4 rounded-xl border p-6">
            <div class="flex items-center gap-3">
              <span class="bg-primary-container text-on-primary-container flex size-10 shrink-0 items-center justify-center rounded-full">
                <ng-icon [name]="f.icone" class="text-lg" aria-hidden="true" />
              </span>
              <div>
                <h3 class="text-title-m text-foreground">{{ f.titulo }}</h3>
                <p class="text-body-s text-muted-foreground">{{ f.legenda }}</p>
              </div>
            </div>
            <ol class="flex flex-col gap-3">
              @for (passo of f.passos; track passo.titulo; let i = $index) {
                <li class="flex gap-3">
                  <span class="bg-secondary text-secondary-foreground text-label-m tabular flex size-6 shrink-0 items-center justify-center rounded-full">{{ i + 1 }}</span>
                  <p class="text-body-m text-muted-foreground"><strong class="text-foreground">{{ passo.titulo }}.</strong> {{ passo.texto }}</p>
                </li>
              }
            </ol>
            <a [routerLink]="'/' + f.pagina" class="text-primary text-label-l mt-auto underline">{{ f.link }}</a>
          </article>
        }
      </div>
    </app-secao>

    <app-secao titulo="As peças do sistema" descricao="Quatro componentes de software e uma borda, falando só por HTTP." id="pecas">
      <app-tabela-dados [colunas]="colunasPecas" [linhas]="pecas" legenda="componentes do sistema" [tamanhoInicial]="10" arquivo="componentes" />
    </app-secao>

    <app-secao titulo="Como percorrer a documentação" [descricao]="'As ' + paginas.length + ' páginas seguem do geral para o específico; o cubo ao lado monta uma peça a cada página.'" id="indice">
      <ul class="grid gap-4 sm:grid-cols-2">
        @for (p of paginas; track p.caminho; let i = $index) {
          @if (i > 0) {
            <li>
              <a
                [routerLink]="'/' + p.caminho"
                class="border-border bg-card hover:bg-surface-container flex h-full gap-4 rounded-xl border p-5 transition-colors"
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
  `
})
export class VisaoGeralPage {
  protected readonly backend = backend;
  protected readonly frontend = frontend;
  protected readonly endpoints = endpoints;
  protected readonly visao = visao;
  protected readonly rodada = seguranca.rodada!;
  protected readonly inteiro = inteiro;
  protected readonly paginas = PAGINAS;

  protected readonly totalEndpoints = endpoints.dotnet.length + endpoints.ml.length;
  protected readonly cobertura = percentual(
    (metricas.cobertura!.dotnet!.cobertas + metricas.cobertura!.angular!.cobertas + COBERTURA_ML.cobertas) /
    (metricas.cobertura!.dotnet!.linhas + metricas.cobertura!.angular!.linhas + COBERTURA_ML.linhas)
  );
  protected readonly acuracia = `${(seguranca.lfw!.acuracia * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

  protected readonly diferenciais = [
    { icone: 'lucideCalendarCheck', titulo: 'Cobrança calculada no servidor', texto: 'O valor do aluguel nunca é confiado ao navegador: plano, taxas e cupom são recalculados na API.' },
    { icone: 'lucideScanLine', titulo: 'Visão computacional', texto: 'A câmera lê a placa do veículo e abre a devolução correspondente; o rosto cadastrado entra como alternativa de login.' },
    { icone: 'lucideShieldCheck', titulo: 'Segurança desde a base', texto: 'Dados de cada empresa isolados no servidor, sessão curta com refresh rotativo, fila por empresa contra reservas duplicadas e uma bateria de ataques automatizada.' }
  ];

  protected readonly fluxos = [
    {
      icone: 'lucideCalendarCheck', titulo: 'Locação', legenda: 'Do cadastro à devolução', pagina: 'dominio', link: 'Ver regras de negócio',
      passos: [
        { titulo: 'Cadastro', texto: 'Cliente (pessoa física ou jurídica) e condutor, com CPF e CNPJ conferidos no servidor.' },
        { titulo: 'Simulação', texto: 'A API recalcula plano, taxas e cupom; o valor mostrado na tela nunca é o que vale.' },
        { titulo: 'Aluguel', texto: 'Registrado como reservado e iniciado na retirada; cancelar também é um comando próprio.' },
        { titulo: 'Devolução', texto: 'A câmera lê a placa e abre a devolução do aluguel; multa por atraso e combustível entram no valor final.' },
        { titulo: 'Retorno', texto: 'Desafios de cupom (N aluguéis no período) liberam um cupom de recompensa, e o painel resume o mês.' }
      ]
    },
    {
      icone: 'lucideKey', titulo: 'Acesso', legenda: 'Entrar e permanecer', pagina: 'seguranca', link: 'Ver segurança',
      passos: [
        { titulo: 'Cadastro e login', texto: 'Cadastro com limite de uso e resposta neutra; login com senha e limite por conta e IP.' },
        { titulo: 'Segundo fator', texto: 'Código do autenticador (TOTP) com códigos de recuperação, ou o rosto cadastrado, com prova de vida.' },
        { titulo: 'Sessão', texto: 'Token de acesso curto e refresh rotativo; reusar um refresh encerra todas as sessões da conta.' },
        { titulo: 'Papéis', texto: 'Cada papel vê menus e endpoints diferentes, e o servidor confere o papel em cada chamada.' }
      ]
    },
    {
      icone: 'lucideWorkflow', titulo: 'Integridade', legenda: 'O caminho de uma escrita', pagina: 'concorrencia', link: 'Ver concorrência',
      passos: [
        { titulo: 'Limite de uso', texto: 'Pedidos em excesso são recusados antes de chegar às regras.' },
        { titulo: 'Autorização', texto: 'Papel e empresa do token são conferidos em todos os endpoints (varridos pelo teste de reflexão).' },
        { titulo: 'Fila por empresa', texto: 'Comandos de aluguel e devolução entram um de cada vez por empresa, com trava no banco entre instâncias.' },
        { titulo: 'Índices únicos', texto: 'Última barreira no banco; a violação vira resposta 409 e nunca um erro 500.' }
      ]
    }
  ] as const;

  protected readonly pecas: Linha[] = [
    { componente: 'Interface', tecnologia: 'Angular 21, Spartan UI, Tailwind v4, tokens Material 3, ECharts', responsabilidade: 'Telas, validação de entrada, papéis na navegação', testes: frontend.total.testes },
    { componente: 'Web API', tecnologia: '.NET 8, MediatR, FluentValidation, Identity, EF Core', responsabilidade: 'Regras de negócio, autenticação, autorização, isolamento por empresa', testes: backend.testes.unidade + backend.testes.integracao + backend.testes.webapi },
    { componente: 'Banco', tecnologia: 'SQL Server + EF Core (migrations)', responsabilidade: 'Persistência; filtro global por empresa e exclusão lógica no DbContext', testes: '—' },
    { componente: 'Serviço de ML', tecnologia: 'Python 3.11, FastAPI, YOLOv8n, Tesseract, MediaPipe, SFace, MiniFASNet', responsabilidade: 'Placas, reconhecimento facial com prova de vida, assistente por regras', testes: ml.total.testes },
    { componente: 'Borda', tecnologia: 'nginx (fora de escopo desta etapa)', responsabilidade: 'Serve o Angular e encaminha /api/ à Web API; ao ML vão só o chat, as câmeras e o stream', testes: '—' }
  ];

  protected readonly colunasPecas: ColunaTabela[] = [
    { id: 'componente', titulo: 'Componente' },
    { id: 'tecnologia', titulo: 'Tecnologia', larguraMin: '16rem' },
    { id: 'responsabilidade', titulo: 'Responsabilidade', secundaria: true, larguraMin: '16rem' },
    { id: 'testes', titulo: 'Testes', tipo: 'numero' }
  ];

  protected readonly corrigidosDeTotal = `${ITENS_SEGURANCA.filter((i) => i.estado === 'Corrigido').length} de ${ITENS_SEGURANCA.length}`;
  protected readonly resumoAchados = `corrigidos · ${ITENS_SEGURANCA.filter((i) => i.estado === 'Parcial').length} parciais · ${ITENS_SEGURANCA.filter((i) => i.estado === 'Ignorado').length} ignorados por decisão`;

  private readonly achados = [
    ['Corrigidos', ITENS_SEGURANCA.filter((i) => i.estado === 'Corrigido').length],
    ['Parciais', ITENS_SEGURANCA.filter((i) => i.estado === 'Parcial').length],
    ['Ignorados por decisão', ITENS_SEGURANCA.filter((i) => i.estado === 'Ignorado').length]
  ] as const;

  protected readonly tabelaAchados = { colunas: ['Situação', 'Achados'], linhas: this.achados.map(([n, v]) => [n, v]) };

  protected readonly graficoAchados = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'item' },
    legend: { ...baseDoGrafico(t).legend, bottom: 0 },
    series: [{
      type: 'pie', radius: ['46%', '70%'], center: ['50%', '44%'],
      itemStyle: { borderColor: t.fundoDica, borderWidth: 2, borderRadius: 6 },
      label: { color: t.texto, fontFamily: t.fonte, formatter: '{c}' },
      data: this.achados.map(([name, value], i) => ({ name, value, itemStyle: { color: [t.sucesso, t.aviso, t.textoSecundario][i] } }))
    }]
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
