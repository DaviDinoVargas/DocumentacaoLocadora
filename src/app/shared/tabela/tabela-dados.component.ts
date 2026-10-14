import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { StatusBadgeComponent, type TomStatus } from '../layout/status-badge.component';

export type Celula = string | number | boolean | null | undefined;
export type Linha = Record<string, Celula>;

export interface ColunaTabela {
  id: string;
  titulo: string;
  tipo?: 'texto' | 'numero' | 'codigo' | 'selo';
  /** Mostra chips de filtro (com contagem) para os valores distintos da coluna. */
  filtravel?: boolean;
  /** Para `selo`: tom por valor (padrão neutro). */
  tom?: (valor: Celula, linha: Linha) => TomStatus;
  /** Esconde em telas pequenas (a coluna continua na exportação). */
  secundaria?: boolean;
  larguraMin?: string;
}

type Direcao = 'asc' | 'desc';

/**
 * Tabela de dados no padrão do `app-data-table` do software (SKILL §16): busca global, filtros por
 * coluna com contagem, filtros ativos em chips removíveis, ordenação por cabeçalho (aria-sort),
 * paginação com contador e exportação CSV do conjunto filtrado. Dados vêm dos JSON extraídos do código.
 */
@Component({
  selector: 'app-tabela-dados',
  imports: [NgIcon, HlmButtonImports, HlmInputImports, HlmTableImports, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="border-border bg-card flex h-full flex-col gap-4 rounded-xl border p-4 sm:p-5">
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative min-w-52 flex-1 sm:max-w-sm">
          <ng-icon name="lucideSearch" class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" aria-hidden="true" />
          <input
            hlmInput
            type="search"
            class="w-full rounded-full pl-9"
            [value]="busca()"
            (input)="definirBusca($any($event.target).value)"
            [attr.aria-label]="'Buscar em ' + legenda()"
            placeholder="Buscar…"
          />
        </div>
        <span class="text-body-s text-muted-foreground tabular" aria-live="polite">{{ contador() }}</span>
        <div class="ml-auto flex items-center gap-1">
          <button hlmBtn variant="ghost" size="sm" type="button" (click)="exportar()" [disabled]="filtradas().length === 0">
            <ng-icon name="lucideDownload" aria-hidden="true" /> CSV
          </button>
        </div>
      </div>

      @if (colunasFiltraveis().length > 0) {
        <div class="flex flex-col gap-2">
          @for (col of colunasFiltraveis(); track col.id) {
            <div class="flex flex-wrap items-center gap-1.5" role="group" [attr.aria-label]="'Filtrar por ' + col.titulo">
              <span class="text-label-m text-muted-foreground mr-1 w-24 shrink-0">{{ col.titulo }}</span>
              @for (op of opcoes()[col.id]; track op.valor) {
                <button
                  type="button"
                  class="text-label-m border-border hover:bg-accent/60 inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 transition-colors"
                  [class.bg-secondary]="ativo(col.id, op.valor)"
                  [class.text-secondary-foreground]="ativo(col.id, op.valor)"
                  [attr.aria-pressed]="ativo(col.id, op.valor)"
                  (click)="alternarFiltro(col.id, op.valor)"
                >
                  @if (ativo(col.id, op.valor)) {
                    <ng-icon name="lucideCircleCheck" class="text-sm" aria-hidden="true" />
                  }
                  {{ op.valor }}
                  <span class="tabular opacity-70">{{ op.total }}</span>
                </button>
              }
            </div>
          }
        </div>
      }

      @if (chipsAtivos().length > 0) {
        <div class="flex flex-wrap items-center gap-1.5">
          @for (chip of chipsAtivos(); track chip.chave) {
            <button
              type="button"
              class="bg-secondary text-secondary-foreground text-label-m inline-flex min-h-8 items-center gap-1 rounded-full px-3"
              [attr.aria-label]="'Remover filtro ' + chip.rotulo"
              (click)="alternarFiltro(chip.coluna, chip.valor)"
            >
              {{ chip.rotulo }}
              <ng-icon name="lucideX" class="text-sm" aria-hidden="true" />
            </button>
          }
          <button hlmBtn variant="link" size="sm" type="button" (click)="limparTudo()">Limpar tudo</button>
        </div>
      }

      <div hlmTableContainer class="border-border rounded-lg border" [attr.aria-busy]="false">
        <table hlmTable>
          <caption hlmCaption class="sr-only">{{ legenda() }}</caption>
          <thead hlmTHead>
            <tr hlmTr>
              @for (col of colunas(); track col.id) {
                <th
                  hlmTh
                  scope="col"
                  class="text-label-l text-muted-foreground h-11 px-3 text-left whitespace-nowrap"
                  [class.text-right]="col.tipo === 'numero'"
                  [class.max-md:hidden]="col.secundaria"
                  [attr.aria-sort]="ariaSort(col.id)"
                >
                  <button
                    type="button"
                    class="hover:text-foreground inline-flex min-h-8 items-center gap-1 rounded-md"
                    [class.flex-row-reverse]="col.tipo === 'numero'"
                    (click)="ordenar(col.id)"
                  >
                    {{ col.titulo }}
                    <ng-icon [name]="iconeOrdem(col.id)" class="text-sm" aria-hidden="true" />
                  </button>
                </th>
              }
            </tr>
          </thead>
          <tbody hlmTBody>
            @for (linha of pagina(); track $index) {
              <tr hlmTr>
                @for (col of colunas(); track col.id) {
                  <td
                    hlmTd
                    class="px-3 py-2.5 align-top"
                    [class.text-right]="col.tipo === 'numero'"
                    [class.tabular]="col.tipo === 'numero'"
                    [class.max-md:hidden]="col.secundaria"
                    [style.min-width]="col.larguraMin"
                  >
                    @switch (col.tipo) {
                      @case ('selo') {
                        <app-status-badge [texto]="texto(linha[col.id])" [tom]="col.tom ? col.tom(linha[col.id], linha) : 'neutral'" />
                      }
                      @case ('codigo') {
                        <span class="code-inline">{{ texto(linha[col.id]) }}</span>
                      }
                      @default {
                        {{ texto(linha[col.id]) }}
                      }
                    }
                  </td>
                }
              </tr>
            } @empty {
              <tr hlmTr>
                <td hlmTd [attr.colspan]="colunas().length" class="text-muted-foreground p-8 text-center">
                  Nenhum resultado para os filtros atuais.
                  <button hlmBtn variant="link" size="sm" type="button" (click)="limparTudo()">Limpar filtros</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPaginas() > 1) {
        <div class="flex flex-wrap items-center justify-between gap-2">
          <label class="text-body-s text-muted-foreground flex items-center gap-2">
            Linhas por página
            <select
              class="border-input bg-surface-lowest text-body-m h-9 rounded-lg border px-2"
              [value]="tamanho()"
              (change)="definirTamanho($any($event.target).value)"
            >
              @for (n of tamanhos; track n) {
                <option [value]="n" [selected]="n === tamanho()">{{ n }}</option>
              }
            </select>
          </label>
          <div class="flex items-center gap-1">
            <button hlmBtn variant="outline" size="icon-sm" type="button" aria-label="Página anterior" [disabled]="indice() === 0" (click)="irPara(indice() - 1)">
              <ng-icon name="lucideChevronLeft" aria-hidden="true" />
            </button>
            <span class="text-label-l tabular px-2">{{ indice() + 1 }} / {{ totalPaginas() }}</span>
            <button hlmBtn variant="outline" size="icon-sm" type="button" aria-label="Próxima página" [disabled]="indice() >= totalPaginas() - 1" (click)="irPara(indice() + 1)">
              <ng-icon name="lucideChevronRight" aria-hidden="true" />
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class TabelaDadosComponent {
  readonly colunas = input.required<ColunaTabela[]>();
  readonly linhas = input.required<readonly Linha[]>();
  /** Texto da legenda (leitores de tela) e do campo de busca. */
  readonly legenda = input.required<string>();
  readonly tamanhoInicial = input(10);
  /** Nome do arquivo ao exportar (sem extensão). */
  readonly arquivo = input('tabela');

  protected readonly tamanhos = [10, 25, 50, 100];
  protected readonly busca = signal('');
  protected readonly filtros = signal<Record<string, string[]>>({});
  protected readonly ordem = signal<{ coluna: string; direcao: Direcao } | null>(null);
  protected readonly indice = signal(0);
  private readonly tamanhoEscolhido = signal<number | null>(null);
  protected readonly tamanho = computed(() => this.tamanhoEscolhido() ?? this.tamanhoInicial());

  protected readonly colunasFiltraveis = computed(() => this.colunas().filter((c) => c.filtravel));

  protected readonly opcoes = computed(() => {
    const resultado: Record<string, { valor: string; total: number }[]> = {};
    for (const col of this.colunasFiltraveis()) {
      const contagem = new Map<string, number>();
      for (const l of this.linhas()) {
        const v = this.texto(l[col.id]);
        contagem.set(v, (contagem.get(v) ?? 0) + 1);
      }
      resultado[col.id] = [...contagem.entries()].map(([valor, total]) => ({ valor, total })).sort((a, b) => b.total - a.total || a.valor.localeCompare(b.valor, 'pt-BR'));
    }
    return resultado;
  });

  protected readonly filtradas = computed(() => {
    const termo = this.busca().trim().toLocaleLowerCase('pt-BR');
    const ativos = Object.entries(this.filtros()).filter(([, v]) => v.length > 0);
    let resultado = this.linhas().filter((l) => {
      for (const [coluna, valores] of ativos) if (!valores.includes(this.texto(l[coluna]))) return false;
      if (!termo) return true;
      return this.colunas().some((c) => this.texto(l[c.id]).toLocaleLowerCase('pt-BR').includes(termo));
    });
    const o = this.ordem();
    if (o) {
      const col = this.colunas().find((c) => c.id === o.coluna);
      const fator = o.direcao === 'asc' ? 1 : -1;
      resultado = [...resultado].sort((a, b) => {
        const x = a[o.coluna];
        const y = b[o.coluna];
        if (col?.tipo === 'numero') return ((Number(x) || 0) - (Number(y) || 0)) * fator;
        return this.texto(x).localeCompare(this.texto(y), 'pt-BR', { numeric: true }) * fator;
      });
    }
    return resultado;
  });

  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / this.tamanho())));
  protected readonly pagina = computed(() => {
    const i = Math.min(this.indice(), this.totalPaginas() - 1);
    return this.filtradas().slice(i * this.tamanho(), (i + 1) * this.tamanho());
  });

  protected readonly contador = computed(() => {
    const total = this.linhas().length;
    const filtrado = this.filtradas().length;
    if (filtrado === 0) return '0 resultados';
    const i = Math.min(this.indice(), this.totalPaginas() - 1);
    const de = i * this.tamanho() + 1;
    const ate = Math.min((i + 1) * this.tamanho(), filtrado);
    const base = `${de}–${ate} de ${filtrado.toLocaleString('pt-BR')}`;
    return filtrado < total ? `${base} (filtrado de ${total.toLocaleString('pt-BR')})` : base;
  });

  protected readonly chipsAtivos = computed(() => {
    const chips: { chave: string; coluna: string; valor: string; rotulo: string }[] = [];
    for (const col of this.colunasFiltraveis()) {
      for (const valor of this.filtros()[col.id] ?? []) chips.push({ chave: `${col.id}:${valor}`, coluna: col.id, valor, rotulo: `${col.titulo}: ${valor}` });
    }
    return chips;
  });

  protected texto(valor: Celula): string {
    if (valor === null || valor === undefined || valor === '') return '—';
    if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
    if (typeof valor === 'number') return valor.toLocaleString('pt-BR');
    return String(valor);
  }

  protected definirBusca(valor: string): void {
    this.busca.set(valor);
    this.indice.set(0);
  }

  protected ativo(coluna: string, valor: string): boolean {
    return (this.filtros()[coluna] ?? []).includes(valor);
  }

  protected alternarFiltro(coluna: string, valor: string): void {
    this.filtros.update((f) => {
      const atuais = f[coluna] ?? [];
      return { ...f, [coluna]: atuais.includes(valor) ? atuais.filter((v) => v !== valor) : [...atuais, valor] };
    });
    this.indice.set(0);
  }

  protected limparTudo(): void {
    this.filtros.set({});
    this.busca.set('');
    this.indice.set(0);
  }

  protected ordenar(coluna: string): void {
    const atual = this.ordem();
    if (!atual || atual.coluna !== coluna) this.ordem.set({ coluna, direcao: 'asc' });
    else if (atual.direcao === 'asc') this.ordem.set({ coluna, direcao: 'desc' });
    else this.ordem.set(null);
  }

  protected ariaSort(coluna: string): 'ascending' | 'descending' | 'none' {
    const o = this.ordem();
    if (!o || o.coluna !== coluna) return 'none';
    return o.direcao === 'asc' ? 'ascending' : 'descending';
  }

  protected iconeOrdem(coluna: string): string {
    const o = this.ordem();
    if (!o || o.coluna !== coluna) return 'lucideArrowUpDown';
    return o.direcao === 'asc' ? 'lucideArrowUp' : 'lucideArrowDown';
  }

  protected definirTamanho(valor: string): void {
    this.tamanhoEscolhido.set(Number(valor));
    this.indice.set(0);
  }

  protected irPara(i: number): void {
    this.indice.set(Math.min(Math.max(i, 0), this.totalPaginas() - 1));
  }

  protected exportar(): void {
    const cols = this.colunas();
    const escapar = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const linhas = [cols.map((c) => escapar(c.titulo)).join(';'), ...this.filtradas().map((l) => cols.map((c) => escapar(this.texto(l[c.id]))).join(';'))];
    const blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.arquivo()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
