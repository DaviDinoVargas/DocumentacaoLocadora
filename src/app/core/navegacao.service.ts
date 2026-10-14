import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { PAGINAS, TOTAL_PAGINAS, indiceDoCaminho } from './paginas';

/** Página atual (1..N) e navegação sequencial; o cubo e as setas leem o mesmo sinal. */
@Injectable({ providedIn: 'root' })
export class NavegacaoService {
  private readonly router = inject(Router);

  readonly indice = signal(indiceDoCaminho(this.router.url));
  readonly pagina = computed(() => PAGINAS[this.indice() - 1]);
  readonly temAnterior = computed(() => this.indice() > 1);
  readonly temProxima = computed(() => this.indice() < TOTAL_PAGINAS);

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.indice.set(indiceDoCaminho(e.urlAfterRedirects));
    });
  }

  irPara(indice: number): void {
    const alvo = PAGINAS[Math.min(Math.max(indice, 1), TOTAL_PAGINAS) - 1];
    void this.router.navigateByUrl('/' + alvo.caminho);
  }

  anterior(): void {
    if (this.temAnterior()) this.irPara(this.indice() - 1);
  }

  proxima(): void {
    if (this.temProxima()) this.irPara(this.indice() + 1);
  }
}
