/**
 * Giros de camada de um cubo 3×3×3, só com aritmética inteira (posições da grade −1..1).
 * O embaralhamento é uma sequência fixa e conhecida: resolver é aplicar a sequência inversa.
 */

export type Eixo = 'x' | 'y' | 'z';
export type Vec3 = readonly [number, number, number];

export interface Movimento {
  readonly eixo: Eixo;
  /** Camada girada: posição da fatia (−1, 0 ou 1) ao longo do eixo. */
  readonly camada: -1 | 0 | 1;
  /** Quartos de volta (regra da mão direita em torno do eixo). */
  readonly giros: -2 | -1 | 1 | 2;
}

const INDICE: Record<Eixo, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

/** Gira `v` em `giros` quartos de volta em torno de `eixo` (positivo = mão direita). */
export function girar(v: Vec3, eixo: Eixo, giros: number): Vec3 {
  let [x, y, z] = v;
  const vezes = ((giros % 4) + 4) % 4;
  for (let i = 0; i < vezes; i++) {
    if (eixo === 'x') [x, y, z] = [x, -z, y];
    else if (eixo === 'y') [x, y, z] = [z, y, -x];
    else [x, y, z] = [-y, x, z];
  }
  return [x + 0, y + 0, z + 0]; // + 0 normaliza −0
}

export function pertenceACamada(v: Vec3, mov: Movimento): boolean {
  return v[INDICE[mov.eixo]] === mov.camada;
}

export function aplicar(posicoes: readonly Vec3[], mov: Movimento): Vec3[] {
  return posicoes.map((v) => (pertenceACamada(v, mov) ? girar(v, mov.eixo, mov.giros) : v));
}

export function inverso(sequencia: readonly Movimento[]): Movimento[] {
  return [...sequencia].reverse().map((m) => ({ ...m, giros: (m.giros === 2 || m.giros === -2 ? 2 : -m.giros) as Movimento['giros'] }));
}

/** Sequência que embaralha o cubo resolvido (todas as faces mudam). */
export const EMBARALHAMENTO: readonly Movimento[] = [
  { eixo: 'y', camada: 1, giros: 1 },
  { eixo: 'x', camada: 1, giros: -1 },
  { eixo: 'z', camada: -1, giros: 1 },
  { eixo: 'y', camada: -1, giros: 2 },
  { eixo: 'x', camada: -1, giros: 1 },
  { eixo: 'z', camada: 1, giros: -1 },
  { eixo: 'y', camada: 1, giros: -1 },
  { eixo: 'x', camada: 1, giros: 1 },
  { eixo: 'z', camada: -1, giros: 2 },
  { eixo: 'y', camada: -1, giros: -1 }
];

/** Posições da grade ocupadas por peças visíveis (as 26 de fora; o miolo não aparece). */
export function posicoesExternas(): Vec3[] {
  const lista: Vec3[] = [];
  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        if (x !== 0 || y !== 0 || z !== 0) lista.push([x, y, z]);
      }
    }
  }
  return lista;
}

/**
 * Distribui as 26 peças da grade em `grupos` peças lógicas do cubo, em ordem de montagem
 * (de baixo para cima, para o cubo "crescer" ao ser montado). Devolve, para cada peça lógica,
 * os índices das peças da grade.
 */
export function agruparEmPecas(total: number, grupos: number): number[][] {
  if (grupos <= 0) return [];
  const resultado: number[][] = Array.from({ length: grupos }, () => []);
  for (let i = 0; i < total; i++) {
    resultado[Math.min(Math.floor((i * grupos) / total), grupos - 1)].push(i);
  }
  return resultado;
}
