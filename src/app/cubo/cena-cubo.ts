import {
  AmbientLight, Color, DirectionalLight, Euler, Group, HemisphereLight, Material, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, Quaternion,
  RingGeometry, Scene, Shape, ShapeGeometry, Vector3, WebGLRenderer, type BufferGeometry
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FISICA_PADRAO, lancarParaAlvo, novoCorpo, passo, type Corpo } from './fisica';
import { EMBARALHAMENTO, agruparEmPecas, girar, inverso, pertenceACamada, posicoesExternas, type Eixo, type Movimento, type Vec3 } from './movimentos';
import type { Acao, EstadoCubo, ExecutorCubo, Lote } from './plano-cubo';

/** Tokens do tema que colorem as seis faces (lidos do CSS: nenhuma cor fixa no código). */
const TOKENS_FACES = ['--md-primary', '--md-primary-container', '--success', '--warning', '--md-error', '--md-outline'] as const;
const DIRECOES: readonly { eixo: Eixo; sinal: 1 | -1; normal: Vector3 }[] = [
  { eixo: 'x', sinal: 1, normal: new Vector3(1, 0, 0) },
  { eixo: 'x', sinal: -1, normal: new Vector3(-1, 0, 0) },
  { eixo: 'y', sinal: 1, normal: new Vector3(0, 1, 0) },
  { eixo: 'y', sinal: -1, normal: new Vector3(0, -1, 0) },
  { eixo: 'z', sinal: 1, normal: new Vector3(0, 0, 1) },
  { eixo: 'z', sinal: -1, normal: new Vector3(0, 0, -1) }
];

const ARESTA = 0.92; // aresta de cada peça
const PASSO_GRADE = 0.95; // distância entre centros na grade
const ALTURA_DO_CUBO = 2.75;
const DURACAO_VOLTA = 0.9;
const GIRO_POR_CAMADA = 0.46;
const GIRO_RAPIDO = 0.12;
const ALTURA_FLUTUACAO = 0.34;
const EIXO_Y = new Vector3(0, 1, 0);

type EstadoPeca = 'cubo' | 'voltando' | 'caindo' | 'chao';

interface Pedaco {
  id: number;
  peca: number;
  grade: Vec3;
  orient: Quaternion;
  obj: Group;
  estado: EstadoPeca;
  corpo: Corpo;
  pos: Vector3;
  quat: Quaternion;
  slot: Vector3;
  escala: number;
  assentar: { t: number; de: Quaternion; para: Quaternion } | null;
}

interface Tarefa {
  /** Avança `dt`; devolve true quando terminou. */
  tick(dt: number): boolean;
  encerrar(): void;
}

const facilitar = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const limitar = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

function lerToken(nome: string): Color {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return new Color(valor || '#888888');
}

/** Cena Three.js do cubo: peças, física da queda, giros de camada e laço de renderização. */
export class CenaCubo implements ExecutorCubo {
  private readonly renderer: WebGLRenderer;
  private readonly cena = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly pedacos: Pedaco[] = [];
  private readonly pecas: number[][];
  private readonly tarefas = new Set<Tarefa>();
  private readonly geometrias: BufferGeometry[] = [];
  private readonly materiais: Material[] = [];
  private readonly materialCorpo: MeshStandardMaterial;
  private readonly materiaisFace: MeshStandardMaterial[];
  private readonly materialOnda: MeshBasicMaterial;
  private readonly onda: Mesh;
  private readonly observador: ResizeObserver;
  private readonly visibilidade: IntersectionObserver;

  private readonly posCubo = new Vector3(0, ALTURA_DO_CUBO, 0);
  private readonly quatCubo = new Quaternion();
  private guinada = 0.6;
  private giroExtra = 0;
  private tempo = 0;
  private movimento: { eixo: Eixo; camada: -1 | 0 | 1; angulo: number } | null = null;
  private resolvidoAgora = false;
  private ondaT = -1;
  private readonly giroFlutuacao = new Quaternion();

  private raf = 0;
  private ultimo = 0;
  private emTela = true;
  private aba = true;
  private destruida = false;
  private contido = false;

  constructor(
    private readonly hospedeiro: HTMLElement,
    totalPecas: number,
    private readonly movimentoReduzido: () => boolean
  ) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'block size-full';
    hospedeiro.appendChild(canvas);

    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new PerspectiveCamera(32, 1, 0.1, 80);

