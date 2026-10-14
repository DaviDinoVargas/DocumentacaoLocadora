#!/usr/bin/env node
/**
 * Serve a pasta publicada exatamente como o GitHub Pages: sob o subcaminho do repositório e devolvendo
 * 404.html (com status 404) para qualquer caminho que não seja um arquivo.
 *   node tools/servir-pages.mjs [pasta] [base] [porta]
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

const pasta = resolve(process.argv[2] ?? 'dist/documentacao-locadora/browser');
const base = (process.argv[3] ?? '/DocumentacaoLocadora/').replace(/\/?$/, '/');
const porta = Number(process.argv[4] ?? 4400);

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.txt': 'text/plain; charset=utf-8'
};

function arquivoDe(url) {
  const relativo = url.slice(base.length);
  const alvo = resolve(join(pasta, relativo || 'index.html'));
  // nunca sai da pasta publicada
  if (alvo !== pasta && !alvo.startsWith(pasta + sep)) return null;
  if (existsSync(alvo) && statSync(alvo).isDirectory()) return join(alvo, 'index.html');
  return alvo;
}

createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (!url.startsWith(base)) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Fora do subcaminho do repositório.');
    return;
  }
  const arquivo = arquivoDe(url);
  if (arquivo && existsSync(arquivo) && statSync(arquivo).isFile()) {
    res.writeHead(200, { 'content-type': TIPOS[extname(arquivo)] ?? 'application/octet-stream' }).end(readFileSync(arquivo));
    return;
  }
  const naoEncontrado = join(pasta, '404.html');
  res.writeHead(404, { 'content-type': TIPOS['.html'] }).end(existsSync(naoEncontrado) ? readFileSync(naoEncontrado) : 'Não encontrado');
}).listen(porta, () => console.log(`Servindo ${pasta} em http://localhost:${porta}${base}`));
