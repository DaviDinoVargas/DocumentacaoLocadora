/**
 * Máquina de estados do cubo mágico — sem Three.js, sem DOM, sem tempo real: só decide *o que* deve
 * acontecer quando o leitor vai da página `a` para a página `b`.
 *
 * Com N páginas, o cubo tem P = N − 2 peças. O estado guarda quantas peças estão montadas:
 *   montadas(página i) = min(i − 1, P)
 *   resolvido(página i) = (i === N)
 *
 * Penúltima página (N − 1): todas as P peças montadas, o cubo gira enquanto monta.
 * Última página (N): o cubo gira as camadas até ficar resolvido (cores alinhadas por face).
 */

export interface EstadoCubo {
  /** Quantas peças estão no cubo (as P − montadas restantes estão caídas na base). */
  readonly montadas: number;
  /** Cubo com as cores de cada face alinhadas. */
  readonly resolvido: boolean;
}

export type Acao =
  /** A peça `peca` volta da base ao cubo, `atraso` segundos depois do início do lote. */
  | { readonly tipo: 'montar'; readonly peca: number; readonly atraso: number }
  /** A peça `peca` sai do cubo e cai na base. */
  | { readonly tipo: 'derrubar'; readonly peca: number; readonly atraso: number }
  /** A peça é lançada para fora com força (explosão do cubo inteiro). */
  | { readonly tipo: 'explodir'; readonly peca: number }
  /** Uma volta completa do cubo enquanto as peças se encaixam. */
  | { readonly tipo: 'girar' }
  /** Gira as camadas até as faces ficarem de uma cor só. */
  | { readonly tipo: 'resolver' }
  /** Desfaz o resolvido (embaralha) — acontece ao sair da última página. */
  | { readonly tipo: 'embaralhar' };

/** Conjunto de ações simultâneas; os lotes de um plano rodam em sequência (fila de animações). */
export interface Lote {
  readonly acoes: readonly Acao[];
}

/** Pequeno atraso entre uma peça e a seguinte quando várias voltam/saem de uma vez. */
export const ATRASO_ENTRE_PECAS = 0.12;

export function totalDePecas(totalPaginas: number): number {
  return Math.max(totalPaginas - 2, 0);
}

/** Estado que o cubo deve ter na página `pagina` (1..N). */
export function estadoAlvo(pagina: number, totalPaginas: number): EstadoCubo {
  const p = totalDePecas(totalPaginas);
  const i = Math.min(Math.max(Math.trunc(pagina), 1), totalPaginas);
  return { montadas: Math.min(i - 1, p), resolvido: i === totalPaginas };
}

/**
 * Plano de animação para ir de `de` (página + estado) até `paraPagina`.
 * Regras (numeração do enunciado):
 *  2/3. avançar: voltam |b − a| peças em sequência, com pequeno atraso entre elas;
 *  4.   voltar: saem tantas peças quantas as páginas de diferença, e caem;
 *  5.   voltar à principal: todas saem e caem;
 *  6.   penúltima: tudo montado, com o cubo girando enquanto monta;
 *  7.   última: o cubo gira as camadas e fica resolvido;
 *  8.   da última direto para a primeira: explosão.
 */
