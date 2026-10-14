/**
 * Física simples da queda das peças: gravidade, quique leve e atrito no chão. Não usa Three.js — o
 * corpo é um ponto com velocidade; a rotação é tratada pela cena a partir de `giro`.
 */

export interface Corpo {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** Velocidade angular (rad/s) em torno de cada eixo. */
  gx: number;
  gy: number;
  gz: number;
  /** Chão tocado e quase parado. */
  repouso: boolean;
  quiques: number;
}

export interface ParametrosFisica {
  gravidade: number;
  /** Fração da velocidade vertical mantida a cada quique. */
  restituicao: number;
  /** Fração da velocidade horizontal mantida a cada quique. */
  atritoNoQuique: number;
  /** Amortecimento horizontal contínuo com o corpo no chão (1/s). */
  atritoRolando: number;
  /** Altura do centro do corpo quando apoiado no chão. */
  alturaDeRepouso: number;
  /** Abaixo desta velocidade vertical o quique termina e o corpo assenta. */
  velocidadeMinimaDeQuique: number;
}

export const FISICA_PADRAO: ParametrosFisica = {
  gravidade: 26,
  restituicao: 0.4,
  atritoNoQuique: 0.55,
  atritoRolando: 5,
  alturaDeRepouso: 0.46,
  velocidadeMinimaDeQuique: 1.6
};

export function novoCorpo(): Corpo {
  return { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, gx: 0, gy: 0, gz: 0, repouso: false, quiques: 0 };
}

/** Tempo até o corpo tocar o chão a partir de `y` com velocidade vertical `vy` (resolve a quadrática). */
export function tempoAteOChao(y: number, vy: number, p: ParametrosFisica = FISICA_PADRAO): number {
  const h = y - p.alturaDeRepouso;
  if (h <= 0) return 0;
  return (vy + Math.sqrt(vy * vy + 2 * p.gravidade * h)) / p.gravidade;
}

/** Avança `dt` segundos. Devolve true quando houve um quique neste passo (a cena pode tocar efeito). */
export function passo(c: Corpo, dt: number, p: ParametrosFisica = FISICA_PADRAO): boolean {
  if (c.repouso) return false;
  // integração em passos curtos: o quique não "atravessa" o chão com dt grande
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  let quicou = false;
  for (let i = 0; i < n; i++) {
    c.vy -= p.gravidade * h;
    c.x += c.vx * h;
    c.y += c.vy * h;
    c.z += c.vz * h;

    if (c.y <= p.alturaDeRepouso) {
      c.y = p.alturaDeRepouso;
      if (Math.abs(c.vy) < p.velocidadeMinimaDeQuique) {
        c.vy = 0;
        const amort = Math.exp(-p.atritoRolando * h);
        c.vx *= amort;
        c.vz *= amort;
        c.gx *= amort;
        c.gy *= amort;
        c.gz *= amort;
        if (Math.hypot(c.vx, c.vz) < 0.05) {
          c.vx = c.vz = 0;
          c.gx = c.gy = c.gz = 0;
          c.repouso = true;
          break;
        }
      } else {
        c.vy = -c.vy * p.restituicao;
        c.vx *= p.atritoNoQuique;
        c.vz *= p.atritoNoQuique;
        c.gx *= 0.6;
        c.gy *= 0.6;
        c.gz *= 0.6;
        c.quiques++;
        quicou = true;
      }
    }
  }
  return quicou;
}

/**
 * Quanto o corpo se desloca na horizontal, até assentar, para cada 1 m/s de velocidade horizontal inicial.
 * O modelo é linear na velocidade horizontal (quique e atrito só multiplicam), então basta simular uma vez.
 */
export function deslocamentoPorVelocidade(y: number, vy: number, p: ParametrosFisica = FISICA_PADRAO): number {
  const c = novoCorpo();
  c.y = y;
  c.vy = vy;
  c.vx = 1;
  for (let i = 0; i < 60 * 12 && !c.repouso; i++) passo(c, 1 / 60, p);
  return Math.max(c.x, 0.05);
}

/** Velocidades iniciais para que o corpo, depois dos quiques, assente perto de (alvoX, alvoZ). */
export function lancarParaAlvo(c: Corpo, alvoX: number, alvoZ: number, vyInicial: number, p: ParametrosFisica = FISICA_PADRAO): void {
  const k = deslocamentoPorVelocidade(c.y, vyInicial, p);
  c.vy = vyInicial;
  c.vx = (alvoX - c.x) / k;
  c.vz = (alvoZ - c.z) / k;
  c.repouso = false;
  c.quiques = 0;
}
