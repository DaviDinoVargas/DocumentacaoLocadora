/**
 * Dados de testes que não saem dos arquivos de resultado.
 * O .NET, o Angular e a mutação são lidos pelo extrator (pasta de cobertura de 14/out/2026); a cobertura do
 * serviço de ML vem do relatório do coverage.py da mesma medição.
 */
export const META_COBERTURA = 80;

export const COBERTURA_ML = { cobertas: 1452, linhas: 1680, pct: 86.4, comRamos: 84 } as const;

/** Testes executados (os [DataRow] e os testes parametrizados expandem em vários casos) em marcos do projeto. */
export const EXECUCOES_REGISTRADAS = [
  { quando: '12/out/2026 · ajuste fino', unidade: 75, integracao: 78, webapi: 0, angular: 384, ml: 99 },
  { quando: '14/out/2026 · métricas', unidade: 172, integracao: 164, webapi: 100, angular: 495, ml: 178 },
  { quando: '14/out/2026 · reflexão', unidade: 178, integracao: 164, webapi: 261, angular: 581, ml: 216 }
] as const;
