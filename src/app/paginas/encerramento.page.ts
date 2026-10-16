import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { COBERTURA_ML } from '../dados/cobertura';
import { ITENS_SEGURANCA } from '../dados/seguranca-itens';
import backend from '../dados/backend.json';
import endpoints from '../dados/endpoints.json';
import frontend from '../dados/frontend.json';
import metricas from '../dados/metricas.json';
import seguranca from '../dados/seguranca.json';
import visao from '../dados/visaoGeral.json';
import { inteiro, percentual } from '../core/formato';
import { PAGINAS } from '../core/paginas';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, type TemaGrafico } from '../shared/charts/tema-grafico';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const rodada = seguranca.rodada!;
const cob = metricas.cobertura!;
const mut = metricas.mutacao!;
const lfw = seguranca.lfw!;
const corrigidos = ITENS_SEGURANCA.filter((i) => i.estado === 'Corrigido').length;

@Component({
  selector: 'app-encerramento',
  imports: [RouterLink, NgIcon, HlmButtonImports, GraficoComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <app-nota tom="sucesso" titulo="Cubo resolvido">
      Percorrer as {{ total }} páginas montou as {{ pecas }} peças do cubo e, nesta última, as cores de cada face se alinharam. Voltar à página principal faz o cubo explodir e recomeçar.
    </app-nota>

    <app-secao titulo="O que foi documentado" descricao="Cada página reúne os números do código, das execuções de teste e dos relatórios do projeto." id="resumo">
      <app-tabela-dados [colunas]="colunasPaginas" [linhas]="paginas" legenda="páginas da documentação" arquivo="paginas" [tamanhoInicial]="25" />
    </app-secao>

    <app-secao titulo="O estado do sistema em seis números" id="numeros">
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <app-kpi-card rotulo="Linhas de produção" [valor]="inteiro(codigo)" apoio="Web API, front-end e ML" icone="lucideCode" />
        <app-kpi-card rotulo="Endpoints" [valor]="endpoints.dotnet.length + endpoints.ml.length" [apoio]="backend.modulos.length + ' módulos · ' + frontend.rotas.length + ' rotas no front'" icone="lucideRoute" />
        <app-kpi-card rotulo="Testes declarados" [valor]="inteiro(visao.totalTestes)" apoio="verdes nas execuções registradas; os casos executados são mais" icone="lucideFlaskConical" />
        <app-kpi-card rotulo="Achados corrigidos" [valor]="corrigidos + ' de ' + itens" [apoio]="parciais + ' parciais e ' + ignorados + ' ignorados por decisão'" icone="lucideShieldCheck" />
        <app-kpi-card rotulo="Ataques barrados" [valor]="rodada.aprovadas + ' de ' + rodada.total" apoio="0 reprovadas; ZAP sem alerta real" icone="lucideShieldAlert" />
        <app-kpi-card rotulo="Reconhecimento facial" [valor]="percentual(lfw.acuracia)" apoio="acurácia no LFW; validação com câmera real pendente" icone="lucideScanFace" />
      </div>
      <app-grafico titulo="Onde o projeto está maduro e onde ainda não" subtitulo="Seis dimensões, todas em percentual" [configurar]="graficoProntidao" [altura]="380" [tabela]="tabelaProntidao" resumo="Radar com seis dimensões: achados de segurança corrigidos, ataques barrados, cobertura do .NET, do Angular e do ML e escore de mutação, todos entre 76 e 100 por cento." />
    </app-secao>

    <app-secao titulo="O que fica para depois" descricao="Pendências reais, da mais próxima do uso para a mais distante." id="pendencias">
      <ol class="flex flex-col gap-4">
        @for (p of pendencias; track p.titulo; let i = $index) {
          <li class="border-border bg-card flex gap-4 rounded-xl border p-6">
            <span class="bg-primary text-primary-foreground text-title-s tabular flex size-9 shrink-0 items-center justify-center rounded-full">{{ i + 1 }}</span>
            <div>
              <p class="text-title-s text-foreground">{{ p.titulo }}</p>
              <p class="text-body-m text-muted-foreground">{{ p.texto }}</p>
            </div>
          </li>
        }
      </ol>
    </app-secao>

    <app-secao titulo="Suposições adotadas" id="suposicoes">
      <ul class="text-body-m text-foreground prose-doc flex list-disc flex-col gap-2 pl-5">
        @for (s of suposicoes; track s) {
          <li>{{ s }}</li>
        }
      </ul>
    </app-secao>

    <div class="flex flex-wrap items-center gap-3">
      <a hlmBtn routerLink="/" variant="default"><ng-icon name="lucideRotateCcw" aria-hidden="true" /> Voltar ao começo (o cubo explode)</a>
      <a hlmBtn routerLink="/observacoes" variant="outline">Rever as decisões</a>
      <a hlmBtn variant="ghost" href="https://github.com/DaviDinoVargas/DocumentacaoLocadora" target="_blank" rel="noopener noreferrer">
        Repositório desta documentação <ng-icon name="lucideExternalLink" aria-hidden="true" />
      </a>
    </div>
  `
})
export class EncerramentoPage {
  protected readonly total = PAGINAS.length;
  protected readonly pecas = PAGINAS.length - 2;
  protected readonly endpoints = endpoints;
  protected readonly backend = backend;
  protected readonly frontend = frontend;
  protected readonly visao = visao;
  protected readonly rodada = rodada;
  protected readonly corrigidos = corrigidos;
  protected readonly parciais = ITENS_SEGURANCA.filter((i) => i.estado === 'Parcial').length;
  protected readonly ignorados = ITENS_SEGURANCA.filter((i) => i.estado === 'Ignorado').length;
  protected readonly itens = ITENS_SEGURANCA.length;
  protected readonly inteiro = inteiro;
  protected readonly percentual = percentual;
  protected readonly lfw = lfw;
  protected readonly codigo = visao.tamanhos.backend + visao.tamanhos.frontend + visao.tamanhos.ml;

  protected readonly paginas: Linha[] = PAGINAS.map((p, i) => ({ n: i + 1, pagina: p.titulo, grupo: p.grupo, resumo: p.resumo }));
  protected readonly colunasPaginas: ColunaTabela[] = [
    { id: 'n', titulo: '#', tipo: 'numero' },
    { id: 'pagina', titulo: 'Página', larguraMin: '12rem' },
    { id: 'grupo', titulo: 'Grupo', filtravel: true, secundaria: true },
    { id: 'resumo', titulo: 'O que traz', larguraMin: '22rem', secundaria: true }
  ];

  private readonly prontidao = [
    ['Achados corrigidos', (corrigidos / ITENS_SEGURANCA.length) * 100],
    ['Ataques barrados', (rodada.aprovadas / (rodada.aprovadas + rodada.reprovadas)) * 100],
    ['Cobertura .NET', cob.dotnet!.pct],
    ['Cobertura Angular', cob.angular!.pct],
    ['Cobertura ML', COBERTURA_ML.pct],
    ['Escore de mutação', mut.pct]
  ] as const;

  protected readonly tabelaProntidao = { colunas: ['Dimensão', '%'], linhas: this.prontidao.map(([n, v]) => [n, Math.round(v)]) };
  protected readonly graficoProntidao = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'item', valueFormatter: (v: number) => Math.round(v) + ' %' },
    legend: { show: false },
    radar: {
      indicator: this.prontidao.map(([name]) => ({ name, max: 100 })),
      radius: '64%',
      axisName: { color: t.texto, fontFamily: t.fonte, fontSize: 12 },
      splitLine: { lineStyle: { color: t.grade } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: t.grade } }
    },
    series: [{
      type: 'radar', symbolSize: 7,
      data: [{ name: 'Prontidão', value: this.prontidao.map(([, v]) => Number(v.toFixed(1))) }],
      lineStyle: { color: t.series[0], width: 2 }, itemStyle: { color: t.series[0] }, areaStyle: { color: t.series[0], opacity: 0.18 }
    }]
  });

  protected readonly pendencias = [
    { titulo: 'Validar a câmera real em campo', texto: 'Prova de vida, reconhecimento facial e leitura de placa com a câmera real, em condições de uso: a placa tem o custo do OCR medido, mas não o acerto.' },
    { titulo: 'Coletar usabilidade com pessoas', texto: 'Piloto, questionário SUS e tarefas cronometradas com pelo menos cinco participantes, mais a avaliação heurística independente.' },
    { titulo: 'Reforçar a verificação no cadastro', texto: 'Previsto como evolução; depende de e-mail transacional configurado.' },
    { titulo: 'Fechar os achados parciais', texto: 'Cabeçalhos e TLS, controle de cadastro e os limites do login facial seguem parciais; os dois primeiros dependem da camada de entrega.' },
    { titulo: 'Subir o escore de mutação', texto: `Os mutantes que sobreviveram e os sem cobertura estão concentrados nos handlers de edição e de listagem (${mut.sobreviveram} sobreviveram e ${mut.semCobertura} sem cobertura, de ${mut.total}).` },
    { titulo: 'Implantação', texto: 'Quando a camada de entrega entrar em escopo: endurecimento, revisão de segredos e de privilégios do banco.' }
  ];

  protected readonly suposicoes = [
    'Quando o texto de apoio e o código divergem, vale o código; as decisões e os limites conhecidos estão na página Observações.',
    'Os 35 achados de segurança foram classificados à mão a partir dos relatórios; as demais contagens são calculadas a partir do código e dos resultados de teste.',
    'Cobertura, mutação, carga, Lighthouse e a bateria de ataques vêm das execuções registradas em 14 de outubro de 2026; os números não foram medidos de novo.',
    '"Testes declarados" conta [TestMethod], it() e def test_; o número executado é maior porque os [DataRow] expandem em vários casos.',
    'As medidas locais servem como linha de base: máquina de desenvolvimento, sem rede real e com poucos dados.',
    'O Angular Material 3 entra como tema (tokens --mat-sys-* ligados aos tokens do sistema) e em componentes interativos (abas, acordeão, tooltip); estrutura e botões são Spartan.'
  ];
}
