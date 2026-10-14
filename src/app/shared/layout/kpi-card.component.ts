import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/**
 * Cartão de KPI (SKILL §8.3): valor grande com algarismos tabulares e apoio. Sem link: na
 * documentação os números são lidos, não navegados.
 */
@Component({
  selector: 'app-kpi-card',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="border-border bg-card flex h-full flex-col gap-1 rounded-xl border p-5">
      <span class="text-label-l text-muted-foreground flex items-center gap-2">
        @if (icone()) {
          <ng-icon [name]="icone()" class="text-base" aria-hidden="true" />
        }
        {{ rotulo() }}
      </span>
      <strong class="text-headline-m text-foreground tabular">{{ valor() }}</strong>
      @if (apoio()) {
        <span class="text-body-s text-muted-foreground">{{ apoio() }}</span>
      }
    </div>
  `
})
export class KpiCardComponent {
  readonly rotulo = input.required<string>();
  readonly valor = input.required<string | number>();
  readonly apoio = input('');
  readonly icone = input('');
}
