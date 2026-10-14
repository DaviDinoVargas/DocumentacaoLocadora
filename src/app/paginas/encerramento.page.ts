import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { COBERTURA_BLOCOS } from '../dados/cobertura';
import { ITENS_SEGURANCA } from '../dados/seguranca-itens';
import backend from '../dados/backend.json';
import endpoints from '../dados/endpoints.json';
import frontend from '../dados/frontend.json';
import seguranca from '../dados/seguranca.json';
import visao from '../dados/visaoGeral.json';
import { inteiro } from '../core/formato';
import { PAGINAS } from '../core/paginas';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, type TemaGrafico } from '../shared/charts/tema-grafico';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const rodada = seguranca.rodada!;
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

    <app-secao titulo="O que foi documentado" descricao="Cada página extrai seus números do código ou do material do TCC." id="resumo">
      <app-tabela-dados [colunas]="colunasPaginas" [linhas]="paginas" legenda="páginas da documentação" arquivo="paginas" [tamanhoInicial]="25" />
    </app-secao>

    <app-secao titulo="O estado do sistema em seis números" id="numeros">
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <app-kpi-card rotulo="Linhas de produção" [valor]="inteiro(codigo)" apoio="Web API, front-end e ML" icone="lucideCode" />
        <app-kpi-card rotulo="Endpoints" [valor]="endpoints.dotnet.length + endpoints.ml.length" [apoio]="backend.modulos.length + ' módulos · ' + frontend.rotas.length + ' rotas no front'" icone="lucideRoute" />
        <app-kpi-card rotulo="Testes declarados" [valor]="inteiro(visao.totalTestes)" apoio="verdes nas execuções registradas" icone="lucideFlaskConical" />
        <app-kpi-card rotulo="Achados corrigidos" [valor]="corrigidos + ' de ' + itens" [apoio]="parciais + ' parciais e ' + ignorados + ' ignorados por decisão'" icone="lucideShieldCheck" />
        <app-kpi-card rotulo="Ataques barrados" [valor]="rodada.aprovadas + ' de ' + rodada.total" apoio="0 reprovadas; 0 erros 5xx sob carga" icone="lucideShieldAlert" />
        <app-kpi-card rotulo="Reconhecimento facial" valor="98,3 %" apoio="acurácia no LFW; sem medição com webcam ainda" icone="lucideScanFace" />
      </div>
      <app-grafico titulo="Onde o projeto está maduro e onde ainda não" subtitulo="Seis dimensões, todas em percentual a partir de dados desta documentação" [configurar]="graficoProntidao" [altura]="380" [tabela]="tabelaProntidao" resumo="Radar com seis dimensões: achados de segurança corrigidos 83 por cento, ataques barrados 98 por cento, cobertura do Angular 75 por cento, cobertura do ML 71 por cento, cobertura do .NET 32 por cento e métricas já medidas 25 por cento." />
    </app-secao>

    <app-secao titulo="O que fica para depois" descricao="Pendências reais, na ordem em que o material do TCC e os relatórios as colocam." id="pendencias">
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
      <a hlmBtn routerLink="/observacoes" variant="outline">Rever as observações</a>
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
    ['Cobertura Angular', COBERTURA_BLOCOS[0].percentual],
    ['Cobertura ML', COBERTURA_BLOCOS[1].percentual],
    ['Cobertura .NET', COBERTURA_BLOCOS[2].percentual],
    ['Métricas medidas', (3 / 12) * 100]
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
    { titulo: 'Medir a prova de vida com a webcam', texto: 'Segurar uma foto impressa e uma foto na tela do celular e conferir a pontuação (S3); medir também o SFace com a câmera real e o tempo de leitura de placa.' },
    { titulo: 'Confirmação de e-mail no cadastro', texto: 'Hoje uma conta recém-cadastrada entra sem confirmar o e-mail (S6, pendência A16); depende de e-mail transacional configurado.' },
    { titulo: 'Instrumentos de medição do front-end', texto: 'axe-core nos specs do Karma, Lighthouse CI com script de login e Web Vitals, para ter números repetíveis de acessibilidade e desempenho.' },
    { titulo: 'E2E com Playwright', texto: 'Três fluxos críticos (cadastrar cliente, criar aluguel com cupom, registrar devolução) em banco separado.' },
    { titulo: 'Coletar usabilidade com pessoas reais', texto: 'Piloto, SUS e tarefas cronometradas com pelo menos cinco participantes, e avaliação heurística independente.' },
    { titulo: 'Elevar a cobertura acima de 75 %', texto: 'Foco em Core.Aplicacao (Funcionário, Condutor, Taxa de serviço, Clientes) e em remedir com o projeto Tests.WebApi.' },
    { titulo: 'Implantação', texto: 'Quando o Docker e o CI entrarem em escopo: TLS e CSP na borda, TRUSTED_PROXIES, AllowedHosts, FRONTEND_URL, FACE_ENCRYPTION_KEYS e tokens aleatórios; SQL com usuário de menor privilégio.' }
  ];

  protected readonly suposicoes = [
    'O código vence o texto do TCC; as divergências estão na página Observações.',
    'Docker, nginx e CI ficam fora de escopo, como decidido pelo autor do software.',
    'Os 35 achados de segurança foram curados à mão a partir do relatório; as demais contagens vêm do extrator.',
    'Medidas de latência, pacote do front-end e cobertura vêm das medições registradas no material e nos relatórios, não foram refeitas aqui.',
    '"Testes declarados" conta [TestMethod], it() e def test_ no código; o número executado é maior porque os [DataRow] expandem em vários casos.',
    'O Angular Material 3 entra como tema (tokens --mat-sys-* ligados aos tokens do software) e em componentes interativos (abas, acordeão, tooltip); estrutura e botões são Spartan.'
  ];
}
