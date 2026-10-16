import type { Type } from '@angular/core';

export interface PaginaDoc {
  /** Caminho da rota ('' é a página principal). */
  readonly caminho: string;
  readonly titulo: string;
  /** Rótulo curto da barra lateral. */
  readonly rotulo: string;
  readonly resumo: string;
  readonly grupo: string;
  readonly icone: string;
  readonly carregar: () => Promise<Type<unknown>>;
}

/**
 * Fonte única das páginas: a barra lateral, as rotas, as setas de próxima/anterior e o cubo
 * (que usa `PAGINAS.length` como N) leem daqui. Adicionar ou remover uma página aqui já
 * recalcula P = N − 2 peças do cubo.
 */
export const PAGINAS: readonly PaginaDoc[] = [
  {
    caminho: '', titulo: 'Visão geral', rotulo: 'Visão geral', grupo: 'Começar', icone: 'lucideLayoutDashboard',
    resumo: 'O que é o sistema, os fluxos principais e quanto ele tem de código, módulos, testes e segurança.',
    carregar: () => import('../paginas/visao-geral.page').then((m) => m.VisaoGeralPage)
  },
  {
    caminho: 'arquitetura', titulo: 'Arquitetura', rotulo: 'Arquitetura', grupo: 'Sistema', icone: 'lucideLayers',
    resumo: 'Cinco peças que conversam por HTTP, portas, decisões de projeto e o caminho de uma requisição.',
    carregar: () => import('../paginas/arquitetura.page').then((m) => m.ArquiteturaPage)
  },
  {
    caminho: 'dominio', titulo: 'Domínio e regras de negócio', rotulo: 'Domínio e regras', grupo: 'Sistema', icone: 'lucideBriefcase',
    resumo: 'Módulos, papéis, entidades, migrations e as regras que o servidor impõe.',
    carregar: () => import('../paginas/dominio.page').then((m) => m.DominioPage)
  },
  {
    caminho: 'backend', titulo: 'Back-end .NET', rotulo: 'Back-end .NET', grupo: 'Sistema', icone: 'lucideServer',
    resumo: 'Camadas, CQRS com MediatR, isolamento por empresa, identidade e persistência.',
    carregar: () => import('../paginas/backend.page').then((m) => m.BackendPage)
  },
  {
    caminho: 'concorrencia', titulo: 'Concorrência e integridade', rotulo: 'Concorrência', grupo: 'Sistema', icone: 'lucideWorkflow',
    resumo: 'Fila por empresa, trava no banco, índices únicos e a prova com pedidos simultâneos e duas instâncias da API.',
    carregar: () => import('../paginas/concorrencia.page').then((m) => m.ConcorrenciaPage)
  },
  {
    caminho: 'api', titulo: 'Referência da API', rotulo: 'Referência da API', grupo: 'Sistema', icone: 'lucideRoute',
    resumo: 'Todos os endpoints da Web API e do serviço de ML, com papel exigido e limite de uso.',
    carregar: () => import('../paginas/api.page').then((m) => m.ApiPage)
  },
  {
    caminho: 'frontend', titulo: 'Front-end Angular', rotulo: 'Front-end Angular', grupo: 'Interface e ML', icone: 'lucideMonitor',
    resumo: 'Rotas, componentes compartilhados, sessão no navegador e tamanho do código.',
    carregar: () => import('../paginas/frontend.page').then((m) => m.FrontendPage)
  },
  {
    caminho: 'design-system', titulo: 'Design system e tema', rotulo: 'Design system', grupo: 'Interface e ML', icone: 'lucidePalette',
    resumo: 'Tokens Material 3, mapeamento para o Spartan/shadcn, tipografia, forma e movimento.',
    carregar: () => import('../paginas/design-system.page').then((m) => m.DesignSystemPage)
  },
  {
    caminho: 'machine-learning', titulo: 'Serviço de ML', rotulo: 'Serviço de ML', grupo: 'Interface e ML', icone: 'lucideScanLine',
    resumo: 'Leitura de placas (YOLO + OCR), reconhecimento facial (SFace), prova de vida e assistente.',
    carregar: () => import('../paginas/machine-learning.page').then((m) => m.MachineLearningPage)
  },
  {
    caminho: 'seguranca', titulo: 'Segurança', rotulo: 'Segurança', grupo: 'Segurança', icone: 'lucideShieldCheck',
    resumo: 'Controles existentes, os 35 achados S1–S35 e o que ainda está em aberto.',
    carregar: () => import('../paginas/seguranca.page').then((m) => m.SegurancaPage)
  },
  {
    caminho: 'ataques', titulo: 'Bateria de ataques', rotulo: 'Bateria de ataques', grupo: 'Segurança', icone: 'lucideShieldAlert',
    resumo: 'Verificações automatizadas por categoria, o OWASP ZAP, a evolução entre rodadas e a carga.',
    carregar: () => import('../paginas/ataques.page').then((m) => m.AtaquesPage)
  },
  {
    caminho: 'testes', titulo: 'Testes e qualidade', rotulo: 'Testes e qualidade', grupo: 'Qualidade', icone: 'lucideFlaskConical',
    resumo: 'Pirâmide de testes por camada, cobertura, mutação e as lacunas conhecidas.',
    carregar: () => import('../paginas/testes.page').then((m) => m.TestesPage)
  },
  {
    caminho: 'reflexao', titulo: 'Reflexão em C#', rotulo: 'Reflexão em C#', grupo: 'Qualidade', icone: 'lucideSwords',
    resumo: 'Testes com System.Reflection que varrem os 99 endpoints e os comandos de aluguel e devolução.',
    carregar: () => import('../paginas/reflexao.page').then((m) => m.ReflexaoPage)
  },
  {
    caminho: 'acessibilidade', titulo: 'Acessibilidade e desempenho', rotulo: 'Acessibilidade', grupo: 'Qualidade', icone: 'lucideEye',
    resumo: 'Lighthouse, axe-core e Playwright por tela, tamanho do pacote e o que as medições fizeram corrigir.',
    carregar: () => import('../paginas/acessibilidade.page').then((m) => m.AcessibilidadePage)
  },
  {
    caminho: 'metricas', titulo: 'Métricas e desempenho', rotulo: 'Métricas', grupo: 'Qualidade', icone: 'lucideGauge',
    resumo: 'Quadro-resumo medido, latência da API, reconhecimento facial no LFW e o que falta medir.',
    carregar: () => import('../paginas/metricas.page').then((m) => m.MetricasPage)
  },
  {
    caminho: 'dependencias', titulo: 'Dependências e tecnologias', rotulo: 'Dependências', grupo: 'Operação', icone: 'lucidePackage',
    resumo: 'Pacotes npm, NuGet e pip: quantidade, versões e papel de cada um.',
    carregar: () => import('../paginas/dependencias.page').then((m) => m.DependenciasPage)
  },
  {
    caminho: 'configuracao', titulo: 'Configuração e execução', rotulo: 'Configuração', grupo: 'Operação', icone: 'lucideSettings',
    resumo: 'Variáveis de ambiente, portas, scripts de desenvolvimento e o que foi deixado fora.',
    carregar: () => import('../paginas/configuracao.page').then((m) => m.ConfiguracaoPage)
  },
  {
    caminho: 'decisoes', titulo: 'Decisões e limites', rotulo: 'Decisões', grupo: 'Fechamento', icone: 'lucideScale',
    resumo: 'As escolhas de projeto, o motivo de cada uma e os limites que elas deixam.',
    carregar: () => import('../paginas/decisoes.page').then((m) => m.DecisoesPage)
  },
  {
    caminho: 'encerramento', titulo: 'Encerramento e resumo', rotulo: 'Encerramento', grupo: 'Fechamento', icone: 'lucideFlag',
    resumo: 'O que foi documentado, o que fica pendente e por onde continuar.',
    carregar: () => import('../paginas/encerramento.page').then((m) => m.EncerramentoPage)
  }
];

/** N: total de páginas. */
export const TOTAL_PAGINAS = PAGINAS.length;
/** P = N − 2: peças do cubo (a penúltima página fecha o cubo; a última o resolve). */
export const TOTAL_PECAS = TOTAL_PAGINAS - 2;

export function indiceDoCaminho(caminho: string): number {
  const limpo = caminho.split('?')[0].split('#')[0].replace(/^\/+|\/+$/g, '');
  const i = PAGINAS.findIndex((p) => p.caminho === limpo);
  return i < 0 ? 1 : i + 1;
}