    // luzes (brancas: as cores do tema ficam só nos materiais)
    this.cena.add(new HemisphereLight(0xffffff, 0x9a94a8, 1.15));
    this.cena.add(new AmbientLight(0xffffff, 0.35));
    const sol = new DirectionalLight(0xffffff, 1.9);
    sol.position.set(5, 11, 7);
    this.cena.add(sol);

    // onda de choque da explosão
    this.materialOnda = this.guardar(new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    this.onda = new Mesh(this.guardar(new RingGeometry(0.92, 1, 64)), this.materialOnda);
    this.onda.rotation.x = -Math.PI / 2;
    this.onda.position.y = 0.02;
    this.onda.visible = false;
    this.cena.add(this.onda);

    // peças
    this.materialCorpo = this.guardar(new MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 }));
    this.materiaisFace = TOKENS_FACES.map(() => this.guardar(new MeshStandardMaterial({ roughness: 0.32, metalness: 0.0 })));
    const geoCorpo = this.guardar(new RoundedBoxGeometry(ARESTA, ARESTA, ARESTA, 3, 0.09));
    const geoAdesivo = this.guardar(this.criarAdesivo(ARESTA * 0.8, 0.13));

    const grade = posicoesExternas();
    grade.forEach((pos, id) => {
      const obj = new Group();
      const corpo = new Mesh(geoCorpo, this.materialCorpo);
      obj.add(corpo);
      DIRECOES.forEach((dir, d) => {
        const indice = dir.eixo === 'x' ? 0 : dir.eixo === 'y' ? 1 : 2;
        if (pos[indice] !== dir.sinal) return;
        const adesivo = new Mesh(geoAdesivo, this.materiaisFace[d]);
        adesivo.position.copy(dir.normal).multiplyScalar(ARESTA / 2 + 0.004);
        adesivo.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), dir.normal);
        obj.add(adesivo);
      });
      this.cena.add(obj);
      this.pedacos.push({
        id, peca: 0, grade: pos, orient: new Quaternion(), obj, estado: 'chao', corpo: novoCorpo(),
        pos: new Vector3(), quat: new Quaternion(), slot: this.slotDoPedaco(id, grade.length), escala: 1, assentar: null
      });
    });

    // ordem de montagem: de baixo para cima, e dentro de cada nível em volta do eixo
    const ordem = this.pedacos
      .map((p, i) => ({ i, y: p.grade[1], ang: Math.atan2(p.grade[2], p.grade[0]) }))
      .sort((a, b) => a.y - b.y || a.ang - b.ang)
      .map((o) => o.i);
    this.pecas = agruparEmPecas(ordem.length, totalPecas).map((grupo) => grupo.map((k) => ordem[k]));
    this.pecas.forEach((grupo, peca) => grupo.forEach((id) => (this.pedacos[id].peca = peca)));

    this.embaralharInstantaneo();
    this.atualizarCores();

    this.observador = new ResizeObserver(() => this.redimensionar());
    this.observador.observe(hospedeiro);
    this.visibilidade = new IntersectionObserver((entradas) => {
      this.emTela = entradas.some((e) => e.isIntersecting);
      this.solicitarQuadro();
    });
    this.visibilidade.observe(hospedeiro);
    document.addEventListener('visibilitychange', this.aoMudarVisibilidade);
    canvas.addEventListener('webglcontextlost', this.aoPerderContexto);

    this.redimensionar();
    this.atualizarTransformacoes(0);
    this.renderer.render(this.cena, this.camera);
  }

  // ---------------------------------------------------------------- API (ExecutorCubo)

  aplicarEstado(estado: EstadoCubo): void {
    this.cancelarTarefas();
    this.movimento = null;
    this.giroExtra = 0;
    if (estado.resolvido && !this.resolvidoAgora) this.resolverInstantaneo();
    else if (!estado.resolvido && this.resolvidoAgora) this.embaralharInstantaneo();
    this.pedacos.forEach((p) => {
      p.escala = 1;
      p.assentar = null;
      p.corpo = novoCorpo();
      if (p.peca < estado.montadas) {
        p.estado = 'cubo';
      } else {
        this.colocarNoChao(p);
      }
    });
    this.atualizarTransformacoes(0);
    this.solicitarQuadro(true);
  }

  async executar(lote: Lote, velocidade: number): Promise<void> {
    if (this.destruida) return;
    const v = Math.max(velocidade, 1);
    const promessas: Promise<void>[] = [];
    const duracaoLote = Math.max(
      ...lote.acoes.map((a) => ('atraso' in a ? a.atraso : 0)),
      0
    ) / v + DURACAO_VOLTA / v;

    for (const acao of lote.acoes) promessas.push(this.executarAcao(acao, v, duracaoLote));
    this.solicitarQuadro();
    await Promise.all(promessas);
  }

  /** Relê as cores dos tokens do tema (chamar quando o tema claro/escuro mudar). */
  atualizarCores(): void {
    TOKENS_FACES.forEach((token, i) => this.materiaisFace[i].color.copy(lerToken(token)));
    this.materialCorpo.color.copy(lerToken('--md-surface-container-highest')).multiplyScalar(0.9);
    this.materialOnda.color.copy(lerToken('--md-primary'));
    this.solicitarQuadro(true);
  }

  destruir(): void {
    if (this.destruida) return;
    this.destruida = true;
    cancelAnimationFrame(this.raf);
    this.cancelarTarefas();
    this.observador.disconnect();
    this.visibilidade.disconnect();
    document.removeEventListener('visibilitychange', this.aoMudarVisibilidade);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.aoPerderContexto);
    this.geometrias.forEach((g) => g.dispose());
    this.materiais.forEach((m) => m.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  // ---------------------------------------------------------------- ações

  private executarAcao(acao: Acao, v: number, duracaoLote: number): Promise<void> {
    switch (acao.tipo) {
      case 'montar':
        return Promise.all(this.pecas[acao.peca].map((id, k) => this.animarVolta(this.pedacos[id], (acao.atraso + k * 0.05) / v, v))).then(() => undefined);
      case 'derrubar':
        return Promise.all(this.pecas[acao.peca].map((id, k) => this.animarQueda(this.pedacos[id], (acao.atraso + k * 0.04) / v, false))).then(() => undefined);
      case 'explodir':
        return Promise.all(this.pecas[acao.peca].map((id) => this.animarQueda(this.pedacos[id], Math.random() * 0.06, true))).then(() => undefined);
      case 'girar':
        return this.animarGiro(duracaoLote);
      case 'resolver':
        return this.sequenciaDeMovimentos(inverso(EMBARALHAMENTO), GIRO_POR_CAMADA / v, true);
      case 'embaralhar':
        return this.sequenciaDeMovimentos(EMBARALHAMENTO, GIRO_RAPIDO / v, false);
    }
  }

  private adicionarTarefa(tick: (dt: number) => boolean): Promise<void> {
    return new Promise<void>((resolver) => {
      const tarefa: Tarefa = {
        tick: (dt) => {
          const fim = tick(dt);
          if (fim) resolver();
          return fim;
        },
        encerrar: () => resolver()
      };
      this.tarefas.add(tarefa);
      this.solicitarQuadro();
    });
  }

  private animarVolta(p: Pedaco, atraso: number, v: number): Promise<void> {
    let t = 0;
    let iniciada = false;
    const dePos = new Vector3();
    const deQuat = new Quaternion();
    const alvoPos = new Vector3();
    const alvoQuat = new Quaternion();
    const duracao = DURACAO_VOLTA / v;
    let altura = 1.4;
    return this.adicionarTarefa((dt) => {
      t += dt;
      if (t < atraso) return false;
      if (!iniciada) {
        iniciada = true;
        p.estado = 'voltando';
        p.assentar = null;
        // parte da posição realmente exibida (inclui a flutuação), sem salto
        dePos.copy(p.obj.position);
        deQuat.copy(p.obj.quaternion);
        altura = 1.2 + dePos.distanceTo(this.posCubo) * 0.12;
      }
      const f = limitar((t - atraso) / duracao, 0, 1);
      const e = facilitar(f);
      this.alvoDoPedaco(p, alvoPos, alvoQuat);
      p.pos.lerpVectors(dePos, alvoPos, e);
      p.pos.y += Math.sin(Math.PI * f) * altura;
      p.quat.slerpQuaternions(deQuat, alvoQuat, e);
      if (f >= 1) {
        p.estado = 'cubo';
        p.escala = 1.14; // pequeno "encaixe"
        return true;
      }
      return false;
    });
  }

  private animarQueda(p: Pedaco, atraso: number, explosao: boolean): Promise<void> {
    let t = 0;
    let iniciada = false;
    return this.adicionarTarefa((dt) => {
      t += dt;
      if (t < atraso) return false;
      if (!iniciada) {
        iniciada = true;
        if (p.estado === 'chao' || p.estado === 'caindo') return true;
        this.soltar(p, explosao);
        if (explosao) this.dispararOnda();
      }
      // termina quando assenta (ou depois de um tempo máximo; a física continua sozinha)
      return p.estado === 'chao' || t - atraso > (explosao ? 3.6 : 3);
    });
  }

  private animarGiro(duracao: number): Promise<void> {
    let t = 0;
    const d = Math.max(duracao, 0.6);
    this.giroExtra = 0;
    return this.adicionarTarefa((dt) => {
      t += dt;
      const f = limitar(t / d, 0, 1);
      this.giroExtra = facilitar(f) * Math.PI * 2;
      if (f >= 1) {
        this.giroExtra = 0;
        this.guinada += Math.PI * 2; // volta completa: a pose final é igual à inicial
        return true;
      }
      return false;
    });
  }

  private async sequenciaDeMovimentos(sequencia: readonly Movimento[], duracaoPorQuarto: number, resolvendo: boolean): Promise<void> {
    for (const mov of sequencia) {
      if (this.destruida) return;
      await this.animarMovimento(mov, duracaoPorQuarto * Math.abs(mov.giros) ** 0.7);
    }
    this.resolvidoAgora = resolvendo;
  }

  private animarMovimento(mov: Movimento, duracao: number): Promise<void> {
    let t = 0;
    const alvo = (mov.giros * Math.PI) / 2;
    this.movimento = { eixo: mov.eixo, camada: mov.camada, angulo: 0 };
    return this.adicionarTarefa((dt) => {
      t += dt;
      const f = limitar(t / duracao, 0, 1);
      if (this.movimento) this.movimento.angulo = alvo * facilitar(f);
      if (f >= 1) {
        this.efetivarMovimento(mov);
        this.movimento = null;
        return true;
      }
      return false;
    });
  }

  // ---------------------------------------------------------------- estado das peças

  private efetivarMovimento(mov: Movimento): void {
    const q = new Quaternion().setFromAxisAngle(this.eixoVetor(mov.eixo), (mov.giros * Math.PI) / 2);
    for (const p of this.pedacos) {
      if (!pertenceACamada(p.grade, mov)) continue;
      p.grade = girar(p.grade, mov.eixo, mov.giros);
      p.orient.premultiply(q).normalize();
    }
  }

  private embaralharInstantaneo(): void {
    EMBARALHAMENTO.forEach((m) => this.efetivarMovimento(m));
    this.resolvidoAgora = false;
  }

  private resolverInstantaneo(): void {
    inverso(EMBARALHAMENTO).forEach((m) => this.efetivarMovimento(m));
    this.resolvidoAgora = true;
  }

  private eixoVetor(eixo: Eixo): Vector3 {
    return eixo === 'x' ? new Vector3(1, 0, 0) : eixo === 'y' ? new Vector3(0, 1, 0) : new Vector3(0, 0, 1);
  }

  /** Posição/orientação do pedaço quando está no cubo (considera a camada em giro e a pose do cubo). */
  private alvoDoPedaco(p: Pedaco, pos: Vector3, quat: Quaternion): void {
    pos.set(p.grade[0], p.grade[1], p.grade[2]).multiplyScalar(PASSO_GRADE);
    quat.copy(p.orient);
    if (this.movimento && pertenceACamada(p.grade, { eixo: this.movimento.eixo, camada: this.movimento.camada, giros: 1 })) {
      const camada = new Quaternion().setFromAxisAngle(this.eixoVetor(this.movimento.eixo), this.movimento.angulo);
      pos.applyQuaternion(camada);
      quat.premultiply(camada);
    }
    pos.applyQuaternion(this.quatCubo).add(this.posCubo);
    quat.premultiply(this.quatCubo);
  }

  private slotDoPedaco(id: number, total: number): Vector3 {
    const i = (id * 7) % total; // 7 é primo com 26: espalha os níveis pela base
    const r = Math.sqrt((i + 0.5) / total);
    const ang = i * 2.399963;
    return new Vector3(4.05 * r * Math.cos(ang), FISICA_PADRAO.alturaDeRepouso, 2.55 * r * Math.sin(ang));
  }

  private colocarNoChao(p: Pedaco): void {
    p.estado = 'chao';
    p.pos.copy(p.slot);
    const yaw = (p.id * 2.17) % (Math.PI * 2);
    p.quat.setFromEuler(new Euler(0, yaw, 0));
    p.corpo.repouso = true;
  }

  private soltar(p: Pedaco, explosao: boolean): void {
    const c = p.corpo;
    c.x = p.pos.x;
    c.y = p.pos.y;
    c.z = p.pos.z;
    const fx = p.pos.x - this.posCubo.x;
    const fz = p.pos.z - this.posCubo.z;
    const norma = Math.hypot(fx, fz) || 1;
    const vy = explosao ? 7 + Math.random() * 5 : 1.2 + Math.random() * 2.2;
    lancarParaAlvo(c, p.slot.x, p.slot.z, vy);
    if (!explosao) {
      // sai um pouco para fora do cubo antes de cair
      c.vx += (fx / norma) * 0.8;
      c.vz += (fz / norma) * 0.8;
    }
    const giro = explosao ? 11 : 4;
    c.gx = (Math.random() - 0.5) * giro;
    c.gy = (Math.random() - 0.5) * giro;
    c.gz = (Math.random() - 0.5) * giro;
    c.repouso = false;
    p.estado = 'caindo';
    p.assentar = null;
  }

  private dispararOnda(): void {
    if (this.ondaT >= 0) return;
    this.ondaT = 0;
    this.onda.visible = true;
  }

  private assentarNoChao(p: Pedaco): void {
    p.estado = 'chao';
    // deixa uma face apoiada no chão, mantendo a guinada atual
    const cima = new Vector3(0, 1, 0);
    const eixos = [new Vector3(1, 0, 0), new Vector3(-1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, -1, 0), new Vector3(0, 0, 1), new Vector3(0, 0, -1)];
    let melhor = eixos[0].clone().applyQuaternion(p.quat);
    let melhorDot = -2;
    for (const e of eixos) {
      const w = e.clone().applyQuaternion(p.quat);
      const dot = w.dot(cima);
      if (dot > melhorDot) {
        melhorDot = dot;
        melhor = w;
      }
    }
    const alinhar = new Quaternion().setFromUnitVectors(melhor, cima);
    p.assentar = { t: 0, de: p.quat.clone(), para: alinhar.multiply(p.quat.clone()).normalize() };
  }

  // ---------------------------------------------------------------- laço

  private cancelarTarefas(): void {
    this.tarefas.forEach((t) => t.encerrar());
    this.tarefas.clear();
  }

  private avancar(dt: number): void {
    const continuo = !this.movimentoReduzido();
    if (continuo) {
      this.tempo += dt;
      this.guinada += dt * 0.35;
    }
    for (const t of [...this.tarefas]) if (t.tick(dt)) this.tarefas.delete(t);

    for (const p of this.pedacos) {
      if (p.estado === 'caindo') {
        passo(p.corpo, dt);
        p.pos.set(p.corpo.x, p.corpo.y, p.corpo.z);
        const w = Math.hypot(p.corpo.gx, p.corpo.gy, p.corpo.gz);
        if (w > 1e-4) {
          const dq = new Quaternion().setFromAxisAngle(new Vector3(p.corpo.gx / w, p.corpo.gy / w, p.corpo.gz / w), w * dt);
          p.quat.premultiply(dq).normalize();
        }
        if (p.corpo.repouso) this.assentarNoChao(p);
      } else if (p.estado === 'chao' && p.assentar) {
        p.assentar.t = Math.min(p.assentar.t + dt / 0.28, 1);
        p.quat.slerpQuaternions(p.assentar.de, p.assentar.para, facilitar(p.assentar.t));
        if (p.assentar.t >= 1) p.assentar = null;
      }
      if (p.escala > 1) p.escala = Math.max(1, p.escala - dt * 0.9);
    }
    this.atualizarTransformacoes(dt);

    if (this.ondaT >= 0) {
      this.ondaT += dt;
      const f = Math.min(this.ondaT / 0.75, 1);
      this.onda.scale.setScalar(1 + f * 6.2);
      this.materialOnda.opacity = 0.55 * (1 - f);
      if (f >= 1) {
        this.ondaT = -1;
        this.onda.visible = false;
      }
    }
  }

  private atualizarTransformacoes(_dt: number): void {
    const continuo = !this.movimentoReduzido();
    this.posCubo.y = ALTURA_DO_CUBO + (continuo ? Math.sin(this.tempo * 1.3) * 0.07 : 0);
    this.quatCubo.setFromEuler(new Euler(0.5, this.guinada + this.giroExtra, 0, 'XYZ'));
    const pos = new Vector3();
    const quat = new Quaternion();
    for (const p of this.pedacos) {
      if (p.estado === 'cubo') {
        this.alvoDoPedaco(p, pos, quat);
        p.pos.copy(pos);
        p.quat.copy(quat);
      }
      p.obj.position.copy(p.pos);
      p.obj.quaternion.copy(p.quat);
      if (p.estado === 'chao') {
        // peças sem base: flutuam com leve vaivém e giro lento
        p.obj.position.y += ALTURA_FLUTUACAO + (continuo ? Math.sin(this.tempo * 1.3 + p.id * 1.7) * 0.08 : 0);
        if (continuo) p.obj.quaternion.premultiply(this.giroFlutuacao.setFromAxisAngle(EIXO_Y, this.tempo * 0.4 + p.id));
      }
      p.obj.scale.setScalar(p.escala);
    }
  }

  private precisaAnimar(): boolean {
    if (this.tarefas.size > 0 || this.ondaT >= 0) return true;
    if (this.pedacos.some((p) => p.estado === 'caindo' || (p.estado === 'chao' && p.assentar) || p.escala > 1)) return true;
    return !this.movimentoReduzido(); // flutuação e giro lento do cubo
  }

  private readonly quadro = (agora: number): void => {
    this.raf = 0;
    if (this.destruida) return;
    const dt = this.ultimo ? Math.min((agora - this.ultimo) / 1000, 0.05) : 0.016;
    this.ultimo = agora;
    if (this.emTela && this.aba) {
      this.avancar(dt);
      this.renderer.render(this.cena, this.camera);
    }
    if (this.emTela && this.aba && this.precisaAnimar()) this.raf = requestAnimationFrame(this.quadro);
    else this.ultimo = 0;
  };

  private solicitarQuadro(imediato = false): void {
    if (this.destruida || this.contido) return;
    if (imediato && !(this.emTela && this.aba)) return;
    if (imediato) this.renderer.render(this.cena, this.camera);
    if (!this.raf && this.emTela && this.aba) this.raf = requestAnimationFrame(this.quadro);
  }

  private readonly aoMudarVisibilidade = (): void => {
    this.aba = document.visibilityState === 'visible';
    this.solicitarQuadro();
  };

  private readonly aoPerderContexto = (e: Event): void => {
    e.preventDefault();
    this.contido = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  };

  private redimensionar(): void {
    const w = Math.max(this.hospedeiro.clientWidth, 1);
    const h = Math.max(this.hospedeiro.clientHeight, 1);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // distância que enquadra a base inteira (largura ±4,9) e o cubo girando (altura ~5,4)
    const tan = Math.tan((this.camera.fov * Math.PI) / 360);
    const dist = Math.max(5.1 / (tan * this.camera.aspect), 4.3 / tan) * 1.08;
    const inclinacao = (26 * Math.PI) / 180;
    this.camera.position.set(0, 2.2 + Math.sin(inclinacao) * dist, Math.cos(inclinacao) * dist);
    this.camera.lookAt(0, 2.2, 0);
    this.camera.updateProjectionMatrix();
    this.solicitarQuadro(true);
  }

  // ---------------------------------------------------------------- utilidades

  private guardar<T extends BufferGeometry | Material>(recurso: T): T {
    if ('isBufferGeometry' in recurso) this.geometrias.push(recurso as BufferGeometry);
    else this.materiais.push(recurso as Material);
    return recurso;
  }

  private criarAdesivo(lado: number, raio: number): ShapeGeometry {
    const s = lado / 2;
    const forma = new Shape();
    forma.moveTo(-s + raio, -s);
    forma.lineTo(s - raio, -s);
    forma.quadraticCurveTo(s, -s, s, -s + raio);
    forma.lineTo(s, s - raio);
    forma.quadraticCurveTo(s, s, s - raio, s);
    forma.lineTo(-s + raio, s);
    forma.quadraticCurveTo(-s, s, -s, s - raio);
    forma.lineTo(-s, -s + raio);
    forma.quadraticCurveTo(-s, -s, -s + raio, -s);
    return new ShapeGeometry(forma, 4);
  }
}
