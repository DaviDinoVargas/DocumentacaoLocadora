import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { movimentoReduzido } from '../core/movimento';
import { NavegacaoService } from '../core/navegacao.service';
import { PAGINAS, TOTAL_PAGINAS, TOTAL_PECAS } from '../core/paginas';
import { TemaService } from '../core/tema.service';
import { ControladorCubo, estadoAlvo } from './plano-cubo';
import type { CenaCubo } from './cena-cubo';

/**
 * Cubo mágico fixo no canto direito: um progresso 3D da leitura. Cada página adiante devolve uma das
 * P = N − 2 peças ao cubo; a penúltima fecha o cubo e a última o resolve. As setas ficam logo abaixo.
 *
 * O Three.js é carregado sob demanda (chunk separado) e só enquanto a tela comporta o cubo (≥ 768 px);
 * abaixo disso ficam só as setas. A cena libera todos os recursos do WebGL ao ser destruída.
 */
@Component({
  selector: 'app-cubo-magico',
  imports: [NgIcon, MatTooltipModule, HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pointer-events-none fixed right-3 bottom-3 z-30 flex flex-col items-center gap-2 sm:right-4 sm:bottom-4' },
  template: `
    <p class="sr-only" aria-live="polite">
      Página {{ nav.indice() }} de {{ total }}. Cubo com {{ montadas() }} de {{ pecas }} peças montadas{{ resolvido() ? ', resolvido' : '' }}.
    </p>

    <div
      #palco
      aria-hidden="true"
      class="h-[170px] w-[150px] max-md:hidden lg:h-[230px] lg:w-[200px] xl:h-[300px] xl:w-[260px] 2xl:h-[370px] 2xl:w-[320px]"
    ></div>

    <nav
      aria-label="Navegar entre páginas"
      class="border-border bg-popover/90 text-popover-foreground pointer-events-auto flex items-center gap-1 rounded-full border p-1 shadow-md backdrop-blur"
    >
      <button
        hlmBtn
        variant="ghost"
        size="icon"
        type="button"
        [disabled]="!nav.temAnterior()"
        [attr.aria-label]="'Página anterior: ' + tituloAnterior()"
        [matTooltip]="tituloAnterior()"
        (click)="nav.anterior()"
      >
        <ng-icon name="lucideArrowLeft" aria-hidden="true" />
      </button>
      <div class="min-w-[92px] px-1 text-center">
        <span class="text-label-l tabular block">{{ pad(nav.indice()) }} / {{ pad(total) }}</span>
        <span class="text-label-s text-muted-foreground tabular block">
          @if (resolvido()) { cubo resolvido } @else { {{ montadas() }} de {{ pecas }} peças }
        </span>
      </div>
      <button
        hlmBtn
        variant="default"
        size="icon"
        type="button"
        [disabled]="!nav.temProxima()"
        [attr.aria-label]="'Próxima página: ' + tituloProxima()"
        [matTooltip]="tituloProxima()"
        (click)="nav.proxima()"
      >
        <ng-icon name="lucideArrowRight" aria-hidden="true" />
      </button>
    </nav>
  `
})
export class CuboMagicoComponent {
  protected readonly nav = inject(NavegacaoService);
  private readonly tema = inject(TemaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly palco = viewChild.required<ElementRef<HTMLElement>>('palco');

  protected readonly total = TOTAL_PAGINAS;
  protected readonly pecas = TOTAL_PECAS;
  protected readonly montadas = computed(() => estadoAlvo(this.nav.indice(), TOTAL_PAGINAS).montadas);
  protected readonly resolvido = computed(() => estadoAlvo(this.nav.indice(), TOTAL_PAGINAS).resolvido);
  protected readonly tituloAnterior = computed(() => PAGINAS[Math.max(this.nav.indice() - 2, 0)].titulo);
  protected readonly tituloProxima = computed(() => PAGINAS[Math.min(this.nav.indice(), TOTAL_PAGINAS - 1)].titulo);

  private cena: CenaCubo | null = null;
  private controlador: ControladorCubo | null = null;
  private criando = false;
  private destruido = false;
  private readonly pronto = signal(false);

  constructor() {
    // Cubo só onde há espaço (≥ 768 px): cria/destrói a cena conforme a largura muda.
    afterNextRender(() => {
      const consulta = matchMedia('(min-width: 768px)');
      const aoMudar = () => (consulta.matches ? void this.criarCena() : this.destruirCena());
      consulta.addEventListener('change', aoMudar);
      aoMudar();
      this.destroyRef.onDestroy(() => {
        consulta.removeEventListener('change', aoMudar);
        this.destruido = true;
        this.destruirCena();
      });
    });

    // Navegação → máquina de estados (fila de animações).
    effect(() => {
      const indice = this.nav.indice();
      if (this.pronto()) this.controlador?.irPara(indice);
    });

    // Troca de tema → cores das faces relidas dos tokens.
    effect(() => {
      this.tema.tema();
      if (this.pronto()) queueMicrotask(() => this.cena?.atualizarCores());
    });
  }

  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  private async criarCena(): Promise<void> {
    if (this.cena || this.criando || this.destruido) return;
    this.criando = true;
    try {
      const { CenaCubo: Cena } = await import('./cena-cubo');
      if (this.destruido || !matchMedia('(min-width: 768px)').matches) return;
      const cena = new Cena(this.palco().nativeElement, TOTAL_PECAS, movimentoReduzido);
      this.cena = cena;
      this.controlador = new ControladorCubo(cena, TOTAL_PAGINAS, this.nav.indice(), movimentoReduzido);
      this.pronto.set(true);
    } catch {
      // sem WebGL (ou contexto negado): a documentação segue funcionando sem o cubo
      this.cena = null;
      this.controlador = null;
    } finally {
      this.criando = false;
    }
  }

  private destruirCena(): void {
    this.pronto.set(false);
    this.controlador?.destruir();
    this.controlador = null;
    this.cena?.destruir();
    this.cena = null;
  }
}
