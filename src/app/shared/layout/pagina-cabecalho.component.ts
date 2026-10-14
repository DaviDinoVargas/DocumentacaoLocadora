import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavegacaoService } from '../../core/navegacao.service';
import { TOTAL_PAGINAS } from '../../core/paginas';

/** Cabeçalho de página: faixa com o grupo/posição, título (Headline M) e apoio, como no PageHeader do software. */
@Component({
  selector: 'app-pagina-cabecalho',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex flex-col gap-2">
      <p class="text-label-m text-primary tabular tracking-wide uppercase">
        Página {{ pad(nav.indice()) }} de {{ pad(total) }} · {{ pagina().grupo }}
      </p>
      <h1 class="text-headline-m text-foreground">{{ pagina().titulo }}</h1>
      <p class="text-body-l text-muted-foreground prose-doc">{{ pagina().resumo }}</p>
      <div class="mt-1 flex flex-wrap items-center gap-2"><ng-content /></div>
    </header>
  `
})
export class PaginaCabecalhoComponent {
  protected readonly nav = inject(NavegacaoService);
  protected readonly pagina = computed(() => this.nav.pagina());
  protected readonly total = TOTAL_PAGINAS;

  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
