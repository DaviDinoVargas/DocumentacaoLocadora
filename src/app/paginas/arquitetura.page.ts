import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Página em construção: o conteúdo entra em um próximo commit. */
@Component({
  selector: 'app-arquitetura',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1 class="text-headline-m">Arquitetura</h1>`
})
export class ArquiteturaPage {}