export function planejar(
  dePagina: number,
  de: EstadoCubo,
  paraPagina: number,
  totalPaginas: number
): { lotes: Lote[]; final: EstadoCubo } {
  const p = totalDePecas(totalPaginas);
  const alvo = estadoAlvo(paraPagina, totalPaginas);
  const origem = Math.min(Math.max(Math.trunc(dePagina), 1), totalPaginas);
  const destino = Math.min(Math.max(Math.trunc(paraPagina), 1), totalPaginas);
  const lotes: Lote[] = [];

  if (origem === destino) return { lotes, final: de };

  // Regra 8: da última página direto para a primeira, o cubo explode.
  if (de.resolvido && destino === 1 && p > 0) {
    lotes.push({ acoes: Array.from({ length: de.montadas }, (_, peca) => ({ tipo: 'explodir', peca }) as Acao) });
    return { lotes, final: alvo };
  }

  let montadas = de.montadas;
  let resolvido = de.resolvido;

  // Saindo da última página: o resolvido se desfaz antes de qualquer peça sair.
  if (resolvido && !alvo.resolvido) {
    lotes.push({ acoes: [{ tipo: 'embaralhar' }] });
    resolvido = false;
  }

  if (alvo.montadas > montadas) {
    const acoes: Acao[] = [];
    for (let peca = montadas, k = 0; peca < alvo.montadas; peca++, k++) {
      acoes.push({ tipo: 'montar', peca, atraso: k * ATRASO_ENTRE_PECAS });
    }
    // Regra 6: ao fechar o cubo (última peça entrando), ele gira enquanto monta.
    if (alvo.montadas === p && p > 0) acoes.push({ tipo: 'girar' });
    lotes.push({ acoes });
    montadas = alvo.montadas;
  } else if (alvo.montadas < montadas) {
    const acoes: Acao[] = [];
    // A última peça a entrar é a primeira a sair.
    for (let peca = montadas - 1, k = 0; peca >= alvo.montadas; peca--, k++) {
      acoes.push({ tipo: 'derrubar', peca, atraso: k * ATRASO_ENTRE_PECAS });
    }
    lotes.push({ acoes });
    montadas = alvo.montadas;
  }

  // Regra 7: a última página resolve o cubo.
  if (alvo.resolvido && !resolvido && montadas === p) {
    lotes.push({ acoes: [{ tipo: 'resolver' }] });
    resolvido = true;
  }

  return { lotes, final: { montadas, resolvido } };
}

/** Quem executa os lotes (a cena Three.js em produção; um dublê nos testes). */
export interface ExecutorCubo {
  /** Roda o lote e resolve quando terminar. `velocidade` > 1 acelera (fila longa). */
  executar(lote: Lote, velocidade: number): Promise<void>;
  /** Vai direto ao estado, sem animação (carga inicial e prefers-reduced-motion). */
  aplicarEstado(estado: EstadoCubo): void;
}

/**
 * Guarda o estado *lógico* do cubo e uma fila de animações: cada navegação é planejada a partir do
 * estado lógico final da anterior, então cliques rápidos nunca sobrepõem animações — elas entram em
 * fila e, se a fila cresce, rodam mais depressa.
 */
export class ControladorCubo {
  private estado: EstadoCubo;
  private pagina: number;
  private fila: Promise<void> = Promise.resolve();
  private pendentes = 0;
  private destruido = false;

  constructor(
    private readonly executor: ExecutorCubo,
    private readonly totalPaginas: number,
    paginaInicial: number,
    private readonly reduzirMovimento: () => boolean = () => false
  ) {
    this.pagina = Math.min(Math.max(paginaInicial, 1), totalPaginas);
    this.estado = estadoAlvo(this.pagina, totalPaginas);
    this.executor.aplicarEstado(this.estado);
  }

  get estadoLogico(): EstadoCubo {
    return this.estado;
  }

  get paginaLogica(): number {
    return this.pagina;
  }

  get animacoesPendentes(): number {
    return this.pendentes;
  }

  irPara(paginaDestino: number): void {
    if (this.destruido) return;
    const destino = Math.min(Math.max(Math.trunc(paginaDestino), 1), this.totalPaginas);
    if (destino === this.pagina) return;

    const { lotes, final } = planejar(this.pagina, this.estado, destino, this.totalPaginas);
    this.pagina = destino;
    this.estado = final;

    if (this.reduzirMovimento()) {
      // Sem movimento: o estado final aparece de uma vez (a fila em andamento, se houver, termina antes).
      this.pendentes++;
      this.fila = this.fila.then(() => {
        this.pendentes--;
        if (!this.destruido) this.executor.aplicarEstado(final);
      });
      return;
    }

    for (const lote of lotes) {
      this.pendentes++;
      this.fila = this.fila.then(async () => {
        const velocidade = 1 + Math.min(this.pendentes - 1, 5) * 0.5;
        try {
          if (!this.destruido) await this.executor.executar(lote, velocidade);
        } finally {
          this.pendentes--;
        }
      });
    }
  }

  /** Resolve quando a fila esvaziar (útil nos testes). */
  async aguardar(): Promise<void> {
    await this.fila;
  }

  destruir(): void {
    this.destruido = true;
  }
}
