import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { map } from 'rxjs';
import { NavegacaoService } from './core/navegacao.service';
import { TemaService } from './core/tema.service';
import { CuboMagicoComponent } from './cubo/cubo-magico.component';
import { SidebarNavComponent } from './shared/layout/sidebar-nav.component';

/**
 * Casca da documentação (mesmo padrão do app documentado, SKILL §8.1): barra lateral fixa no desktop,
 * trilho de ícones no tablet e gaveta no mobile; barra superior com tema; conteúdo à esquerda e o
 * cubo mágico fixo no canto direito.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIcon, SidebarNavComponent, CuboMagicoComponent, HlmButtonImports, HlmSheetImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-background flex h-dvh overflow-hidden">
      <a
        href="#conteudo"
        class="bg-primary text-primary-foreground sr-only z-50 rounded-full px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>

      <!-- Barra lateral: tablet = trilho de ícones, desktop = completa -->
      <aside
        class="border-border bg-surface-low hidden shrink-0 flex-col border-r transition-[width] duration-200 md:flex"
        [class.w-[72px]]="!largo()"
        [class.w-[280px]]="largo()"
      >
        <div class="flex h-14 shrink-0 items-center gap-3 px-4" [class.justify-center]="!largo()">
          <span class="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full">
            <ng-icon name="lucideBookOpen" class="text-lg" aria-hidden="true" />
          </span>
          @if (largo()) {
            <span class="min-w-0">
              <span class="text-title-m text-foreground block truncate">Locadora de Veículos</span>
              <span class="text-label-s text-muted-foreground block truncate">Documentação técnica</span>
            </span>
          }
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <app-sidebar-nav [recolhido]="!largo()" />
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="border-border bg-background flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
          <button hlmBtn variant="ghost" size="icon" type="button" class="md:hidden" aria-label="Abrir menu" (click)="gaveta.set(true)">
            <ng-icon name="lucideMenu" aria-hidden="true" />
          </button>
          <div class="min-w-0 flex-1">
            <p class="text-title-m text-foreground truncate">{{ nav.pagina().titulo }}</p>
          </div>
          <a
            hlmBtn
            variant="ghost"
            size="icon"
            href="https://github.com/DaviDinoVargas/DocumentacaoLocadora"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Repositório da documentação (abre em nova aba)"
          >
            <ng-icon name="lucideGitBranch" aria-hidden="true" />
          </a>
          <button
            hlmBtn
            variant="ghost"
            size="icon"
            type="button"
            [attr.aria-label]="tema.tema() === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro'"
            (click)="tema.alternar()"
          >
            <ng-icon [name]="tema.tema() === 'escuro' ? 'lucideSun' : 'lucideMoon'" aria-hidden="true" />
          </button>
        </header>

        <main
          id="conteudo"
          tabindex="-1"
          class="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-24 outline-none sm:px-6 md:pb-10 lg:px-8 xl:pr-[300px] 2xl:pr-[372px]"
        >
          <div class="mx-auto flex w-full max-w-[1100px] flex-col gap-12"><router-outlet /></div>
        </main>
      </div>

      <!-- Gaveta do mobile (< 768 px) -->
      <hlm-sheet side="left" [state]="gaveta() ? 'open' : 'closed'" (stateChanged)="gaveta.set($event === 'open')">
        <hlm-sheet-content *hlmSheetPortal="let ctx" class="w-72! max-w-[85vw]! p-0">
          <div class="flex h-14 shrink-0 items-center gap-3 px-4">
            <span class="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full">
              <ng-icon name="lucideBookOpen" class="text-lg" aria-hidden="true" />
            </span>
            <span class="text-title-m">Locadora de Veículos</span>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            <app-sidebar-nav (navegou)="gaveta.set(false)" />
          </div>
        </hlm-sheet-content>
      </hlm-sheet>

      <app-cubo-magico />
    </div>
  `
})
export class App {
  protected readonly nav = inject(NavegacaoService);
  protected readonly tema = inject(TemaService);
  private readonly breakpoints = inject(BreakpointObserver);

  protected readonly gaveta = signal(false);

  // >= 1024 px: barra completa; 768–1023 px: trilho de ícones; < 768 px: gaveta.
  protected readonly largo = toSignal(this.breakpoints.observe('(min-width: 1024px)').pipe(map((r) => r.matches)), {
    initialValue: true
  });

  /** Alt + ← / → navegam entre páginas sem atrapalhar a rolagem horizontal de tabelas. */
  @HostListener('document:keydown', ['$event'])
  protected aoTeclar(evento: KeyboardEvent): void {
    if (!evento.altKey || evento.ctrlKey || evento.metaKey) return;
    if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      this.nav.proxima();
    } else if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      this.nav.anterior();
    }
  }
}
