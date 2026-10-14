import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';

/** Bloco de código com rótulo da linguagem e botão de copiar (o rótulo é lido; o texto é selecionável). */
@Component({
  selector: 'app-codigo',
  imports: [NgIcon, HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="border-border bg-surface-container overflow-hidden rounded-xl border">
      <figcaption class="border-border text-label-m text-muted-foreground flex items-center justify-between border-b px-4 py-1.5">
        <span>{{ rotulo() }}</span>
        <button hlmBtn variant="ghost" size="sm" type="button" (click)="copiar()" [attr.aria-label]="'Copiar ' + rotulo()">
          <ng-icon [name]="copiado() ? 'lucideCheck' : 'lucideCopy'" aria-hidden="true" />
          {{ copiado() ? 'Copiado' : 'Copiar' }}
        </button>
      </figcaption>
      <pre class="text-body-m text-foreground overflow-x-auto p-4"><code class="font-mono text-[0.8125rem] leading-6">{{ texto() }}</code></pre>
    </figure>
  `
})
export class CodigoComponent {
  readonly texto = input.required<string>();
  readonly rotulo = input('bash');
  protected readonly copiado = signal(false);

  protected async copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.texto());
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    } catch {
      // área de transferência indisponível: o texto continua selecionável
    }
  }
}
