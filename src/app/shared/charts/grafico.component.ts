import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { TemaService } from '../../core/tema.service';
import { echarts } from './echarts-setup';
import { lerTemaGrafico, type TemaGrafico } from './tema-grafico';

export interface TabelaAlternativa {
  colunas: string[];
  linhas: (string | number)[][];
}

/**
 * Gráfico ECharts (a biblioteca única de gráficos do sistema, SKILL §19): cores lidas dos
 * tokens, reação ao tema claro/escuro, resumo acessível e a opção "Ver como tabela" em todo gráfico.
 */
@Component({
  selector: 'app-grafico',
  imports: [NgxEchartsDirective, NgIcon, HlmButtonImports, HlmTableImports],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="border-border bg-card flex h-full flex-col gap-4 rounded-xl border p-5 sm:p-6">
      <figcaption class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-48 flex-1">
          <h3 class="text-title-m text-foreground">{{ titulo() }}</h3>
          @if (subtitulo()) {
            <p class="text-body-s text-muted-foreground">{{ subtitulo() }}</p>
          }
        </div>
        @if (tabela()) {
          <button
            hlmBtn
            variant="ghost"
            size="sm"
            type="button"
            [attr.aria-pressed]="comoTabela()"
            (click)="comoTabela.set(!comoTabela())"
          >
            <ng-icon [name]="comoTabela() ? 'lucideChartBar' : 'lucideTable'" aria-hidden="true" />
            {{ comoTabela() ? 'Ver gráfico' : 'Ver como tabela' }}
          </button>
        }
      </figcaption>

      @if (comoTabela() && tabela(); as t) {
        <div hlmTableContainer class="max-h-[420px] overflow-y-auto">
          <table hlmTable>
            <caption hlmCaption class="sr-only">{{ titulo() }}</caption>
            <thead hlmTHead>
              <tr hlmTr>
                @for (c of t.colunas; track c; let i = $index) {
                  <th hlmTh scope="col" [class.text-right]="i > 0">{{ c }}</th>
                }
              </tr>
            </thead>
            <tbody hlmTBody>
              @for (linha of t.linhas; track $index) {
                <tr hlmTr>
                  @for (celula of linha; track $index; let i = $index) {
                    <td hlmTd [class.text-right]="i > 0" [class.tabular]="i > 0">{{ celula }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div
          echarts
          [options]="opcoes()"
          [style.min-height.px]="altura()"
          class="w-full flex-1"
          role="img"
          [attr.aria-label]="resumo() || titulo()"
        ></div>
      }
    </figure>
  `
})
export class GraficoComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
  /** Texto lido por leitores de tela no lugar do desenho. */
  readonly resumo = input('');
  readonly altura = input(300);
  /** Monta a configuração a partir das cores do tema atual. */
  readonly configurar = input.required<(tema: TemaGrafico) => EChartsCoreOption>();
  readonly tabela = input<TabelaAlternativa | null>(null);

  private readonly tema = inject(TemaService);
  protected readonly comoTabela = signal(false);

  protected readonly opcoes = computed<EChartsCoreOption>(() => {
    this.tema.tema(); // recalcula ao trocar claro/escuro (a classe .dark já foi aplicada)
    return this.configurar()(lerTemaGrafico());
  });
}
