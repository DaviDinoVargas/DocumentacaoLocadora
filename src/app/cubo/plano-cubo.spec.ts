import { describe, expect, it } from 'vitest';
import { ControladorCubo, estadoAlvo, planejar, totalDePecas, type EstadoCubo, type ExecutorCubo, type Lote } from './plano-cubo';

const N = 16;
const P = N - 2;

const estadoDe = (pagina: number) => estadoAlvo(pagina, N);
const tipos = (lotes: Lote[]) => lotes.map((l) => l.acoes.map((a) => a.tipo));

describe('estadoAlvo', () => {
  it('P = N − 2 peças', () => {
    expect(totalDePecas(N)).toBe(14);
  });

  it('página 1: nenhuma peça montada', () => {
    expect(estadoDe(1)).toEqual({ montadas: 0, resolvido: false });
  });

  it('peças montadas = índice da página − 1, limitado a P', () => {
    expect(estadoDe(2).montadas).toBe(1);
    expect(estadoDe(8).montadas).toBe(7);
    expect(estadoDe(N - 1).montadas).toBe(P);
    expect(estadoDe(N).montadas).toBe(P);
  });

  it('só a última página está resolvida', () => {
    expect(estadoDe(N - 1).resolvido).toBe(false);
    expect(estadoDe(N).resolvido).toBe(true);
  });
});

describe('planejar', () => {
  it('avançar uma página devolve uma peça', () => {
    const { lotes, final } = planejar(1, estadoDe(1), 2, N);
    expect(lotes).toHaveLength(1);
    expect(lotes[0].acoes).toEqual([{ tipo: 'montar', peca: 0, atraso: 0 }]);
    expect(final).toEqual(estadoDe(2));
  });

  it('pular de a para b devolve |b − a| peças em sequência, com atraso crescente', () => {
    const { lotes } = planejar(2, estadoDe(2), 6, N);
    const acoes = lotes[0].acoes;
    expect(acoes.map((a) => ('peca' in a ? a.peca : -1))).toEqual([1, 2, 3, 4]);
    const atrasos = acoes.map((a) => ('atraso' in a ? a.atraso : 0));
    expect(atrasos[0]).toBe(0);
    expect(atrasos).toEqual([...atrasos].sort((x, y) => x - y));
    expect(atrasos[3]).toBeGreaterThan(atrasos[1]);
  });

  it('voltar tira o mesmo número de peças, da última montada para a primeira', () => {
    const { lotes, final } = planejar(6, estadoDe(6), 3, N);
    expect(lotes[0].acoes.map((a) => ('peca' in a ? a.peca : -1))).toEqual([4, 3, 2]);
    expect(lotes[0].acoes.every((a) => a.tipo === 'derrubar')).toBe(true);
    expect(final).toEqual(estadoDe(3));
  });

  it('voltar para a principal derruba todas as peças', () => {
    const { lotes, final } = planejar(9, estadoDe(9), 1, N);
    expect(lotes[0].acoes).toHaveLength(8);
    expect(lotes[0].acoes.every((a) => a.tipo === 'derrubar')).toBe(true);
    expect(final.montadas).toBe(0);
  });

  it('penúltima página fecha o cubo girando enquanto monta', () => {
    const { lotes, final } = planejar(N - 2, estadoDe(N - 2), N - 1, N);
    expect(tipos(lotes)).toEqual([['montar', 'girar']]);
    expect(final).toEqual({ montadas: P, resolvido: false });
  });

  it('da penúltima para a última o cubo só é resolvido', () => {
    const { lotes, final } = planejar(N - 1, estadoDe(N - 1), N, N);
    expect(tipos(lotes)).toEqual([['resolver']]);
    expect(final).toEqual({ montadas: P, resolvido: true });
  });

  it('da primeira direto para a última monta tudo, gira e resolve', () => {
    const { lotes, final } = planejar(1, estadoDe(1), N, N);
    expect(lotes).toHaveLength(2);
    expect(lotes[0].acoes.filter((a) => a.tipo === 'montar')).toHaveLength(P);
    expect(lotes[0].acoes.some((a) => a.tipo === 'girar')).toBe(true);
    expect(tipos(lotes)[1]).toEqual(['resolver']);
    expect(final).toEqual(estadoDe(N));
  });

  it('da última direto para a primeira o cubo explode', () => {
    const { lotes, final } = planejar(N, estadoDe(N), 1, N);
    expect(lotes).toHaveLength(1);
    expect(lotes[0].acoes).toHaveLength(P);
    expect(lotes[0].acoes.every((a) => a.tipo === 'explodir')).toBe(true);
    expect(final).toEqual(estadoDe(1));
  });

  it('sair da última página desfaz o resolvido antes de derrubar peças', () => {
    const { lotes, final } = planejar(N, estadoDe(N), 8, N);
    expect(tipos(lotes)[0]).toEqual(['embaralhar']);
    expect(lotes[1].acoes).toHaveLength(P - 7);
    expect(final).toEqual(estadoDe(8));
  });

  it('da última para a penúltima só embaralha', () => {
    const { lotes } = planejar(N, estadoDe(N), N - 1, N);
    expect(tipos(lotes)).toEqual([['embaralhar']]);
  });

  it('mesma página não gera animação', () => {
    expect(planejar(5, estadoDe(5), 5, N).lotes).toEqual([]);
  });

  it('o estado final sempre coincide com o estado alvo da página de destino', () => {
    for (let a = 1; a <= N; a++) {
      for (let b = 1; b <= N; b++) {
        expect(planejar(a, estadoDe(a), b, N).final).toEqual(estadoDe(b));
      }
    }
  });
});

