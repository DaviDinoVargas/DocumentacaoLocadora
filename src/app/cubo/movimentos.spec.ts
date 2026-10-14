import { describe, expect, it } from 'vitest';
import { FISICA_PADRAO, lancarParaAlvo, novoCorpo, passo, tempoAteOChao } from './fisica';
import { EMBARALHAMENTO, agruparEmPecas, aplicar, girar, inverso, posicoesExternas, type Vec3 } from './movimentos';

describe('movimentos do cubo', () => {
  it('tem 26 peças externas', () => {
    expect(posicoesExternas()).toHaveLength(26);
  });

  it('quatro quartos de volta devolvem a posição', () => {
    for (const eixo of ['x', 'y', 'z'] as const) {
      expect(girar([1, 1, -1], eixo, 4)).toEqual([1, 1, -1]);
    }
  });

  it('a regra da mão direita vale para o eixo y', () => {
    expect(girar([1, 0, 0], 'y', 1)).toEqual([0, 0, -1]);
  });

  it('o embaralhamento é reversível: aplicar e desaplicar devolve o cubo resolvido', () => {
    const inicio = posicoesExternas();
    let atual: Vec3[] = inicio;
    for (const m of EMBARALHAMENTO) atual = aplicar(atual, m);
    expect(atual).not.toEqual(inicio);
    for (const m of inverso(EMBARALHAMENTO)) atual = aplicar(atual, m);
    expect(atual).toEqual(inicio);
  });

  it('o embaralhamento move mais da metade das peças', () => {
    const inicio = posicoesExternas();
    let atual: Vec3[] = inicio;
    for (const m of EMBARALHAMENTO) atual = aplicar(atual, m);
    const movidas = atual.filter((v, i) => v.join() !== inicio[i].join()).length;
    expect(movidas).toBeGreaterThan(13);
  });

  it('agrupa as 26 peças em P grupos, sem perder nem repetir nenhuma', () => {
    const grupos = agruparEmPecas(26, 14);
    expect(grupos).toHaveLength(14);
    expect(grupos.flat().sort((a, b) => a - b)).toEqual(Array.from({ length: 26 }, (_, i) => i));
    expect(grupos.every((g) => g.length >= 1 && g.length <= 2)).toBe(true);
  });
});

describe('física da queda', () => {
  it('cai, quica e assenta no chão', () => {
    const c = novoCorpo();
    c.y = 4;
    let quiques = 0;
    for (let i = 0; i < 60 * 8 && !c.repouso; i++) if (passo(c, 1 / 60)) quiques++;
    expect(c.repouso).toBe(true);
    expect(c.y).toBeCloseTo(FISICA_PADRAO.alturaDeRepouso, 5);
    expect(quiques).toBeGreaterThanOrEqual(1);
  });

  it('o quique é leve: perde energia a cada batida', () => {
    const c = novoCorpo();
    c.y = 4;
    let maxima = 0;
    let primeiraSubida = 0;
    for (let i = 0; i < 60 * 3; i++) {
      const antes = c.vy;
      passo(c, 1 / 60);
      if (antes < 0 && c.vy > 0 && !primeiraSubida) primeiraSubida = c.vy;
      maxima = Math.max(maxima, c.vy);
    }
    expect(primeiraSubida).toBeLessThan(Math.sqrt(2 * FISICA_PADRAO.gravidade * 3.6));
  });

  it('aterrissa perto do alvo escolhido', () => {
    const c = novoCorpo();
    c.x = 0;
    c.y = 2.7;
    c.z = 0;
    lancarParaAlvo(c, 3, -2, 2);
    for (let i = 0; i < 60 * 8 && !c.repouso; i++) passo(c, 1 / 60);
    expect(Math.hypot(c.x - 3, c.z + 2)).toBeLessThan(1.6);
  });

  it('o tempo até o chão cresce com a altura', () => {
    expect(tempoAteOChao(5, 0)).toBeGreaterThan(tempoAteOChao(2, 0));
    expect(tempoAteOChao(0.2, 0)).toBe(0);
  });
});
