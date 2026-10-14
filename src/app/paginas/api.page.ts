import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Página em construção: o conteúdo entra em um próximo commit. */
@Component({
  selector: 'app-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1 class="text-headline-m">Api</h1>`
})
export class ApiPage {}
