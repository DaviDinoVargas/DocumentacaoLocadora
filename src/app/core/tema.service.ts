import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type Tema = 'claro' | 'escuro';

const CHAVE = 'tema';

/**
 * Tema claro/escuro (classe `.dark` no <html>, como o Spartan/Tailwind esperam) — o mesmo mecanismo
 * e a mesma chave de armazenamento do software documentado. Na primeira visita segue o sistema; o
 * script do index.html aplica a classe antes da primeira pintura.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly doc = inject(DOCUMENT);

  readonly tema = signal<Tema>(this.doc.documentElement.classList.contains('dark') ? 'escuro' : 'claro');

  constructor() {
    effect(() => {
      this.doc.documentElement.classList.toggle('dark', this.tema() === 'escuro');
    });
  }

  alternar(): void {
    const novo: Tema = this.tema() === 'escuro' ? 'claro' : 'escuro';
    // aplica a classe já, antes dos sinais derivados: gráficos e cubo leem as cores dos tokens ao reagir ao tema
    this.doc.documentElement.classList.toggle('dark', novo === 'escuro');
    this.tema.set(novo);
    try {
      localStorage.setItem(CHAVE, novo);
    } catch {
      // armazenamento indisponível (janela privada): o tema vale só nesta visita
    }
  }
}
