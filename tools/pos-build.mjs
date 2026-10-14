#!/usr/bin/env node
/**
 * Passo posterior ao `ng build --base-href /NOME_DO_REPO/` para publicar no GitHub Pages:
 *  - copia index.html para 404.html, para que as rotas da SPA (ex.: /DocumentacaoLocadora/api) abram
 *    mesmo quando o navegador acessa o endereço direto (o Pages devolve o 404.html e o Angular roteia);
 *  - cria .nojekyll, para o Pages não processar a pasta com Jekyll;
 *  - confere que o <base href> do index.html é o do repositório.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const saida = process.argv[2] ?? 'dist/documentacao-locadora/browser';
const baseEsperada = process.argv[3] ?? '/DocumentacaoLocadora/';

const indice = join(saida, 'index.html');
if (!existsSync(indice)) {
  console.error(`index.html não encontrado em ${saida}. Rode antes: ng build --base-href ${baseEsperada}`);
  process.exit(1);
}

const html = readFileSync(indice, 'utf8');
const base = html.match(/<base href="([^"]*)"/)?.[1];
if (base !== baseEsperada) {
  console.error(`<base href> é "${base}", esperado "${baseEsperada}". Rode: ng build --base-href ${baseEsperada}`);
  process.exit(1);
}

copyFileSync(indice, join(saida, '404.html'));
writeFileSync(join(saida, '.nojekyll'), '');
console.log(`OK: 404.html e .nojekyll criados em ${saida} (base ${base}).`);
