/**
 * Cobertura de código medida em 13/out/2026 na branch dv-016-ajuste-fino (HANDOFF_PROMPT.md, seção
 * "Cobertura de código"), com 75 testes de unidade + 78 de integração (.NET), 99 pytest e 384 specs.
 * Não foi remedida depois: a dv-017-seguranca acrescentou testes (inclusive o projeto Tests.WebApi, que
 * antes não existia), então os números de .NET e ML de hoje tendem a ser maiores.
 */
export const COBERTURA_FONTE = 'HANDOFF_PROMPT.md · medição de 13/out/2026 (dv-016-ajuste-fino)';
export const META_COBERTURA = 75;

export interface BlocoCobertura {
  bloco: string;
  /** Percentual de linhas (ou statements) cobertas. */
  percentual: number;
  detalhe: string;
}

export const COBERTURA_BLOCOS: readonly BlocoCobertura[] = [
  { bloco: 'Angular', percentual: 74.8, detalhe: '2.086 de 2.790 linhas · branches 64,9 % · funções 53,0 %' },
  { bloco: 'Serviço de ML (Python)', percentual: 71.3, detalhe: '849 de 1.191 statements (com branches: 69 %)' },
  { bloco: '.NET (Dominio + Aplicacao + Orm)', percentual: 32.2, detalhe: '1.865 de 5.798 linhas: Domínio 60,9 %, Orm 66,8 %, Aplicação 19,7 %' },
  { bloco: 'Total ponderado (só o medido)', percentual: 49, detalhe: '≈ 4.800 de 9.779 linhas/statements' },
  { bloco: 'Total com a Web API como 0 %', percentual: 43, detalhe: 'estimativa de 41 a 45 %: a Web API (~2.000 linhas) não era referenciada por nenhum teste' }
];

export const COBERTURA_ANGULAR: readonly { nome: string; percentual: number }[] = [
  { nome: 'shared (validators, charts, layout)', percentual: 100 },
  { nome: 'core', percentual: 94 },
  { nome: 'shared/form-fields', percentual: 92 },
  { nome: 'Components/monitoramento', percentual: 91 },
  { nome: 'Components/home', percentual: 87 },
  { nome: 'Components/devolucoes', percentual: 84 },
  { nome: 'Components/alugueis', percentual: 82 },
  { nome: 'shared/data-table', percentual: 80 },
  { nome: 'Components/veiculos', percentual: 79 },
  { nome: 'Components/funcionarios', percentual: 76 },
  { nome: 'shared/ui', percentual: 74 },
  { nome: 'auth', percentual: 73 },
  { nome: 'Components/parceiros', percentual: 73 },
  { nome: 'Components/grupoveiculos', percentual: 72 },
  { nome: 'Components/taxa-servico', percentual: 71 },
  { nome: 'Components/configuracoes', percentual: 71 },
  { nome: 'Components/desafios-cupom', percentual: 69 },
  { nome: 'Components/planocobranca', percentual: 69 },
  { nome: 'Components/condutor', percentual: 68 },
  { nome: 'Components/cupons', percentual: 68 },
  { nome: 'Components/clientes', percentual: 52 },
  { nome: 'Components/pdf', percentual: 40 },
  { nome: 'Components/verificacao-facial', percentual: 40 },
  { nome: 'app.routes.ts', percentual: 10 }
];

export const COBERTURA_DOTNET: readonly { nome: string; percentual: number }[] = [
  { nome: 'Dashboard', percentual: 94.7 },
  { nome: 'Autenticação', percentual: 55.3 },
  { nome: 'Configuração', percentual: 52.0 },
  { nome: 'Aluguel', percentual: 42.2 },
  { nome: 'Automóvel', percentual: 35.8 },
  { nome: 'Plano de cobrança', percentual: 35.1 },
  { nome: 'Cupom', percentual: 34.7 },
  { nome: 'Devolução', percentual: 28.7 },
  { nome: 'Parceiro', percentual: 28.2 },
  { nome: 'Desafio de cupom', percentual: 26.0 },
  { nome: 'Clientes', percentual: 18.8 },
  { nome: 'Grupo de automóvel', percentual: 18.1 },
  { nome: 'Taxa de serviço', percentual: 13.9 },
  { nome: 'Condutor', percentual: 13.6 },
  { nome: 'Funcionário', percentual: 7.9 }
];

export const COBERTURA_ML: readonly { nome: string; percentual: number }[] = [
  { nome: 'shared', percentual: 94.6 },
  { nome: 'yolo_tesseract', percentual: 78.4 },
  { nome: 'ChatBot', percentual: 66.7 },
  { nome: 'FaceAuth', percentual: 49.3 },
  { nome: 'main.py', percentual: 0 }
];

/** Execuções registradas nos relatórios (contagem de testes executados, com [DataRow] expandidos). */
export const EXECUCOES_REGISTRADAS = [
  { quando: '12/out/2026 · dv-016', unidade: 75, integracao: 78, webapi: 0, angular: 384, ml: 99 },
  { quando: '13/out/2026 · topo 5f54812', unidade: 118, integracao: 106, webapi: 73, angular: 384, ml: 117 },
  { quando: '13/out/2026 · topo a3a5e2c', unidade: 137, integracao: 121, webapi: 87, angular: 386, ml: 134 }
] as const;
