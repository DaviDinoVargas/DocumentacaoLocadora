import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Seção da página: título (Title L), apoio opcional e conteúdo projetado. Âncora por `id`. */
@Component({
  selector: 'app-secao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [attr.id]="id() || null" class="flex flex-col gap-6 scroll-mt-6" [attr.aria-labelledby]="id() ? id() + '-titulo' : null">
      <div class="flex flex-col gap-2">
        <h2 [attr.id]="id() ? id() + '-titulo' : null" class="text-title-l text-foreground">{{ titulo() }}</h2>
        @if (descricao()) {
          <p class="text-body-m text-muted-foreground prose-doc">{{ descricao() }}</p>
        }
      </div>
      <ng-content />
    </section>
  `
})
export class SecaoComponent {
  readonly titulo = input.required<string>();
  readonly descricao = input('');
  readonly id = input('');
}
