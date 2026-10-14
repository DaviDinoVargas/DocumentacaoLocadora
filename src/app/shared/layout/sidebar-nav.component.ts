import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavegacaoService } from '../../core/navegacao.service';
import { PAGINAS, type PaginaDoc } from '../../core/paginas';

interface Grupo {
  rotulo: string;
  itens: { pagina: PaginaDoc; indice: number }[];
}

/**
 * Lista de navegação (barra lateral do desktop e gaveta do mobile): um grupo por assunto, item ativo
 * destacado com a mesma "pílula" secundária do software documentado.
 */
@Component({
  selector: 'app-sidebar-nav',
  imports: [RouterLink, NgIcon, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Páginas da documentação" class="flex flex-col gap-4">
      @for (grupo of grupos; track grupo.rotulo) {
        <section class="flex flex-col gap-1">
          @if (!recolhido()) {
            <h2 class="text-label-s text-muted-foreground px-3 pt-1 tracking-wide uppercase">{{ grupo.rotulo }}</h2>
          } @else {
            <div class="bg-border mx-3 my-1 h-px" aria-hidden="true"></div>
          }
          <ul class="flex flex-col gap-0.5">
            @for (item of grupo.itens; track item.pagina.caminho) {
              <li>
                <a
                  [routerLink]="'/' + item.pagina.caminho"
                  class="text-label-l hover:bg-accent/60 flex min-h-11 items-center gap-3 rounded-full px-3 transition-colors"
                  [class.justify-center]="recolhido()"
                  [class.bg-secondary]="ativo(item.indice)"
                  [class.text-secondary-foreground]="ativo(item.indice)"
                  [class.text-muted-foreground]="!ativo(item.indice)"
                  [attr.aria-current]="ativo(item.indice) ? 'page' : null"
                  [attr.aria-label]="recolhido() ? item.pagina.titulo : null"
                  [matTooltip]="recolhido() ? item.pagina.titulo : ''"
                  matTooltipPosition="right"
                  (click)="navegou.emit()"
                >
                  <ng-icon [name]="item.pagina.icone" class="text-lg" aria-hidden="true" />
                  @if (!recolhido()) {
                    <span class="flex-1 truncate">{{ item.pagina.rotulo }}</span>
                    <span class="text-label-s tabular opacity-70">{{ pad(item.indice) }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </section>
      }
    </nav>
  `
})
export class SidebarNavComponent {
  /** Só ícones (trilho do tablet): sem rótulos. */
  readonly recolhido = input(false);
  readonly navegou = output<void>();

  private readonly nav = inject(NavegacaoService);
  protected readonly atual = computed(() => this.nav.indice());

  protected readonly grupos: Grupo[] = (() => {
    const mapa = new Map<string, Grupo>();
    PAGINAS.forEach((pagina, i) => {
      if (!mapa.has(pagina.grupo)) mapa.set(pagina.grupo, { rotulo: pagina.grupo, itens: [] });
      mapa.get(pagina.grupo)!.itens.push({ pagina, indice: i + 1 });
    });
    return [...mapa.values()];
  })();

  protected ativo(indice: number): boolean {
    return this.atual() === indice;
  }

  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
