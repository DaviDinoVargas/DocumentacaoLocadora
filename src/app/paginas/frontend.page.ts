import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import frontend from '../dados/frontend.json';
import { inteiro } from '../core/formato';
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

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Linhas de produção" [valor]="inteiro(frontend.total.loc)" [apoio]="frontend.total.arquivos + ' arquivos em src/app (sem os helm do Spartan)'" icone="lucideCode" />
      <app-kpi-card rotulo="Componentes standalone" [valor]="frontend.total.componentes" apoio="todos OnPush, com signals e novo control flow" icone="lucideLayoutGrid" />
      <app-kpi-card rotulo="Rotas" [valor]="frontend.rotas.length" [apoio]="telas + ' telas · ' + formularios + ' formulários · ' + publicas + ' públicas'" icone="lucideRoute" />
      <app-kpi-card rotulo="Specs" [valor]="frontend.total.specs" [apoio]="frontend.total.testes + ' testes (it) em ' + inteiro(frontend.total.locSpecs) + ' linhas'" icone="lucideFlaskConical" />
    </div>

    <app-secao titulo="Stack" descricao="Angular standalone com Spartan UI (equivalente Angular do shadcn/ui) e tokens Material 3; Bootstrap, bootstrap-icons e Angular Material foram removidos do software." id="stack">
      <ul class="grid gap-3 md:grid-cols-2">
        @for (s of stack; track s.titulo) {
          <li class="border-border bg-card flex gap-3 rounded-xl border p-4">
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

    <app-secao titulo="Onde está o código" descricao="Linhas de produção por pasta de src/app. As telas de negócio ficam em Components/; o que é reutilizado fica em shared/ e core/." id="codigo">
      <app-grafico titulo="Linhas por área" subtitulo="As 15 maiores pastas" [configurar]="graficoAreas" [altura]="460" [tabela]="tabelaAreas" resumo="Barras horizontais com as linhas de código de produção das 15 maiores áreas do front-end." />
      <app-tabela-dados [colunas]="colunasAreas" [linhas]="areas" legenda="áreas do front-end" arquivo="areas-frontend" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Rotas" descricao="Toda tela é carregada sob demanda (loadComponent). Uma rota protegida sem data.roles reprova no spec de rotas." id="rotas">
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
      <ol class="flex flex-col gap-3">
        @for (p of sessao; track p.titulo; let i = $index) {
          <li class="border-border bg-card flex gap-4 rounded-xl border p-4">
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
      <div class="grid gap-4 lg:grid-cols-2">
        <app-tabela-dados [colunas]="colunasPacote" [linhas]="pacote" legenda="tamanho do pacote do front-end" arquivo="pacote-frontend" [tamanhoInicial]="10" />
        <div class="border-border bg-card flex flex-col gap-2 rounded-xl border p-5">
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
      <app-nota tom="aviso">O tamanho do pacote vem da medição do material do TCC (12/out/2026); a documentação não reconstruiu o front-end para remedir.</app-nota>
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
    { icone: 'lucidePalette', titulo: 'Tokens Material 3', texto: 'O M3 é a fonte das cores, da tipografia, da forma e dos estados — não uma biblioteca de componentes. Roxo-base #6750A4, claro e escuro.' },
    { icone: 'lucideChartBar', titulo: 'ECharts e TanStack Table', texto: 'Gráficos com cores lidas dos tokens e a opção "Ver como tabela"; ngx-sonner para toasts e Lucide como único conjunto de ícones.' }
  ];

  private readonly maiores = [...frontend.areas].sort((a, b) => b.loc - a.loc).slice(0, 15);

  protected readonly areas: Linha[] = frontend.areas.map((a) => ({ area: a.area, arquivos: a.arquivos, linhas: a.loc, componentes: a.componentes, specs: a.specs, testes: a.testes }));
  protected readonly colunasAreas: ColunaTabela[] = [
    { id: 'area', titulo: 'Pasta', tipo: 'codigo' },
    { id: 'linhas', titulo: 'Linhas', tipo: 'numero' },
    { id: 'arquivos', titulo: 'Arquivos', tipo: 'numero', secundaria: true },
    { id: 'componentes', titulo: 'Componentes', tipo: 'numero', secundaria: true },
    { id: 'specs', titulo: 'Specs', tipo: 'numero', secundaria: true },
    { id: 'testes', titulo: 'Testes', tipo: 'numero' }
  ];

  protected readonly tabelaAreas = { colunas: ['Pasta', 'Linhas'], linhas: this.maiores.map((a) => [a.area, inteiro(a.loc)]) };
  protected readonly graficoAreas = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => inteiro(v) + ' linhas' },
    xAxis: eixoValor(t, { splitNumber: 4 }),
    yAxis: eixoCategoria(t, this.maiores.map((a) => a.area), { inverse: true, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11 } }),
    series: [{
      type: 'bar', barWidth: 16,
      data: this.maiores.map((a) => ({ value: a.loc, itemStyle: { color: a.area.startsWith('shared') ? t.series[2] : a.area.startsWith('Components') ? t.series[0] : t.series[1], borderRadius: [0, 6, 6, 0] } })),
      label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte, formatter: (p: { value: number }) => inteiro(p.value) }
    }]
  });

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
    { item: 'Pacote inicial (depois da migração de UI)', bruto: '≈ 785 kB', transferido: '≈ 188 kB' },
    { item: 'Pacote inicial (antes: Bootstrap + Material)', bruto: '≈ 1,7 MB', transferido: '—' },
    { item: 'Chunk do gráfico (ECharts, sob demanda)', bruto: '≈ 580 kB', transferido: '—' },
    { item: 'Orçamento do angular.json (aviso / erro)', bruto: '900 kB / 1,5 MB', transferido: '—' }
  ];
  protected readonly colunasPacote: ColunaTabela[] = [
    { id: 'item', titulo: 'Item', larguraMin: '14rem' },
    { id: 'bruto', titulo: 'Bruto', tipo: 'numero' },
    { id: 'transferido', titulo: 'Transferido', tipo: 'numero' }
  ];
}
