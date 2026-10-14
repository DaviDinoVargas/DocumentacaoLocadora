import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface Conceito {
  termo: string;
  definicao: string;
  /** Como o conceito aparece neste sistema. */
  noSistema?: string;
}

/** Grade de conceitos (glossário): termo, definição curta e onde o sistema o usa. Todos os cartões têm a mesma altura. */
@Component({
  selector: 'app-conceitos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl class="grid gap-6 md:grid-cols-2">
      @for (c of itens(); track c.termo) {
        <div class="border-border bg-card flex h-full flex-col gap-2 rounded-xl border p-6">
          <dt class="text-title-m text-foreground">{{ c.termo }}</dt>
          <dd class="text-body-m text-muted-foreground">{{ c.definicao }}</dd>
          @if (c.noSistema) {
            <dd class="text-body-m text-foreground border-border mt-auto border-t pt-3">
              <span class="text-label-m text-primary mr-1">No sistema:</span>{{ c.noSistema }}
            </dd>
          }
        </div>
      }
    </dl>
  `
})
export class ConceitosComponent {
  readonly itens = input.required<readonly Conceito[]>();
}
