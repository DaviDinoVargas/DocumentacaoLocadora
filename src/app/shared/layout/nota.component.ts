import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

export type TomNota = 'info' | 'aviso' | 'sucesso' | 'erro';

const ESTILO: Record<TomNota, { caixa: string; icone: string }> = {
  info: { caixa: 'bg-primary-container text-on-primary-container', icone: 'lucideInfo' },
  aviso: { caixa: 'bg-warning-container text-on-warning-container', icone: 'lucideTriangleAlert' },
  sucesso: { caixa: 'bg-success-container text-on-success-container', icone: 'lucideCircleCheck' },
  erro: { caixa: 'bg-error-container text-on-error-container', icone: 'lucideCircleAlert' }
};

/** Alerta em linha (SKILL §8.8): ícone + texto, nunca só cor. */
@Component({
  selector: 'app-nota',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="flex gap-3 rounded-xl p-5" [class]="estilo().caixa" role="note">
      <ng-icon [name]="estilo().icone" class="mt-0.5 shrink-0 text-lg" aria-hidden="true" />
      <div class="text-body-m min-w-0 flex-1">
        @if (titulo()) {
          <p class="text-title-s mb-0.5">{{ titulo() }}</p>
        }
        <ng-content />
      </div>
    </aside>
  `
})
export class NotaComponent {
  readonly tom = input<TomNota>('info');
  readonly titulo = input('');
  protected readonly estilo = computed(() => ESTILO[this.tom()]);
}
