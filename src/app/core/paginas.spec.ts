import { describe, expect, it } from 'vitest';
import { PAGINAS, TOTAL_PAGINAS, TOTAL_PECAS, indiceDoCaminho } from './paginas';

describe('registro de páginas', () => {
  it('a página principal é a primeira e o encerramento é a última', () => {
    expect(PAGINAS[0].caminho).toBe('');
    expect(PAGINAS[PAGINAS.length - 1].caminho).toBe('encerramento');
  });

  it('o cubo tem P = N − 2 peças', () => {
    expect(TOTAL_PAGINAS).toBe(PAGINAS.length);
    expect(TOTAL_PECAS).toBe(TOTAL_PAGINAS - 2);
  });

  it('os caminhos são únicos', () => {
    expect(new Set(PAGINAS.map((p) => p.caminho)).size).toBe(PAGINAS.length);
  });

  it('todas as páginas têm título, grupo e ícone', () => {
    for (const p of PAGINAS) {
      expect(p.titulo.length).toBeGreaterThan(0);
      expect(p.grupo.length).toBeGreaterThan(0);
      expect(p.icone.startsWith('lucide')).toBe(true);
    }
  });

  it('indiceDoCaminho ignora barras, query e fragmento', () => {
    expect(indiceDoCaminho('/')).toBe(1);
    expect(indiceDoCaminho('')).toBe(1);
    expect(indiceDoCaminho('/arquitetura?x=1#topo')).toBe(2);
    expect(indiceDoCaminho('/encerramento/')).toBe(TOTAL_PAGINAS);
    expect(indiceDoCaminho('/nao-existe')).toBe(1);
  });
});
