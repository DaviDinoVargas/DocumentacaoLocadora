import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Página em construção: o conteúdo entra em um próximo commit. */
@Component({
  selector: 'app-testes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1 class="text-headline-m">Testes</h1>`
})
export class TestesPage {}
