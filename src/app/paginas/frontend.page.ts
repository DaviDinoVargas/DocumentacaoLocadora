import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import frontend from '../dados/frontend.json';
import metricas from '../dados/metricas.json';
import { decimal, inteiro } from '../core/formato';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const DESCRICAO_BLOCOS: Record<string, string> = {
  'app-data-table': 'Busca com debounce, filtros por coluna com chips, ordenação, colunas visíveis, densidade, CSV, paginação, estado na URL e cartões no celular',
  'app-form-field': 'Rótulo, ajuda e erro ligados por aria-describedby',
  'app-form-actions': 'Rodapé do formulário: Cancelar à esquerda, Salvar à direita',
  'app-form-errors': 'Resumo de erros e foco no primeiro campo inválido',
  'app-form-section': 'Agrupa campos por assunto com título de seção',
  'app-form-skeleton': 'Esqueleto de carregamento com a forma do formulário',
  'app-input-prefixo': 'Campo com prefixo (R$, km)',
  'app-kpi-card': 'KPI com valor tabular e drill-down para a lista filtrada',
  'app-chart-widget': 'Gráfico ECharts com cores lidas dos tokens e "Ver como tabela"',
  'app-shell': 'Casca: barra lateral recolhível, barra superior, tema e menu do usuário',
  'app-command-palette': 'Paleta de comandos (Ctrl/Cmd + K) para ir a qualquer tela',
  'app-empty-state': 'Estado vazio com próximo passo',
  'app-error-state': 'Estado de erro com "Tentar novamente"',
  'app-page-header': 'Título, apoio e a única ação primária da página',
  'app-page': 'Contêiner de página com largura máxima',
  'app-sidebar-nav': 'Lista de navegação por grupos, com item ativo destacado',
  'app-status-badge': 'Status sempre com ícone e texto, nunca só cor'
};

