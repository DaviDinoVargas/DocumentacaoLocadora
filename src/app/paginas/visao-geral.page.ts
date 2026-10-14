import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Página em construção: o conteúdo entra em um próximo commit. */
@Component({
  selector: 'app-visao-geral',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1 class="text-headline-m">VisaoGeral</h1>`
})
export class VisaoGeralPage {}
