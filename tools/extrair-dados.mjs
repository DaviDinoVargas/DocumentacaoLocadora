#!/usr/bin/env node
/**
 * Extrai os números e as tabelas da documentação diretamente do código-fonte e do material do TCC.
 * Nada aqui é digitado à mão: rode `npm run dados` para regenerar src/app/dados/*.json.
 *
 *   LOCADORA_FONTE  repositório do software (padrão A:/TCC/LocadoraDeVeiculos)
 *   LOCADORA_TCC    pasta com o material complementar (padrão A:/TCC)
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative, extname, basename, sep } from 'node:path';
import { execSync } from 'node:child_process';

const FONTE = process.env.LOCADORA_FONTE ?? 'A:/TCC/LocadoraDeVeiculos';
const TCC = process.env.LOCADORA_TCC ?? 'A:/TCC';
const SAIDA = new URL('../src/app/dados/', import.meta.url);
mkdirSync(SAIDA, { recursive: true });

const IGNORAR = new Set([
  'bin', 'obj', 'node_modules', '.angular', 'dist', '__pycache__', '.git', 'TestResults', '.venv', 'venv',
  'crops', '.vs', '.vscode', '.idea', 'certs', 'coverage', '.pytest_cache'
]);

function* arquivos(dir) {
  if (!existsSync(dir)) return;
  for (const nome of readdirSync(dir)) {
    if (IGNORAR.has(nome)) continue;
    const caminho = join(dir, nome);
    const st = statSync(caminho);
    if (st.isDirectory()) yield* arquivos(caminho);
    else yield caminho;
  }
}

const ler = (p) => readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
const rel = (p) => relative(FONTE, p).split(sep).join('/');
const linhasDeCodigo = (texto) => texto.split(/\r?\n/).filter((l) => l.trim() !== '').length;
const gravar = (nome, obj) => writeFileSync(new URL(nome, SAIDA), JSON.stringify(obj, null, 2) + '\n');
const somar = (xs, f = (x) => x) => xs.reduce((a, x) => a + f(x), 0);

// ---------------------------------------------------------------------------------------------
// 0. Metadados do repositório
// ---------------------------------------------------------------------------------------------
function git(cmd) {
  try {
    return execSync(`git -C "${FONTE}" ${cmd}`, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}
const meta = {
  geradoEm: new Date().toLocaleDateString('sv-SE'),
  branch: git('rev-parse --abbrev-ref HEAD'),
  commit: git('rev-parse --short HEAD'),
  commitsNoRepositorio: Number(git('rev-list --count HEAD')) || 0,
  arquivosRastreados: git('ls-files').split('\n').filter(Boolean).length,
  ultimoCommit: git('log -1 --format=%cs')
};

// ---------------------------------------------------------------------------------------------
// 1. Back-end: módulos × camadas
// ---------------------------------------------------------------------------------------------
const SERVER = join(FONTE, 'Server');
const NORMALIZAR_MODULO = {
  ModuloVeiculo: 'ModuloAutomovel',
  ModuloGrupoVeiculo: 'ModuloGrupoAutomovel',
  ModuloCliente: 'ModuloClientes'
};
const ROTULO_MODULO = {
  ModuloAluguel: 'Aluguel',
  ModuloAuditoria: 'Auditoria',
  ModuloAutenticacao: 'Autenticação',
  ModuloAutomovel: 'Automóvel',
  ModuloClientes: 'Clientes',
  ModuloCondutor: 'Condutor',
  ModuloConfiguracao: 'Configuração',
  ModuloCupom: 'Cupom',
  ModuloDashboard: 'Dashboard',
  ModuloDesafioCupom: 'Desafio de cupom',
  ModuloDevolucao: 'Devolução',
  ModuloFuncionario: 'Funcionário',
  ModuloGrupoAutomovel: 'Grupo de automóvel',
  ModuloParceiro: 'Parceiro',
  ModuloPlanoCobranca: 'Plano de cobrança',
  ModuloTaxaServico: 'Taxa de serviço'
};
const CONTROLLER_PARA_MODULO = {
  Aluguel: 'ModuloAluguel', Auditoria: 'ModuloAuditoria', Auth: 'ModuloAutenticacao', Automovel: 'ModuloAutomovel',
  Cliente: 'ModuloClientes', Condutor: 'ModuloCondutor', Configuracao: 'ModuloConfiguracao', Cupom: 'ModuloCupom',
  Dashboard: 'ModuloDashboard', DesafioCupom: 'ModuloDesafioCupom', Devolucao: 'ModuloDevolucao',
  Funcionario: 'ModuloFuncionario', GrupoAutomovel: 'ModuloGrupoAutomovel', Parceiro: 'ModuloParceiro',
  PlanoCobranca: 'ModuloPlanoCobranca', TaxaServico: 'ModuloTaxaServico'
};

const modulos = new Map();
const mod = (chave) => {
  if (!modulos.has(chave)) {
    modulos.set(chave, {
      chave, nome: ROTULO_MODULO[chave] ?? chave.replace('Modulo', ''),
      dominio: 0, aplicacao: 0, infraestrutura: 0, webapi: 0, testes: 0,
      arquivos: 0, comandos: 0, consultas: 0, validadores: 0, endpoints: 0
    });
  }
  return modulos.get(chave);
};

const camadas = { dominio: 0, aplicacao: 0, infraestrutura: 0, webapi: 0, testesUnidade: 0, testesIntegracao: 0, testesWebApi: 0, migrations: 0 };
const arquivosPorCamada = { dominio: 0, aplicacao: 0, infraestrutura: 0, webapi: 0, testesUnidade: 0, testesIntegracao: 0, testesWebApi: 0, migrations: 0 };
const testesCs = { unidade: 0, integracao: 0, webapi: 0, casosParametrizados: 0 };
const testesPorModulo = new Map();

for (const arq of arquivos(SERVER)) {
  if (extname(arq) !== '.cs') continue;
  const r = rel(arq);
  if (r.includes('.Designer.') || r.endsWith('AssemblyInfo.cs') || r.includes('/Properties/')) continue;
  const texto = ler(arq);
  const loc = linhasDeCodigo(texto);
  testesCs.casosParametrizados += (texto.match(/\[DataRow\(/g) ?? []).length;
  const partes = r.split('/');
  const projeto = partes[1];
  const moduloDir = partes.find((p) => p.startsWith('Modulo'));
  const chave = moduloDir ? (NORMALIZAR_MODULO[moduloDir] ?? moduloDir) : null;

  const cat = (c) => { camadas[c] += loc; arquivosPorCamada[c]++; };

  if (projeto === 'LocadoraDeVeiculos.Core.Dominio') {
    cat('dominio');
    if (chave) { mod(chave).dominio += loc; mod(chave).arquivos++; }
  } else if (projeto === 'LocadoraDeVeiculos.Core.Aplicacao') {
    cat('aplicacao');
    if (chave) {
      const m = mod(chave); m.aplicacao += loc; m.arquivos++;
      m.comandos += (texto.match(/\brecord\s+\w+(Command)\b|\bclass\s+\w+Command\b\s*:\s*IRequest/g) ?? []).length;
      m.consultas += (texto.match(/\brecord\s+\w+Query\b|\bclass\s+\w+Query\b\s*:\s*IRequest/g) ?? []).length;
      m.validadores += (texto.match(/:\s*AbstractValidator</g) ?? []).length;
    }
  } else if (projeto === 'LocadoraDeVeiculos.Infraestrutura.Orm') {
    if (r.includes('/Migrations/')) cat('migrations');
    else {
      cat('infraestrutura');
      if (chave) { mod(chave).infraestrutura += loc; mod(chave).arquivos++; }
    }
  } else if (projeto === 'web-api') {
    cat('webapi');
    if (chave) { mod(chave).webapi += loc; mod(chave).arquivos++; }
    const m = basename(arq).match(/^(\w+)Controller\.cs$/);
    if (m && CONTROLLER_PARA_MODULO[m[1]]) { mod(CONTROLLER_PARA_MODULO[m[1]]).webapi += loc; mod(CONTROLLER_PARA_MODULO[m[1]]).arquivos++; }
  } else if (projeto === 'LocadoraDeVeiculos.Testes.Unidade') {
    cat('testesUnidade');
    testesCs.unidade += (texto.match(/\[TestMethod/g) ?? []).length;
    if (chave) mod(chave).testes += (texto.match(/\[TestMethod/g) ?? []).length;
  } else if (projeto === 'LocadoraDeVeiculos.Tests.Integracao') {
    cat('testesIntegracao');
    testesCs.integracao += (texto.match(/\[TestMethod/g) ?? []).length;
    if (chave) mod(chave).testes += (texto.match(/\[TestMethod/g) ?? []).length;
  } else if (projeto === 'LocadoraDeVeiculos.Tests.WebApi') {
    cat('testesWebApi');
    testesCs.webapi += (texto.match(/\[TestMethod/g) ?? []).length;
  }
}

// Testes de unidade por arquivo/área (para o gráfico de qualidade)
const testesPorArea = [];
for (const arq of arquivos(SERVER)) {
  if (extname(arq) !== '.cs') continue;
  const r = rel(arq);
  const n = (ler(arq).match(/\[TestMethod/g) ?? []).length;
  if (!n) continue;
  const projeto = r.split('/')[1];
  testesPorArea.push({ projeto: projeto.replace('LocadoraDeVeiculos.', ''), arquivo: basename(arq, '.cs'), testes: n });
}

// ---------------------------------------------------------------------------------------------
// 2. Endpoints da Web API (.NET)
// ---------------------------------------------------------------------------------------------
const CONTROLLERS = join(SERVER, 'web-api', 'Controllers');
const endpoints = [];

function papeisDe(attrs) {
  // devolve null (sem [Authorize]), [] (autenticado qualquer papel) ou ['Empresa', ...]
  const a = attrs.find((x) => /^\[Authorize/.test(x));
  if (!a) return null;
  const m = a.match(/Roles\s*=\s*"([^"]+)"/);
  return m ? m[1].split(',').map((s) => s.trim()) : [];
}

for (const arq of readdirSync(CONTROLLERS)) {
  if (!arq.endsWith('Controller.cs')) continue;
  const linhas = ler(join(CONTROLLERS, arq)).split(/\r?\n/);
  const ctrl = arq.replace('Controller.cs', '');
  let pendentes = [];
  let classe = { attrs: [], rota: '' };
  let dentroDaClasse = false;

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i].trim();
    if (l.startsWith('[')) { pendentes.push(l); continue; }
    if (/\bclass\s+\w+/.test(l) && !dentroDaClasse) {
      dentroDaClasse = true;
      classe.attrs = pendentes;
      const r = pendentes.find((x) => x.startsWith('[Route'));
      classe.rota = r ? r.match(/"([^"]*)"/)?.[1] ?? '' : '';
      pendentes = [];
      continue;
    }
    if (dentroDaClasse && /^public\s+.*\(/.test(l) && pendentes.some((x) => /^\[Http(Get|Post|Put|Delete|Patch)/.test(x))) {
      const h = pendentes.find((x) => /^\[Http(Get|Post|Put|Delete|Patch)/.test(x));
      const verbo = h.match(/Http(\w+)/)[1].toUpperCase();
      const sub = h.match(/\("([^"]*)"/)?.[1] ?? '';
      const nome = l.match(/(\w+)\s*\(/)?.[1] ?? '';
      const rota = '/' + [classe.rota, sub].filter(Boolean).join('/').replace(/\/+/g, '/').replace(/^\//, '');
      const anonimo = pendentes.some((x) => x.startsWith('[AllowAnonymous]'));
      const limite = pendentes.find((x) => x.startsWith('[EnableRateLimiting'))?.match(/"?([\w.]+)"?\)/)?.[1]
        ?? classe.attrs.find((x) => x.startsWith('[EnableRateLimiting'))?.match(/"([\w.]+)"/)?.[1] ?? '';

      const pc = papeisDe(classe.attrs);
      const pm = papeisDe(pendentes);
      let papel;
      if (anonimo || (pc === null && pm === null)) papel = 'Público';
      else {
        // os [Authorize] da classe e do método se somam (interseção dos papéis)
        const conj = [pc, pm].filter((x) => x !== null);
        const comPapel = conj.filter((x) => x.length > 0);
        if (comPapel.length === 0) papel = 'Autenticado';
        else papel = comPapel.reduce((a, b) => a.filter((x) => b.includes(x))).join(' e ').replace('Funcionario', 'Funcionário') || '—';
      }
      endpoints.push({
        controller: ctrl, modulo: ROTULO_MODULO[CONTROLLER_PARA_MODULO[ctrl]] ?? ctrl,
        metodo: verbo, rota, acao: nome, papel, limite: limite === 'auth' ? 'auth (10/min/IP)' : /registro/i.test(limite) ? 'registro (5/h/IP)' : limite
      });
      pendentes = [];
      continue;
    }
    if (l !== '' && !l.startsWith('//') && !l.startsWith('///')) pendentes = [];
  }
}
for (const e of endpoints) mod(CONTROLLER_PARA_MODULO[e.controller]).endpoints++;

// ---------------------------------------------------------------------------------------------
// 3. Domínio: entidades e migrations
// ---------------------------------------------------------------------------------------------
const entidades = [];
const DOMINIO = join(SERVER, 'LocadoraDeVeiculos.Core.Dominio');
for (const arq of arquivos(DOMINIO)) {
  if (extname(arq) !== '.cs') continue;
  const nome = basename(arq, '.cs');
  if (nome.startsWith('I') && /^I[A-Z]/.test(nome)) continue;
  const texto = ler(arq);
  const moduloDir = rel(arq).split('/').find((p) => p.startsWith('Modulo'));
  if (!moduloDir) continue;
  const temClasse = /\b(?:public|internal)\s+(?:abstract\s+|sealed\s+)*(?:class|record)\s+\w+/.test(texto);
  const ehEnum = /\benum\s+\w+/.test(texto) && !temClasse;
  const props = [...texto.matchAll(/public\s+(?!class|enum|record|interface|static|override|virtual\s+void)([\w<>\[\]?,\s]+?)\s+(\w+)\s*\{\s*get;/g)].map((m) => m[2]);
  const metodos = [...texto.matchAll(/public\s+(?!class|enum|record|interface)(?:static\s+)?(?:override\s+)?[\w<>\[\]?,]+\s+(\w+)\s*\([^)]*\)\s*(?:\{|=>)/g)]
    .map((m) => m[1]).filter((n) => n !== nome);
  const valoresDeEnum = ehEnum ? [...texto.matchAll(/^\s*([A-Z]\w*)\s*=\s*\d+/gm)].length : 0;
  if (!ehEnum && !temClasse) continue;
  entidades.push({
    nome, modulo: ROTULO_MODULO[NORMALIZAR_MODULO[moduloDir] ?? moduloDir] ?? moduloDir, tipo: ehEnum ? 'enum' : 'entidade',
    propriedades: ehEnum ? valoresDeEnum : props.length,
    metodos: metodos.length,
    loc: linhasDeCodigo(texto)
  });
}

const migrations = readdirSync(join(SERVER, 'LocadoraDeVeiculos.Infraestrutura.Orm', 'Migrations'))
  .filter((f) => /^\d{14}_\w+\.cs$/.test(f))
  .map((f) => ({
    data: `${f.slice(0, 4)}-${f.slice(4, 6)}-${f.slice(6, 8)}`,
    nome: f.slice(15, -3)
  }));

// ---------------------------------------------------------------------------------------------
// 4. Front-end Angular
// ---------------------------------------------------------------------------------------------
const CLIENT = join(FONTE, 'Client');
const APP = join(CLIENT, 'src', 'app');
const front = new Map();
const frontTotal = { arquivos: 0, loc: 0, specs: 0, locSpecs: 0, testes: 0, componentes: 0 };

function areaDoFront(r) {
  // r = caminho relativo a Client/src/app
  const p = r.split('/');
  if (p[0] === 'Components') return p[1] && !p[1].includes('.') ? `Components/${p[1]}` : '(app)';
  if (p[0] === 'shared') return `shared/${p[1] && !p[1].includes('.') ? p[1] : '(raiz)'}`;
  if (p[0] === 'core' || p[0] === 'auth') return p[0];
  return '(app)';
}

for (const arq of arquivos(APP)) {
  const ext = extname(arq);
  if (!['.ts', '.html', '.scss', '.css'].includes(ext)) continue;
  const r = relative(APP, arq).split(sep).join('/');
  if (r.startsWith('shared/ui/')) continue; // código gerado pelo CLI do Spartan: contado à parte
  const texto = ler(arq);
  const loc = linhasDeCodigo(texto);
  const ehSpec = r.endsWith('.spec.ts');
  const area = areaDoFront(r);
  if (!front.has(area)) front.set(area, { area, arquivos: 0, loc: 0, componentes: 0, specs: 0, testes: 0 });
  const a = front.get(area);
  a.arquivos++; a.loc += ehSpec ? 0 : loc;
  frontTotal.arquivos++;
  if (ehSpec) {
    a.specs++; a.testes += (texto.match(/\bit\(/g) ?? []).length;
    frontTotal.specs++; frontTotal.locSpecs += loc; frontTotal.testes += (texto.match(/\bit\(/g) ?? []).length;
  } else {
    frontTotal.loc += loc;
    if (/@Component\(/.test(texto)) { a.componentes++; frontTotal.componentes++; }
  }
}

let locUiGerado = 0, arquivosUiGerado = 0;
for (const arq of arquivos(join(APP, 'shared', 'ui'))) {
  if (extname(arq) === '.ts') { locUiGerado += linhasDeCodigo(ler(arq)); arquivosUiGerado++; }
}

// Rotas: cada item de `routes` é uma chamada protegida()/formulario() ou um objeto { path: ... }
const rotasTexto = ler(join(APP, 'app.routes.ts')).split('export const routes')[1];
const rotas = [];
function itensDeRotas(texto) {
  const itens = [];
  let i = 0;
  while (i < texto.length) {
    const m = /(?:protegida|formulario)\(|\{\s*path:/.exec(texto.slice(i));
    if (!m) break;
    const ini = i + m.index;
    const abre = m[0].startsWith('{') ? '{' : '(';
    const fecha = abre === '(' ? ')' : '}';
    let prof = 0, j = abre === '{' ? ini : ini + m[0].length - 1, aspas = null;
    for (; j < texto.length; j++) {
      const c = texto[j];
      if (aspas) { if (c === aspas && texto[j - 1] !== '\\') aspas = null; continue; }
      if (c === "'" || c === '"' || c === '`') { aspas = c; continue; }
      if (c === abre || c === '(' || c === '{' || c === '[') prof++;
      if (c === fecha || c === ')' || c === '}' || c === ']') { prof--; if (prof === 0) break; }
    }
    itens.push(texto.slice(ini, j + 1));
    i = j + 1;
  }
  return itens;
}
for (const item of itensDeRotas(rotasTexto)) {
  const publica = item.startsWith('{');
  const caminho = item.match(/'([^']*)'/)?.[1];
  if (caminho === undefined || item.includes('redirectTo')) continue;
  const papeis = /SOMENTE_EMPRESA/.test(item) ? 'Empresa' : /EMPRESA_E_FUNCIONARIO/.test(item) ? 'Empresa e Funcionário' : 'Público';
  let titulo = item.match(/title:\s*'([^']+)'/)?.[1];
  if (!titulo && item.startsWith('formulario')) titulo = [...item.matchAll(/'([^']+)'/g)].map((m) => m[1]).pop();
  rotas.push({
    caminho: '/' + caminho, titulo: titulo ?? '', papeis,
    tipo: publica ? 'Pública' : item.startsWith('formulario') ? 'Formulário' : 'Tela',
    parametrizada: caminho.includes(':')
  });
}

// Blocos compartilhados
const compartilhados = [];
for (const arq of arquivos(join(APP, 'shared'))) {
  if (!arq.endsWith('.component.ts')) continue;
  const t = ler(arq);
  const sel = t.match(/selector:\s*'(app-[^']+)'/)?.[1];
  if (sel) compartilhados.push({ seletor: sel, arquivo: rel(arq).replace('Client/src/app/', ''), loc: linhasDeCodigo(t) });
}

// ---------------------------------------------------------------------------------------------
// 5. Serviço de ML (Python)
// ---------------------------------------------------------------------------------------------
const ML = join(FONTE, 'MachineLeaning');
const mlAreas = new Map();
const mlTestes = [];
let mlTotal = { arquivos: 0, loc: 0, testes: 0, locTestes: 0 };
for (const arq of arquivos(ML)) {
  if (extname(arq) !== '.py') continue;
  const r = relative(ML, arq).split(sep).join('/');
  const texto = ler(arq);
  const loc = linhasDeCodigo(texto);
  const top = r.includes('/') ? r.split('/')[0] : '(raiz)';
  if (top === 'tests') {
    const n = (texto.match(/^\s*(?:async\s+)?def test_/gm) ?? []).length;
    mlTotal.testes += n; mlTotal.locTestes += loc;
    mlTestes.push({ arquivo: basename(arq, '.py').replace(/^test_/, ''), testes: n });
    continue;
  }
  if (!mlAreas.has(top)) mlAreas.set(top, { area: top, arquivos: 0, loc: 0 });
  const a = mlAreas.get(top); a.arquivos++; a.loc += loc;
  mlTotal.arquivos++; mlTotal.loc += loc;
}

// Rotas do ML
const mlEndpoints = [];
const mlRoteadores = [
  ['yolo_tesseract/router.py', 'Câmeras e placas'],
  ['FaceAuth/router.py', 'Reconhecimento facial'],
  ['ChatBot/router.py', 'Assistente']
];
for (const [arq, grupo] of mlRoteadores) {
  const t = ler(join(ML, arq));
  const prefixo = t.match(/APIRouter\([^)]*prefix="([^"]+)"/)?.[1] ?? '';
  const exigeInterno = /exigir_token_interno/.test(t.split('\n').find((l) => l.includes('router = APIRouter')) ?? '');
  const bloco = t.match(/router = APIRouter\([\s\S]*?\)\)?\n/)?.[0] ?? '';
  const auth = /exigir_token_interno/.test(bloco) ? 'Token interno (somente a Web API)'
    : /exigir_dono_das_cameras/.test(bloco) ? 'JWT + dono das câmeras' : 'JWT (via Web API)';
  for (const m of t.matchAll(/@(router|stream_router)\.(get|post|put|delete)\("([^"]+)"([^\n]*)\n/g)) {
    const ticket = m[1] === 'stream_router';
    const lim = m[4].match(/limitar\("(\w+)",\s*maximo=(\d+),\s*janela_s=(\d+)/);
    mlEndpoints.push({
      grupo, metodo: m[2].toUpperCase(), rota: prefixo + m[3],
      acesso: ticket ? 'Ticket de uso único' : (exigeInterno ? 'Token interno' : auth),
      limite: lim ? `${lim[2]}/${lim[3]}s` : ''
    });
  }
}
mlEndpoints.push({ grupo: 'Saúde', metodo: 'GET', rota: '/', acesso: 'Público', limite: '' });
mlEndpoints.push({ grupo: 'Saúde', metodo: 'GET', rota: '/health', acesso: 'Público (resumido fora de dev)', limite: '' });

// ---------------------------------------------------------------------------------------------
// 6. Dependências
// ---------------------------------------------------------------------------------------------
const pkg = JSON.parse(ler(join(CLIENT, 'package.json')));
const npm = {
  producao: Object.entries(pkg.dependencies).map(([nome, versao]) => ({ nome, versao })),
  desenvolvimento: Object.entries(pkg.devDependencies).map(([nome, versao]) => ({ nome, versao }))
};

const nuget = [];
for (const arq of arquivos(SERVER)) {
  if (!arq.endsWith('.csproj')) continue;
  const t = ler(arq);
  const projeto = basename(arq, '.csproj').replace('LocadoraDeVeiculos.', '');
  const alvo = t.match(/<TargetFramework>([^<]+)</)?.[1] ?? '';
  const pacotes = [...t.matchAll(/<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"/g)].map((m) => ({ nome: m[1], versao: m[2] }));
  nuget.push({ projeto, alvo, pacotes });
}

const pip = ler(join(ML, 'requirements.txt')).split(/\r?\n/)
  .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  .map((l) => { const [nome, versao] = l.split('=='); return { nome: nome.replace(/\[.*\]/, ''), versao: versao ?? '' }; });
const pipDev = existsSync(join(ML, 'requirements-dev.txt'))
  ? ler(join(ML, 'requirements-dev.txt')).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !l.startsWith('-r'))
    .map((l) => { const [nome, versao] = l.split('=='); return { nome, versao: versao ?? '' }; })
  : [];
const pipTravados = existsSync(join(ML, 'requirements.lock.txt'))
  ? (ler(join(ML, 'requirements.lock.txt')).match(/^[A-Za-z0-9_.\-\[\]]+==/gm) ?? []).length : 0;

// ---------------------------------------------------------------------------------------------
// 7. Variáveis de ambiente
// ---------------------------------------------------------------------------------------------
const variaveis = new Map();
const marcar = (nome, onde, comp) => {
  if (!/^[A-Z][A-Z0-9_]{2,}$|^[A-Z][A-Za-z]+:[A-Za-z]+$/.test(nome)) return;
  const v = variaveis.get(nome) ?? { nome, componentes: new Set(), arquivos: new Set() };
  v.componentes.add(comp); v.arquivos.add(onde);
  variaveis.set(nome, v);
};
for (const arq of arquivos(SERVER)) {
  if (extname(arq) !== '.cs' || arq.includes('Migrations') || /Tests?\./.test(rel(arq).split('/')[1] ?? '')) continue;
  const t = ler(arq);
  for (const m of t.matchAll(/(?:configuration|config|Configuration)\["([A-Z][A-Z0-9_]+)"\]/g)) marcar(m[1], rel(arq), 'Web API');
  for (const m of t.matchAll(/(?:LerInteiroPositivo|LerInteiro|LerBooleano)\(\w+,\s*"([A-Z][A-Z0-9_]+)"/g)) marcar(m[1], rel(arq), 'Web API');
  for (const m of t.matchAll(/GetEnvironmentVariable\("([A-Z][A-Z0-9_]+)"\)/g)) marcar(m[1], rel(arq), 'Web API');
  for (const m of t.matchAll(/ChaveDeConfiguracao\s*=\s*"([A-Za-z0-9_:]+)"/g)) marcar(m[1], rel(arq), 'Web API');
  for (const m of t.matchAll(/configuration\["(MlApi:[A-Za-z]+)"\]/g)) marcar(m[1], rel(arq), 'Web API');
}
for (const arq of arquivos(ML)) {
  if (extname(arq) !== '.py' || rel(arq).includes('/tests/') || rel(arq).includes('/tools/')) continue;
  const t = ler(arq);
  for (const m of t.matchAll(/(?:environ\.get|env\.get|getenv)\(\s*['"]([A-Z][A-Z0-9_]+)['"]/g)) marcar(m[1], rel(arq), 'Serviço de ML');
}
const variaveisLista = [...variaveis.values()].map((v) => ({
  nome: v.nome, componentes: [...v.componentes].sort(), arquivos: [...v.arquivos].sort()
})).sort((a, b) => a.componentes.join().localeCompare(b.componentes.join()) || a.nome.localeCompare(b.nome));

// ---------------------------------------------------------------------------------------------
// 8. Segurança: relatório + bateria de ataques + medições do LFW
// ---------------------------------------------------------------------------------------------
// Os 35 itens (S1–S35) são curados em src/app/dados/seguranca-itens.ts a partir do RELATORIO_SEGURANCA.md.

// Última rodada de ataques
const resultadosDir = join(TCC, 'Seguranca-Resultados');
let rodada = null;
if (existsSync(resultadosDir)) {
  const pastas = readdirSync(resultadosDir).filter((n) => /^\d{4}-\d{2}-\d{2}_\d{6}_/.test(n)).sort();
  const modoDe = (p) => {
    try { return JSON.parse(ler(join(resultadosDir, p, 'resultado.json'))).info?.modo; } catch { return null; }
  };
  const ultima = pastas.filter((p) => !p.includes('_zap_') && modoDe(p) === 'tudo').pop() ?? pastas[pastas.length - 1];
  const verif = JSON.parse(ler(join(resultadosDir, ultima, 'resultado.json')));
  const lista = verif.verificacoes ?? verif;
  const porCategoria = {};
  for (const v of lista) {
    const c = (porCategoria[v.categoria] ??= { categoria: v.categoria, total: 0, aprovadas: 0, reprovadas: 0, informativas: 0 });
    c.total++;
    if (v.informativo || v.pendente) c.informativas++;
    else if (v.passou) c.aprovadas++;
    else c.reprovadas++;
  }
  const evolucao = pastas.map((p) => {
    try {
      const r = JSON.parse(ler(join(resultadosDir, p, 'resultado.json')));
      const l = r.verificacoes ?? r;
      const ok = l.filter((v) => v.passou && !v.informativo).length;
      const falha = l.filter((v) => !v.passou && !v.informativo && !v.pendente).length;
      return { rodada: p, commit: p.split('_')[2], aprovadas: ok, reprovadas: falha, total: l.length };
    } catch { return null; }
  }).filter(Boolean);
  rodada = {
    pasta: ultima, commit: ultima.split('_')[2], total: lista.length,
    info: verif.info ? { data: verif.info.data, commit: verif.info.commit, modo: verif.info.modo, python: verif.info.python } : null,
    carga: (verif.carga?.medicoes ?? []).map((m) => ({ cenario: m.cenario, concorrencia: m.concorrencia, requisicoes: m.requisicoes, rps: m.rps, p50: m.p50_ms, p95: m.p95_ms, p99: m.p99_ms, max: m.max_ms, erros5xx: m.erros_5xx, falhasConexao: m.falhas_conexao })),
    aprovadas: lista.filter((v) => v.passou && !v.informativo).length,
    reprovadas: lista.filter((v) => !v.passou && !v.informativo && !v.pendente).length,
    informativas: lista.filter((v) => v.informativo || v.pendente).length,
    porCategoria: Object.values(porCategoria),
    porSeveridade: Object.entries(lista.reduce((a, v) => { a[v.severidade ?? 'n/d'] = (a[v.severidade ?? 'n/d'] ?? 0) + 1; return a; }, {})).map(([severidade, total]) => ({ severidade, total })),
    verificacoes: lista.map((v) => ({ id: v.id, categoria: v.categoria, titulo: v.id === 'A16' ? 'Pendência conhecida do fluxo de cadastro (evolução prevista)' : v.titulo, severidade: v.severidade ?? '', ref: v.ref ?? '', resultado: v.informativo || v.pendente ? 'Informativa' : v.passou ? 'Aprovada' : 'Reprovada' })),
    memoriaApiMb: verif.carga?.memoria_api_mb ?? null,
    destaques: Object.fromEntries(lista.filter((v) => /^(J\d+|K\d+|L0[0-9]|M\d+|N\d+|O\d+)$/.test(v.id) || ['L06', 'L07', 'L08', 'L09'].includes(v.id)).map((v) => [`${v.categoria}|${v.id}`, String(v.obtido ?? '')])),
    evolucao
  };
}

// LFW
let lfw = null;
const lfwEmb = join(resultadosDir, 'lfw-embedding', 'lfw_embedding.json');
const lfwGeo = join(resultadosDir, 'lfw-completo', 'lfw_resultado.json');
if (existsSync(lfwEmb)) {
  const e = JSON.parse(ler(lfwEmb));
  const g = existsSync(lfwGeo) ? JSON.parse(ler(lfwGeo)) : null;
  lfw = {
    metodo: e.metodo, paresMedidos: e.pares_medidos,
    acuracia: e.acuracia_protocolo_10_dobras.media, desvio: e.acuracia_protocolo_10_dobras.desvio,
    eer: e.EER,
    limiares: [
      { rotulo: 'FAR 1 %', ...e['limiar_para_FAR_1%'] },
      { rotulo: 'FAR 0,1 %', ...e['limiar_para_FAR_0.1%'] },
      { rotulo: 'FAR 0,01 %', ...e['limiar_para_FAR_0.01%'] },
      { rotulo: 'Recomendado (0,363)', limiar: 0.363, FAR: e.limiar_recomendado_pelo_OpenCV_0_363?.FAR ?? e['limiar_recomendado_pelo_OpenCV_0.363']?.FAR, FRR: e['limiar_recomendado_pelo_OpenCV_0.363']?.FRR }
    ],
    cossenoIguais: e.cosseno_medio_iguais, cossenoDiferentes: e.cosseno_medio_diferentes,
    anterior: e.comparador_anterior_geometria_landmarks,
    curva: e.curva.filter((_, i) => i % 4 === 0).map((c) => ({ limiar: c.limiar, FAR: c.FAR, FRR: c.FRR })),
    provaDeVida: g ? {
      imagens: g.imagens,
      recusadasLimiar05: g.prova_de_vida_em_fotos_reais_por_margem?.['0.0']?.recusadas_no_limiar_0_5 ?? g.prova_de_vida_em_fotos_reais_por_margem?.['0.0']?.['recusadas_no_limiar_0.5'],
      mediaPontuacao: g.prova_de_vida_em_fotos_reais_por_margem?.['0.0']?.media
    } : null
  };
}

// ---------------------------------------------------------------------------------------------
// 9. Material complementar (LaTeX): capítulos, tabelas de métricas, referências
// ---------------------------------------------------------------------------------------------
const latexDir = join(TCC, 'Apresentação', 'fonte-latex');
const capitulos = [];
if (existsSync(latexDir)) {
  for (const f of readdirSync(latexDir).filter((n) => /^cap\d+/.test(n)).sort()) {
    const t = ler(join(latexDir, f));
    capitulos.push({
      arquivo: f,
      titulo: t.match(/\\chapter\{([^}]+)\}/)?.[1] ?? f,
      secoes: [...t.matchAll(/\\section\{([^}]+)\}/g)].map((m) => m[1].replace(/\\texttt\{([^}]*)\}/g, '$1').replace(/\\emph\{([^}]*)\}/g, '$1')),
      linhas: t.split('\n').length
    });
  }
}

// ---------------------------------------------------------------------------------------------
// 10. Arquitetura do repositório (tamanho por componente)
// ---------------------------------------------------------------------------------------------
const tamanhos = {
  backend: somar(['dominio', 'aplicacao', 'infraestrutura', 'webapi'], (k) => camadas[k]),
  frontend: frontTotal.loc,
  ml: mlTotal.loc,
  testes: camadas.testesUnidade + camadas.testesIntegracao + camadas.testesWebApi + frontTotal.locSpecs + mlTotal.locTestes,
  ataques: 0
};
for (const arq of arquivos(join(FONTE, 'Testes-Seguranca'))) if (extname(arq) === '.py') tamanhos.ataques += linhasDeCodigo(ler(arq));

const docs = [];
for (const arq of arquivos(join(FONTE, 'docs'))) docs.push({ arquivo: basename(arq), linhas: ler(arq).split('\n').length });

// ---------------------------------------------------------------------------------------------
// 11. Tokens de design (src/styles.css do software)
// ---------------------------------------------------------------------------------------------
const css = ler(join(CLIENT, 'src', 'styles.css'));
function bloco(seletor) {
  const i = css.indexOf(seletor + ' {');
  if (i < 0) return '';
  let prof = 0, j = css.indexOf('{', i);
  const ini = j + 1;
  for (; j < css.length; j++) {
    if (css[j] === '{') prof++;
    if (css[j] === '}') { prof--; if (prof === 0) break; }
  }
  return css.slice(ini, j);
}
function lerVariaveisCss(texto) {
  const mapa = {};
  for (const m of texto.matchAll(/(--[\w-]+):\s*([^;]+);/g)) mapa[m[1]] = m[2].trim();
  return mapa;
}
const raiz = lerVariaveisCss(bloco(':root'));
const escuro = lerVariaveisCss(bloco('.dark'));
const papeisCor = Object.keys(raiz).filter((k) => /^--(md-|success|on-success|warning|on-warning)/.test(k));
const semanticas = Object.entries(raiz).filter(([k, v]) => /^--(background|foreground|card|popover|primary|secondary|muted|accent|destructive|border|input|ring)/.test(k) && v.startsWith('var('));
const tipografia = [...css.matchAll(/@utility (text-(?:headline|title|body|label)-[lms])\s*\{\s*font-size:\s*([\d.]+)rem;\s*line-height:\s*([\d.]+)rem;\s*font-weight:\s*(\d+)/g)]
  .map((m) => ({ classe: m[1], tamanho: Number(m[2]) * 16, linha: Number(m[3]) * 16, peso: Number(m[4]) }));
const tokens = {
  arquivo: 'Client/src/styles.css',
  cores: papeisCor.map((k) => ({ token: k, claro: raiz[k], escuro: escuro[k] ?? '' })),
  semanticas: semanticas.map(([k, v]) => ({ variavel: k, papel: v.replace(/var\((--[\w-]+)\)/, '$1') })),
  grafico: Object.entries(raiz).filter(([k]) => /^--chart-\d/.test(k)).map(([k, v]) => ({ token: k, valor: v.replace(/var\((--[\w-]+)\)/, '$1') })),
  tipografia,
  raio: raiz['--radius'],
  movimento: Object.entries(raiz).filter(([k]) => /^--ease-/.test(k)).map(([k, v]) => ({ token: k, curva: v })),
  fonte: 'Inter Variable'
};

// ---------------------------------------------------------------------------------------------
// 12. Métricas de front-end, cobertura, mutação, reflexão e ZAP (pastas de resultados fora do repositório)
// ---------------------------------------------------------------------------------------------
const metricasDir = join(TCC, 'Metricas-Resultados');
const subpastas = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory()).sort() : [];
const lerJsonl = (p) => (existsSync(p) ? ler(p).split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)) : []);
const ultimaCom = (dir, relativo) => subpastas(dir).filter((n) => existsSync(join(dir, n, relativo))).pop();

const metricas = { lighthouse: null, e2e: null, pacote: null, placa: null, cobertura: null, mutacao: null, reflexao: null };

{
  const pasta = ultimaCom(metricasDir, 'lighthouse/lighthouse.json');
  if (pasta) {
    const j = JSON.parse(ler(join(metricasDir, pasta, 'lighthouse', 'lighthouse.json')));
    metricas.lighthouse = {
      commit: j.meta.commit,
      versao: j.meta.lighthouse,
      rodadas: j.resultados[0]?.rodadas ?? 0,
      telas: j.resultados.map((r) => ({ tela: r.tela, formato: r.formato, ...r.mediana }))
    };
  }
}
{
  const pasta = ultimaCom(metricasDir, 'e2e/playwright.json');
  if (pasta) {
    const pw = JSON.parse(ler(join(metricasDir, pasta, 'e2e', 'playwright.json')));
    metricas.e2e = {
      commit: pasta.split('_')[2],
      aprovados: pw.stats.expected,
      reprovados: pw.stats.unexpected,
      duracaoS: Math.round(pw.stats.duration / 1000),
      tarefas: lerJsonl(join(metricasDir, pasta, 'e2e', 'tarefas.jsonl')).map((t) => ({
        tarefa: t.tarefa, tempoS: Number((t.tempo_ms / 1000).toFixed(1)), cliques: t.cliques, preenchimentos: t.preenchimentos, erro: t.erro
      })),
      acessibilidade: lerJsonl(join(metricasDir, pasta, 'e2e', 'acessibilidade.jsonl')).map((a) => ({ pagina: a.pagina, violacoes: a.violacoes }))
    };
  }
}
{
  const pasta = ultimaCom(metricasDir, 'pacote.md');
  if (pasta) {
    const t = ler(join(metricasDir, pasta, 'pacote.md'));
    const linhas = [...t.matchAll(/\|\s*(Inicial[^|]*|Sob demanda[^|]*|Total)\s*\|\s*(\d+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/g)];
    metricas.pacote = linhas.map((m) => ({ parte: m[1].trim(), arquivos: Number(m[2]), brutoKb: Number(m[3]), gzipKb: Number(m[4]) }));
  }
}
{
  const pasta = ultimaCom(metricasDir, 'ml/leitura_placa.json');
  if (pasta) {
    const j = JSON.parse(ler(join(metricasDir, pasta, 'ml', 'leitura_placa.json')));
    metricas.placa = { quantidade: j.quantidade, tesseract: j.tesseract, p50: j.p50_ms, p95: j.p95_ms, max: j.max_ms };
  }
}
{
  const pastaCob = subpastas(metricasDir).filter((n) => n.startsWith('cobertura-')).pop();
  if (pastaCob) {
    const base = join(metricasDir, pastaCob);
    const dotnet = subpastas(base).filter((n) => n.startsWith('dotnet') && existsSync(join(base, n, 'relatorio.md'))).pop();
    const cobertura = { medidoEm: pastaCob.replace('cobertura-', ''), dotnet: null, angular: null };
    if (dotnet) {
      const t = ler(join(base, dotnet, 'relatorio.md'));
      const tot = t.match(/Total:\s*([\d.]+)\s*%\*\*\s*\((\d+) de (\d+)/);
      const assemblies = [...t.matchAll(/\|\s*LocadoraDeVeiculos\.([\w.]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([\d.]+)\s*\|/g)]
        .map((m) => ({ nome: m[1], linhas: Number(m[2]), cobertas: Number(m[3]), pct: Number(m[4]) }));
      if (tot) cobertura.dotnet = { pct: Number(tot[1]), cobertas: Number(tot[2]), linhas: Number(tot[3]), assemblies };
    }
    const resumoAngular = join(base, 'angular', 'coverage-summary.json');
    if (existsSync(resumoAngular)) {
      const l = JSON.parse(ler(resumoAngular)).total.lines;
      cobertura.angular = { pct: l.pct, cobertas: l.covered, linhas: l.total };
    }
    metricas.cobertura = cobertura;

    const pastaMut = subpastas(base).filter((n) => n.startsWith('mutacao-negocio')).pop();
    if (pastaMut) {
      const m = JSON.parse(ler(join(base, pastaMut, 'reports', 'mutation-report.json')));
      const contar = (mutantes) => {
        const c = { mortos: 0, sobreviveram: 0, semCobertura: 0 };
        for (const x of mutantes) {
          if (x.status === 'Killed' || x.status === 'Timeout') c.mortos++;
          else if (x.status === 'Survived') c.sobreviveram++;
          else if (x.status === 'NoCoverage') c.semCobertura++;
        }
        return c;
      };
      const porArquivo = Object.entries(m.files).map(([arq, v]) => ({ arquivo: basename(arq.replace(/\\/g, '/')), ...contar(v.mutants) }))
        .map((a) => ({ ...a, total: a.mortos + a.sobreviveram + a.semCobertura }))
        .filter((a) => a.total > 0)
        .map((a) => ({ ...a, pct: Math.round((a.mortos / a.total) * 100) }));
      const geral = contar(Object.values(m.files).flatMap((v) => v.mutants));
      const total = geral.mortos + geral.sobreviveram + geral.semCobertura;
      metricas.mutacao = { ...geral, total, pct: Number(((geral.mortos / total) * 100).toFixed(1)), arquivos: porArquivo.sort((a, b) => a.pct - b.pct) };
    }
  }
}
{
  const pasta = subpastas(metricasDir).filter((n) => n.startsWith('reflexao-') && existsSync(join(metricasDir, n, 'endpoints.json'))).pop();
  if (pasta) {
    const linhas = JSON.parse(ler(join(metricasDir, pasta, 'endpoints.json')));
    metricas.reflexao = linhas.map((e) => ({
      verbo: e.Verbo, rota: e.rota, acao: e.acao, acesso: e.acesso, limite: e.LimiteDeTaxa ?? '', cabecalho: Boolean(e.ExigeCabecalhoCliente)
    }));
  }
}

{
  const contar = (rel) => {
    const f = join(FONTE, rel);
    return existsSync(f) ? (ler(f).match(/\[TestMethod/g) ?? []).length : 0;
  };
  metricas.reflexaoTestes = {
    endpointsEPapeis: contar('Server/LocadoraDeVeiculos.Tests.WebApi/ReflexaoDeSegurancaTests.cs'),
    comandosSerializados: contar('Server/LocadoraDeVeiculos.Testes.Unidade/Seguranca/ComandosSerializadosPorReflexaoTests.cs')
  };
}

// OWASP ZAP: última varredura completa
let zap = null;
if (existsSync(resultadosDir)) {
  const pasta = readdirSync(resultadosDir).filter((n) => n.includes('_zap_') && existsSync(join(resultadosDir, n, 'resumo-zap.md'))).sort().pop();
  if (pasta) {
    const resumo = ler(join(resultadosDir, pasta, 'resumo-zap.md'));
    const r = JSON.parse(ler(join(resultadosDir, pasta, 'resultado.json')));
    const risco = [...resumo.matchAll(/^\|\s*(High|Medium|Low|Informational)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/gm)].map((m) => ({ risco: m[1], distintos: Number(m[2]), ocorrencias: Number(m[3]) }));
    const alertas = [];
    let atual = '';
    for (const linha of resumo.split(/\r?\n/)) {
      const h = linha.match(/^###\s+(High|Medium|Low|Informational)/);
      if (h) { atual = h[1]; continue; }
      const m = linha.match(/^\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*`([^`]+)`\s*\|\s*(.+?)\s*\|$/);
      if (m && atual) alertas.push({ risco: atual, alerta: m[1], ocorrencias: Number(m[2]), situacao: m[4].replace(/`/g, '') });
    }
    zap = {
      commit: pasta.split('_')[3],
      versao: resumo.match(/ZAP ([\d.]+)/)?.[1] ?? '',
      aprovadas: Number(resumo.match(/aprovadas:\s*(\d+)/)?.[1] ?? 0),
      reprovadas: Number(resumo.match(/reprovadas:\s*(\d+)/)?.[1] ?? 0),
      urls: r.cobertura.urls,
      requisicoes: r.cobertura.mensagens,
      endpoints2xx: r.cobertura.endpoints_2xx,
      risco,
      alertas
    };
  }
}

// ---------------------------------------------------------------------------------------------
// Saída
// ---------------------------------------------------------------------------------------------
const modulosLista = [...modulos.values()].map((m) => ({ ...m, total: m.dominio + m.aplicacao + m.infraestrutura + m.webapi })).sort((a, b) => b.total - a.total);

gravar('meta.json', meta);
gravar('tokens.json', tokens);
gravar('backend.json', {
  camadas, arquivosPorCamada, modulos: modulosLista, entidades, migrations,
  testes: testesCs, testesPorArea, tamanhoTotal: somar(['dominio', 'aplicacao', 'infraestrutura', 'webapi'], (k) => camadas[k])
});
gravar('endpoints.json', { dotnet: endpoints, ml: mlEndpoints });
gravar('frontend.json', {
  total: frontTotal, areas: [...front.values()].sort((a, b) => b.loc - a.loc), rotas, compartilhados,
  uiGerada: { arquivos: arquivosUiGerado, loc: locUiGerado }
});
gravar('ml.json', { total: mlTotal, areas: [...mlAreas.values()].sort((a, b) => b.loc - a.loc), testes: mlTestes.sort((a, b) => b.testes - a.testes) });
gravar('dependencias.json', { npm, nuget, pip, pipDev, pipTravados });
gravar('configuracao.json', { variaveis: variaveisLista });
gravar('seguranca.json', { rodada, lfw, zap });
gravar('metricas.json', metricas);
gravar('visaoGeral.json', { tamanhos, docs, capitulos, totalTestes: testesCs.unidade + testesCs.integracao + testesCs.webapi + frontTotal.testes + mlTotal.testes });

console.log(JSON.stringify({
  meta, camadas, testesCs, front: frontTotal, ml: mlTotal, endpoints: endpoints.length, mlEndpoints: mlEndpoints.length,
  rotas: rotas.length, modulos: modulosLista.length, entidades: entidades.length, migrations: migrations.length,
  rodada: rodada && { total: rodada.total, ok: rodada.aprovadas, falhas: rodada.reprovadas, info: rodada.informativas },
  variaveis: variaveisLista.length, totalTestes: testesCs.unidade + testesCs.integracao + testesCs.webapi + frontTotal.testes + mlTotal.testes
}, null, 2));
