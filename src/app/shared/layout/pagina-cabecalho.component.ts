import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavegacaoService } from '../../core/navegacao.service';

/** Cabeçalho de página: faixa com o grupo/posição, título (Headline M) e apoio, como no PageHeader do software. */
@Component({
  selector: 'app-pagina-cabecalho',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex flex-col gap-3">
      <h1 class="text-headline-m text-foreground">{{ pagina().titulo }}</h1>
      <p class="text-body-l text-muted-foreground prose-doc">{{ pagina().resumo }}</p>
      <div class="flex flex-wrap items-center gap-2 empty:hidden"><ng-content /></div>
    </header>
  `
})
export class PaginaCabecalhoComponent {
  protected readonly nav = inject(NavegacaoService);
  protected readonly pagina = computed(() => this.nav.pagina());
}
