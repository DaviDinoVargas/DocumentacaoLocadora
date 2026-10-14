import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgIcon } from '@ng-icons/core';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import tokens from '../dados/tokens.json';
import { decimal } from '../core/formato';
import { TemaService } from '../core/tema.service';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { StatusBadgeComponent } from '../shared/layout/status-badge.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

function luminancia(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const PARES: [string, string, string][] = [
  ['Primária', '--md-primary', '--md-on-primary'],
  ['Contêiner primário', '--md-primary-container', '--md-on-primary-container'],
  ['Contêiner secundário', '--md-secondary-container', '--md-on-secondary-container'],
  ['Contêiner terciário', '--md-tertiary-container', '--md-on-tertiary-container'],
  ['Erro', '--md-error', '--md-on-error'],
  ['Contêiner de erro', '--md-error-container', '--md-on-error-container'],
  ['Texto sobre superfície', '--md-surface', '--md-on-surface'],
  ['Texto secundário', '--md-surface', '--md-on-surface-variant'],
  ['Sucesso', '--success', '--on-success'],
  ['Aviso', '--warning', '--on-warning']
];

@Component({
  selector: 'app-design-system',
  imports: [MatButtonToggleModule, NgIcon, HlmBadgeImports, HlmButtonImports, GraficoComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, StatusBadgeComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho>
      <span hlmBadge variant="secondary">Fonte: {{ tokens.arquivo }}</span>
      <span hlmBadge variant="outline">{{ tokens.cores.length }} tokens de cor</span>
      <span hlmBadge variant="outline">{{ tokens.fonte }}</span>
    </app-pagina-cabecalho>

    <app-nota tom="info" titulo="Esta documentação usa o mesmo tema">
      As cores, a tipografia, as formas e o alternador claro/escuro desta página são os mesmos do software: os tokens abaixo foram lidos do
      <span class="code-inline">styles.css</span> original e alimentam as variáveis do Spartan e do Material 3 (<span class="code-inline">--mat-sys-*</span>) daqui.
      Alterne o tema pela barra superior para ver os dois conjuntos.
    </app-nota>

    <app-secao titulo="Paleta Material 3" descricao="Papéis de cor do roxo-base #6750A4. A faixa mostra o valor vivo no tema atual; a tabela traz os dois conjuntos." id="paleta">
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        @for (c of vitrine; track c.token) {
          <div class="border-border overflow-hidden rounded-xl border">
            <div class="h-14" [style.background]="'var(' + c.token + ')'"></div>
            <div class="bg-card p-2.5">
              <p class="text-label-m text-foreground code-inline w-fit">{{ c.token }}</p>
              <p class="text-body-s text-muted-foreground tabular mt-1">{{ c.claro }} · {{ c.escuro }}</p>
            </div>
          </div>
        }
      </div>
      <app-tabela-dados [colunas]="colunasCores" [linhas]="cores" legenda="tokens de cor claro e escuro" arquivo="tokens-de-cor" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Contraste (WCAG AA)" descricao="Razão entre o texto e o fundo de cada par de papéis, calculada a partir dos valores reais. O mínimo para texto normal é 4,5:1." id="contraste">
      <app-grafico titulo="Contraste por par de papéis" subtitulo="Claro e escuro; a linha tracejada marca 4,5:1" [configurar]="graficoContraste" [altura]="380" [tabela]="tabelaContraste" resumo="Barras agrupadas com a razão de contraste de dez pares de cores nos temas claro e escuro, todas acima da linha de 4,5 para 1." />
    </app-secao>

    <app-secao titulo="Do M3 para o Spartan" descricao="Contrato de tradução: as variáveis semânticas do shadcn/Spartan apontam para os papéis do Material 3. Nenhum componente usa hexadecimal." id="mapeamento">
      <app-tabela-dados [colunas]="colunasMapa" [linhas]="mapa" legenda="mapeamento das variáveis shadcn para papéis M3" arquivo="mapeamento-tokens" [tamanhoInicial]="25" />
    </app-secao>

    <app-secao titulo="Tipografia" descricao="Uma única família (Inter variável) na escala do M3; números com algarismos tabulares." id="tipografia">
      <div class="border-border bg-card divide-border divide-y rounded-xl border">
        @for (t of tokens.tipografia; track t.classe) {
          <div class="flex flex-wrap items-baseline gap-x-6 gap-y-1 p-4">
            <span class="text-label-m text-muted-foreground tabular w-44 shrink-0">{{ t.classe }} · {{ t.tamanho }}/{{ t.linha }} · {{ t.peso }}</span>
            <span [class]="t.classe" class="text-foreground">Locadora de Veículos — 1.234,56</span>
          </div>
        }
      </div>
      <app-grafico titulo="Escala tipográfica" subtitulo="Tamanho e altura de linha (px) por papel" [configurar]="graficoTipografia" [altura]="320" [tabela]="tabelaTipografia" resumo="Barras agrupadas com o tamanho da fonte e a altura de linha em pixels de cada papel tipográfico, de headline L a label S." />
    </app-secao>

    <app-secao titulo="Forma, elevação e movimento" id="forma">
      <div class="grid gap-4 md:grid-cols-3">
        <div class="border-border bg-card flex flex-col gap-3 rounded-xl border p-5">
          <h3 class="text-title-m text-foreground">Raio de borda</h3>
          <p class="text-body-s text-muted-foreground">Base --radius: {{ tokens.raio }} (12 px).</p>
          <div class="flex flex-wrap gap-2">
            <span class="bg-primary text-primary-foreground text-label-m rounded-full px-4 py-2">Botão · pílula</span>
            <span class="bg-muted text-foreground text-label-m rounded-lg px-4 py-2">Campo · lg</span>
            <span class="bg-surface-high text-foreground text-label-m rounded-xl px-4 py-2">Cartão · xl</span>
            <span class="bg-surface-high text-foreground text-label-m rounded-[28px] px-4 py-2">Diálogo · 28</span>
          </div>
        </div>
        <div class="border-border bg-card flex flex-col gap-3 rounded-xl border p-5">
          <h3 class="text-title-m text-foreground">Elevação tonal</h3>
          <p class="text-body-s text-muted-foreground">O M3 muda a cor da superfície em vez de pesar a sombra.</p>
          <div class="flex flex-col gap-1.5">
            @for (n of niveis; track n.nome) {
              <span class="text-label-m flex items-center justify-between rounded-lg px-3 py-2" [class]="n.classe">{{ n.nome }} <span class="opacity-70">{{ n.uso }}</span></span>
            }
          </div>
        </div>
        <div class="border-border bg-card flex flex-col gap-3 rounded-xl border p-5">
          <h3 class="text-title-m text-foreground">Movimento</h3>
          <p class="text-body-s text-muted-foreground">Só transform e opacity; prefers-reduced-motion desliga tudo.</p>
          <ul class="text-body-s text-foreground flex flex-col gap-1.5">
            @for (m of tokens.movimento; track m.token) {
              <li><span class="code-inline">{{ m.token }}</span> <span class="text-muted-foreground tabular">{{ m.curva }}</span></li>
            }
            <li class="text-muted-foreground">Micro-interações 100–200 ms · menus 150–250 ms · diálogos 250–400 ms</li>
          </ul>
        </div>
      </div>
    </app-secao>

    <app-secao titulo="Vitrine de componentes" descricao="Os mesmos blocos que as páginas usam, no tema atual." id="vitrine">
      <div class="border-border bg-card flex flex-col gap-5 rounded-xl border p-5">
        <div class="flex flex-wrap items-center gap-2">
          <button hlmBtn type="button">Preenchido</button>
          <button hlmBtn variant="secondary" type="button">Tonal</button>
          <button hlmBtn variant="outline" type="button">Contornado</button>
          <button hlmBtn variant="ghost" type="button">Texto</button>
          <button hlmBtn variant="destructive" type="button">Destrutivo</button>
          <button hlmBtn variant="link" type="button">Link</button>
          <button hlmBtn size="icon" type="button" aria-label="Exemplo com ícone"><ng-icon name="lucideSparkles" aria-hidden="true" /></button>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <app-status-badge texto="Concluído" tom="success" />
          <app-status-badge texto="Em andamento" tom="info" />
          <app-status-badge texto="Atrasado" tom="warning" />
          <app-status-badge texto="Cancelado" tom="error" />
          <app-status-badge texto="Reservado" tom="neutral" />
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-label-l text-muted-foreground">Densidade (Material 3):</span>
          <mat-button-toggle-group [value]="densidade" aria-label="Densidade de exemplo" hideSingleSelectionIndicator>
            <mat-button-toggle value="compacta">Compacta</mat-button-toggle>
            <mat-button-toggle value="padrao">Padrão</mat-button-toggle>
            <mat-button-toggle value="confortavel">Confortável</mat-button-toggle>
          </mat-button-toggle-group>
          <span class="text-body-s text-muted-foreground">tema atual: {{ tema.tema() }}</span>
        </div>
      </div>
    </app-secao>
  `
})
export class DesignSystemPage {
  protected readonly tokens = tokens;
  protected readonly tema = inject(TemaService);
  protected readonly densidade = 'padrao';

  protected readonly vitrine = tokens.cores.filter((c) => /^--(md-(primary|secondary|tertiary|error)(-container)?|md-surface(-container(-low|-high|-highest)?)?|md-outline(-variant)?|success|warning)$/.test(c.token));

  protected readonly cores: Linha[] = tokens.cores.map((c) => ({ token: c.token, claro: c.claro, escuro: c.escuro }));
  protected readonly colunasCores: ColunaTabela[] = [
    { id: 'token', titulo: 'Token', tipo: 'codigo' },
    { id: 'claro', titulo: 'Claro', tipo: 'codigo' },
    { id: 'escuro', titulo: 'Escuro', tipo: 'codigo' }
  ];

  protected readonly mapa: Linha[] = [...tokens.semanticas.map((s) => ({ variavel: s.variavel, papel: s.papel, grupo: 'Semântica' })), ...tokens.grafico.map((s) => ({ variavel: s.token, papel: s.valor, grupo: 'Gráfico' }))];
  protected readonly colunasMapa: ColunaTabela[] = [
    { id: 'variavel', titulo: 'Variável Spartan/shadcn', tipo: 'codigo' },
    { id: 'papel', titulo: 'Papel Material 3', tipo: 'codigo' },
    { id: 'grupo', titulo: 'Grupo', filtravel: true }
  ];

  protected readonly niveis = [
    { nome: 'Nível 0', uso: 'página e cartões em repouso', classe: 'bg-background text-foreground border border-border' },
    { nome: 'Nível 1', uso: 'cartão em destaque', classe: 'bg-surface-container text-foreground' },
    { nome: 'Nível 2', uso: 'menus e popovers', classe: 'bg-popover text-popover-foreground shadow-md' },
    { nome: 'Nível 3', uso: 'diálogos e folhas', classe: 'bg-surface-high text-foreground shadow-lg' }
  ];

  private readonly razoes = PARES.map(([nome, fundo, texto]) => {
    const f = tokens.cores.find((c) => c.token === fundo)!;
    const t = tokens.cores.find((c) => c.token === texto)!;
    return { nome, claro: contraste(f.claro, t.claro), escuro: contraste(f.escuro, t.escuro) };
  });

  protected readonly tabelaContraste = {
    colunas: ['Par', 'Claro', 'Escuro'],
    linhas: this.razoes.map((r) => [r.nome, decimal(r.claro, 1) + ':1', decimal(r.escuro, 1) + ':1'])
  };

  protected readonly graficoContraste = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => decimal(v, 1) + ':1' },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.razoes.map((r) => r.nome), { axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11, interval: 0, rotate: 30 } }),
      yAxis: eixoValor(t, { name: 'razão', nameTextStyle: { color: t.textoSecundario } }),
      series: [
        { name: 'Claro', type: 'bar', data: this.razoes.map((r) => Number(r.claro.toFixed(2))), itemStyle: { color: t.series[0], borderRadius: [4, 4, 0, 0] }, markLine: { symbol: 'none', silent: true, lineStyle: { color: t.erro, type: 'dashed' }, label: { color: t.erro, formatter: 'AA 4,5:1' }, data: [{ yAxis: 4.5 }] } },
        { name: 'Escuro', type: 'bar', data: this.razoes.map((r) => Number(r.escuro.toFixed(2))), itemStyle: { color: t.series[3], borderRadius: [4, 4, 0, 0] } }
      ]
    };
  };

  protected readonly tabelaTipografia = {
    colunas: ['Papel', 'Tamanho (px)', 'Linha (px)', 'Peso'],
    linhas: tokens.tipografia.map((t) => [t.classe.replace('text-', ''), t.tamanho, t.linha, t.peso])
  };

  protected readonly graficoTipografia = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    const nomes = tokens.tipografia.map((x) => x.classe.replace('text-', ''));
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, nomes, { axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11, interval: 0, rotate: 30 } }),
      yAxis: eixoValor(t, { name: 'px', nameTextStyle: { color: t.textoSecundario } }),
      series: [
        { name: 'Tamanho', type: 'bar', data: tokens.tipografia.map((x) => x.tamanho), itemStyle: { color: t.series[0], borderRadius: [4, 4, 0, 0] } },
        { name: 'Altura de linha', type: 'line', data: tokens.tipografia.map((x) => x.linha), symbol: 'diamond', symbolSize: 8, lineStyle: { color: t.series[1], width: 2 }, itemStyle: { color: t.series[1] } }
      ]
    };
  };
}