class ExecutorFalso implements ExecutorCubo {
  readonly historico: string[] = [];
  readonly estados: EstadoCubo[] = [];
  emAndamento = 0;
  maxSimultaneos = 0;
  readonly velocidades: number[] = [];

  async executar(lote: Lote, velocidade: number): Promise<void> {
    this.emAndamento++;
    this.maxSimultaneos = Math.max(this.maxSimultaneos, this.emAndamento);
    this.velocidades.push(velocidade);
    this.historico.push(lote.acoes.map((a) => a.tipo).join('+'));
    await new Promise((r) => setTimeout(r, 1));
    this.emAndamento--;
  }

  aplicarEstado(estado: EstadoCubo): void {
    this.estados.push(estado);
  }
}

describe('ControladorCubo', () => {
  it('começa no estado da página inicial, sem animar', () => {
    const ex = new ExecutorFalso();
    const c = new ControladorCubo(ex, N, 1);
    expect(ex.estados).toEqual([estadoDe(1)]);
    expect(c.estadoLogico).toEqual(estadoDe(1));
    expect(ex.historico).toEqual([]);
  });

  it('carga direta na última página já nasce resolvida', () => {
    const ex = new ExecutorFalso();
    new ControladorCubo(ex, N, N);
    expect(ex.estados[0]).toEqual({ montadas: P, resolvido: true });
  });

  it('nunca sobrepõe animações: cliques rápidos entram em fila', async () => {
    const ex = new ExecutorFalso();
    const c = new ControladorCubo(ex, N, 1);
    for (let p = 2; p <= 8; p++) c.irPara(p);
    expect(c.animacoesPendentes).toBeGreaterThan(1);
    await c.aguardar();
    expect(ex.maxSimultaneos).toBe(1);
    expect(ex.historico).toHaveLength(7);
    expect(c.estadoLogico).toEqual(estadoDe(8));
  });

  it('fila longa acelera as animações seguintes', async () => {
    const ex = new ExecutorFalso();
    const c = new ControladorCubo(ex, N, 1);
    for (let p = 2; p <= 10; p++) c.irPara(p);
    await c.aguardar();
    expect(ex.velocidades[0]).toBeGreaterThan(1);
    expect(ex.velocidades[ex.velocidades.length - 1]).toBe(1);
  });

  it('planeja a partir do estado lógico, mesmo com animação em andamento', async () => {
    const ex = new ExecutorFalso();
    const c = new ControladorCubo(ex, N, 1);
    c.irPara(5);
    c.irPara(2); // volta enquanto ainda anima a ida
    await c.aguardar();
    expect(ex.historico).toEqual(['montar+montar+montar+montar', 'derrubar+derrubar+derrubar']);
    expect(c.estadoLogico).toEqual(estadoDe(2));
  });

  it('com movimento reduzido vai direto ao estado final', async () => {
    const ex = new ExecutorFalso();
    const c = new ControladorCubo(ex, N, 1, () => true);
    c.irPara(N);
    await c.aguardar();
    expect(ex.historico).toEqual([]);
    expect(ex.estados[ex.estados.length - 1]).toEqual(estadoDe(N));
  });

  it('depois de destruído ignora novas navegações', async () => {
    const ex = new ExecutorFalso();
    const c = new ControladorCubo(ex, N, 1);
    c.destruir();
    c.irPara(4);
    await c.aguardar();
    expect(ex.historico).toEqual([]);
  });
});