@Component({
  selector: 'app-frontend',
  imports: [NgIcon, GraficoComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Rotas protegidas" [valor]="protegidas" apoio="com papel exigido em data.roles (Empresa ou Funcionário)" icone="lucideLock" />
      <app-kpi-card rotulo="Componentes standalone" [valor]="frontend.total.componentes" apoio="todos OnPush, com signals e novo control flow" icone="lucideLayoutGrid" />
      <app-kpi-card rotulo="Rotas" [valor]="frontend.rotas.length" [apoio]="telas + ' telas · ' + formularios + ' formulários · ' + publicas + ' públicas'" icone="lucideRoute" />
      <app-kpi-card rotulo="Specs" [valor]="frontend.total.specs" [apoio]="frontend.total.testes + ' testes (it) em ' + inteiro(frontend.total.locSpecs) + ' linhas'" icone="lucideFlaskConical" />
    </div>

    <app-secao titulo="Stack" descricao="Angular standalone com Spartan UI (equivalente Angular do shadcn/ui) e tokens Material 3; Bootstrap, bootstrap-icons e Angular Material foram removidos do software." id="stack">
      <ul class="grid gap-6 md:grid-cols-2">
        @for (s of stack; track s.titulo) {
          <li class="border-border bg-card flex gap-4 rounded-xl border p-6">
            <span class="bg-secondary text-secondary-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
              <ng-icon [name]="s.icone" class="text-lg" aria-hidden="true" />
            </span>
            <div>
              <p class="text-title-s text-foreground">{{ s.titulo }}</p>
              <p class="text-body-m text-muted-foreground">{{ s.texto }}</p>
            </div>
          </li>
        }
      </ul>
    </app-secao>

    <app-secao titulo="Rotas" descricao="Toda tela é carregada sob demanda (loadComponent). Uma rota protegida sem data.roles reprova no spec de rotas." id="rotas">
      <app-grafico titulo="Rotas por tipo e por quem acessa" subtitulo="Telas, formulários e páginas públicas" [configurar]="graficoRotas" [altura]="300" [tabela]="tabelaRotas" resumo="Barras empilhadas com a quantidade de rotas por papel (Empresa, Empresa e Funcionário, Público), divididas em telas, formulários e páginas públicas." />
      <app-tabela-dados [colunas]="colunasRotas" [linhas]="rotas" legenda="rotas do front-end" arquivo="rotas-frontend" [tamanhoInicial]="25" />
    </app-secao>

    <app-secao titulo="Blocos compartilhados" descricao="Toda tabela, formulário, gráfico e diálogo usa estes blocos; faltou um recurso, evolui-se o bloco em vez de criar uma tela ad hoc." id="blocos">
      <app-tabela-dados [colunas]="colunasBlocos" [linhas]="blocos" legenda="componentes compartilhados" arquivo="blocos-compartilhados" [tamanhoInicial]="10" />
      <app-nota tom="info" titulo="Padrões de código">
        Em src/app há <strong>zero</strong> ocorrências de <span class="code-inline">any</span>; <span class="code-inline">confirm()</span>, <span class="code-inline">alert()</span> e
        <span class="code-inline">console.log</span> são proibidos (existem o ConfirmacaoService e o NotificacaoService); o access token nunca vai ao
        <span class="code-inline">localStorage</span>, que guarda só tema, menu recolhido e preferências de tabela.
      </app-nota>
    </app-secao>

    <app-secao titulo="Sessão no navegador" id="sessao">
      <ol class="flex flex-col gap-4">
        @for (p of sessao; track p.titulo; let i = $index) {
          <li class="border-border bg-card flex gap-4 rounded-xl border p-5">
            <span class="bg-primary text-primary-foreground text-title-s tabular flex size-9 shrink-0 items-center justify-center rounded-full">{{ i + 1 }}</span>
            <div>
              <p class="text-title-s text-foreground">{{ p.titulo }}</p>
              <p class="text-body-m text-muted-foreground">{{ p.texto }}</p>
            </div>
          </li>
        }
      </ol>
    </app-secao>

    <app-secao titulo="Pacote e acessibilidade" id="pacote">
      <div class="grid gap-6 lg:grid-cols-2">
        <app-tabela-dados [colunas]="colunasPacote" [linhas]="pacote" legenda="tamanho do pacote do front-end" arquivo="pacote-frontend" [tamanhoInicial]="10" />
        <div class="border-border bg-card flex h-full flex-col gap-3 rounded-xl border p-6">
          <h3 class="text-title-m text-foreground">Acessibilidade já embutida</h3>
          <ul class="text-body-m text-muted-foreground list-disc pl-5">
            <li>lang="pt-BR", título por rota e link "Pular para o conteúdo"</li>
            <li>Foco visível global e prefers-reduced-motion respeitado</li>
            <li>aria-sort nas tabelas, aria-live nos avisos, caption nas tabelas</li>
            <li>Selo de status com ícone e texto; nunca só cor</li>
            <li>Lacuna conhecida: botões de 32 px abaixo dos 48 px adotados como alvo</li>
          </ul>
        </div>
      </div>
      <app-nota tom="info">Tamanhos do build de produção medidos em 14/out/2026. O pacote inicial cabe no orçamento de 900 kB; a análise por tela está na página Acessibilidade e desempenho.</app-nota>
    </app-secao>
  `
})
export class FrontendPage {
  protected readonly frontend = frontend;
  protected readonly inteiro = inteiro;

  protected readonly telas = frontend.rotas.filter((r) => r.tipo === 'Tela').length;
  protected readonly formularios = frontend.rotas.filter((r) => r.tipo === 'Formulário').length;
  protected readonly publicas = frontend.rotas.filter((r) => r.tipo === 'Pública').length;

  protected readonly stack = [
    { icone: 'lucideMonitor', titulo: 'Angular 21', texto: 'Componentes standalone, signals, @if/@for/@switch e ChangeDetectionStrategy.OnPush em todos os componentes.' },
    { icone: 'lucideLayoutGrid', titulo: 'Spartan UI + Tailwind v4', texto: 'Código "helm" copiado para o projeto e customizado (' + frontend.uiGerada.arquivos + ' arquivos, ' + inteiro(frontend.uiGerada.loc) + ' linhas geradas); estilo só com tokens.' },
    { icone: 'lucidePalette', titulo: 'Tokens Material 3', texto: 'O M3 é a fonte das cores, da tipografia, da forma e dos estados, mais que uma biblioteca de componentes. Roxo-base #6750A4, claro e escuro.' },
    { icone: 'lucideChartBar', titulo: 'ECharts e TanStack Table', texto: 'Gráficos com cores lidas dos tokens e a opção "Ver como tabela"; ngx-sonner para toasts e Lucide como único conjunto de ícones.' }
  ];

  protected readonly protegidas = frontend.rotas.filter((r) => r.papeis !== 'Público').length;

  private readonly papeisRota = ['Empresa', 'Empresa e Funcionário', 'Público'];
  private readonly tiposRota = ['Tela', 'Formulário', 'Pública'];
  private contar(papel: string, tipo: string): number {
    return frontend.rotas.filter((r) => r.papeis === papel && r.tipo === tipo).length;
  }
  protected readonly tabelaRotas = {
    colunas: ['Quem acessa', ...this.tiposRota],
    linhas: this.papeisRota.map((p) => [p, ...this.tiposRota.map((t) => this.contar(p, t))])
  };
  protected readonly graficoRotas = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.papeisRota),
      yAxis: eixoValor(t, { minInterval: 1 }),
      series: this.tiposRota.map((tipo, i) => ({
        name: tipo, type: 'bar', stack: 'rotas', emphasis: { focus: 'series' }, itemStyle: { color: t.series[i] },
        data: this.papeisRota.map((p) => this.contar(p, tipo))
      }))
    };
  };

  protected readonly rotas: Linha[] = frontend.rotas.map((r) => ({ caminho: r.caminho, titulo: r.titulo, tipo: r.tipo, papeis: r.papeis }));
  protected readonly colunasRotas: ColunaTabela[] = [
    { id: 'caminho', titulo: 'Caminho', tipo: 'codigo', larguraMin: '14rem' },
    { id: 'titulo', titulo: 'Título' },
    { id: 'tipo', titulo: 'Tipo', filtravel: true, secundaria: true },
    { id: 'papeis', titulo: 'Quem acessa', tipo: 'selo', filtravel: true, tom: (v) => (v === 'Empresa' ? 'error' : v === 'Público' ? 'warning' : 'success') }
  ];

  protected readonly blocos: Linha[] = frontend.compartilhados.map((c) => ({
    seletor: c.seletor, arquivo: c.arquivo, linhas: c.loc, funcao: DESCRICAO_BLOCOS[c.seletor] ?? '—'
  }));
  protected readonly colunasBlocos: ColunaTabela[] = [
    { id: 'seletor', titulo: 'Seletor', tipo: 'codigo' },
    { id: 'funcao', titulo: 'O que padroniza', larguraMin: '20rem' },
    { id: 'arquivo', titulo: 'Arquivo', secundaria: true },
    { id: 'linhas', titulo: 'Linhas', tipo: 'numero' }
  ];

  protected readonly sessao = [
    { titulo: 'Login devolve o par de tokens', texto: 'O access token (JWT de 15 minutos) fica só em memória no AuthService; o refresh token chega como cookie HttpOnly.' },
    { titulo: 'O interceptor anexa o Bearer', texto: 'Cada chamada a /api/… leva Authorization; o roleGuard confere o papel da rota e a sidebar, a Home e os botões leem as mesmas constantes de core/permissoes.ts.' },
    { titulo: 'Um 401 renova a sessão uma única vez', texto: 'Várias requisições que falham juntas compartilham uma chamada a /api/auth/rotacionar e repetem a original; só se a renovação falhar o usuário vai ao login.' },
    { titulo: 'Recarregar a página restaura a sessão', texto: 'O token em memória some; o cookie restaura a sessão por rotação, e o 2FA e a verificação facial seguem as mesmas telas.' }
  ];

  protected readonly pacote: Linha[] = [
    ...metricas.pacote!.map((p) => ({ item: p.parte, arquivos: p.arquivos, bruto: decimal(p.brutoKb, 1) + ' KiB', transferido: decimal(p.gzipKb, 1) + ' KiB' })),
    { item: 'Antes da migração de UI (Bootstrap e Material)', arquivos: '—', bruto: '≈ 1,7 MB', transferido: '—' },
    { item: 'Orçamento do angular.json (aviso / erro)', arquivos: '—', bruto: '900 kB / 1,5 MB', transferido: '—' }
  ];
  protected readonly colunasPacote: ColunaTabela[] = [
    { id: 'item', titulo: 'Item', larguraMin: '14rem' },
    { id: 'arquivos', titulo: 'Arquivos', tipo: 'numero', secundaria: true },
    { id: 'bruto', titulo: 'Bruto', tipo: 'numero' },
    { id: 'transferido', titulo: 'Gzip', tipo: 'numero' }
  ];
}
