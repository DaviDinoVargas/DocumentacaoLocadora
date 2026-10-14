import { Routes } from '@angular/router';
import { PAGINAS } from './core/paginas';

// Uma rota por página do registro (core/paginas.ts); todas carregadas sob demanda.
export const routes: Routes = [
  ...PAGINAS.map((p) => ({
    path: p.caminho,
    pathMatch: p.caminho === '' ? ('full' as const) : ('prefix' as const),
    title: `${p.titulo} · Documentação da Locadora`,
    loadComponent: p.carregar
  })),
  { path: '**', redirectTo: '' }
];
