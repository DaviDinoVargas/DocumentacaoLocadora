import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

@Component({
  selector: 'app-arquitetura',
  imports: [NgIcon, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <app-secao titulo="Visão geral dos componentes" descricao="O navegador nunca fala direto com o banco, e o serviço de ML nunca é exposto por inteiro: setas contínuas são chamadas; a tracejada é a validação de sessão que o ML pede à Web API." id="diagrama">
      <figure class="border-border bg-card rounded-xl border p-3 sm:p-5">
        <svg viewBox="0 0 880 400" class="h-auto w-full" role="img" aria-labelledby="arq-titulo arq-desc" font-family="inherit">
          <title id="arq-titulo">Arquitetura do sistema</title>
          <desc id="arq-desc">
            O navegador (Angular 21) chama o nginx ou o proxy de desenvolvimento, que encaminha /api para a Web API .NET 8, que fala com o SQL Server por EF Core.
            A Web API chama o serviço de ML (FastAPI) com o cabeçalho X-Internal-Token, e o ML valida a sessão do usuário perguntando à Web API. A webcam envia vídeo ao ML.
          </desc>
          <defs>
            <marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" class="fill-primary" />
            </marker>
            <marker id="seta-v" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" class="fill-muted-foreground" />
            </marker>
          </defs>

          @for (n of caixas; track n.id) {
            <g>
              <rect [attr.x]="n.x" [attr.y]="n.y" width="170" height="86" rx="16" [class]="n.destaque ? 'fill-primary-container stroke-primary' : 'fill-surface-container stroke-outline-variant'" stroke-width="1.5" />
              <text [attr.x]="n.x + 85" [attr.y]="n.y + 38" text-anchor="middle" class="fill-foreground" font-size="16" font-weight="600">{{ n.titulo }}</text>
              <text [attr.x]="n.x + 85" [attr.y]="n.y + 60" text-anchor="middle" class="fill-muted-foreground" font-size="12">{{ n.sub }}</text>
            </g>
          }

          <g class="stroke-primary" stroke-width="2" fill="none" marker-end="url(#seta)">
            <path d="M190 85 H250" />
            <path d="M420 85 H480" />
            <path d="M650 85 H710" />
            <path d="M505 128 V262" />
            <path d="M690 305 H650" />
          </g>
          <path d="M565 262 V128" class="stroke-muted-foreground" stroke-width="2" fill="none" stroke-dasharray="6 5" marker-end="url(#seta-v)" />
          <path d="M335 128 V305 H480" class="stroke-primary" stroke-width="2" fill="none" marker-end="url(#seta)" />

          <g class="fill-muted-foreground" font-size="11" text-anchor="middle">
            <text x="220" y="75">HTTP</text>
            <text x="450" y="75">/api/…</text>
            <text x="680" y="75">EF Core</text>
            <text x="497" y="200" text-anchor="end">X-Internal-Token</text>
            <text x="573" y="200" text-anchor="start">valida o JWT</text>
            <text x="408" y="325">/api/ml/chat · /api/cameras · /stream</text>
            <text x="670" y="295">vídeo</text>
          </g>
        </svg>
        <figcaption class="text-body-s text-muted-foreground mt-2">
          Em desenvolvimento o proxy do Angular (<span class="code-inline">proxy.conf.json</span>) faz o papel do nginx.
        </figcaption>
      </figure>
    </app-secao>

    <app-secao titulo="Portas e ambientes" descricao="A API usa caminho relativo (/api): front e API ficam na mesma origem, o que permite o cookie do refresh token sem configuração de domínio cruzado." id="portas">
      <app-tabela-dados [colunas]="colunasPortas" [linhas]="portas" legenda="portas e ambientes" arquivo="portas" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Quem recebe cada rota" descricao="O mesmo contrato vale no ng serve (proxy.conf.json) e no nginx do contêiner (Client/nginx.conf)." id="rotas">
      <app-tabela-dados [colunas]="colunasProxy" [linhas]="proxy" legenda="encaminhamento de rotas" arquivo="proxy" [tamanhoInicial]="10" />
      <app-nota tom="aviso" titulo="Docker e nginx fora do escopo desta documentação">
        Os arquivos de contêiner e de integração contínua existem na pasta de trabalho do software, mas não estão versionados e foram deixados fora
        de escopo por decisão do autor. Eles aparecem aqui só para registro.
      </app-nota>
    </app-secao>

    <app-secao titulo="Decisões de arquitetura" id="decisoes">
      <ul class="grid gap-6 md:grid-cols-2">
        @for (d of decisoes; track d.titulo) {
          <li class="border-border bg-card flex gap-4 rounded-xl border p-6">
            <span class="bg-secondary text-secondary-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
              <ng-icon [name]="d.icone" class="text-lg" aria-hidden="true" />
            </span>
            <div>
              <p class="text-title-s text-foreground">{{ d.titulo }}</p>
              <p class="text-body-m text-muted-foreground">{{ d.texto }}</p>
            </div>
          </li>
        }
      </ul>
    </app-secao>

    <app-secao titulo="Caminho de uma requisição autenticada" id="requisicao">
      <ol class="flex flex-col gap-4">
        @for (p of passos; track p.titulo; let i = $index) {
          <li class="border-border bg-card flex gap-4 rounded-xl border p-5">
            <span class="bg-primary text-primary-foreground text-title-s tabular flex size-9 shrink-0 items-center justify-center rounded-full">{{ i + 1 }}</span>
            <div>
              <p class="text-title-s text-foreground">{{ p.titulo }}</p>
              <p class="text-body-m text-muted-foreground">{{ p.texto }}</p>
            </div>
          </li>
        }
      </ol>
    </app-secao>
  `
})
export class ArquiteturaPage {
  protected readonly caixas = [
    { id: 'nav', x: 20, y: 42, titulo: 'Navegador', sub: 'Angular 21', destaque: false },
    { id: 'proxy', x: 250, y: 42, titulo: 'nginx / proxy', sub: 'estáticos + encaminhamento', destaque: true },
    { id: 'api', x: 480, y: 42, titulo: 'Web API', sub: '.NET 8 · CQRS · Identity', destaque: true },
    { id: 'db', x: 710, y: 42, titulo: 'SQL Server', sub: 'EF Core · filtro por empresa', destaque: false },
    { id: 'ml', x: 480, y: 262, titulo: 'Serviço de ML', sub: 'FastAPI · porta 8000', destaque: true },
    { id: 'cam', x: 690, y: 262, titulo: 'Webcam', sub: 'OpenCV · MJPEG', destaque: false }
  ];

  protected readonly portas: Linha[] = [
    { servico: 'Angular (ng serve)', porta: '4200', protocolo: 'HTTP', observacao: 'Proxy para a API e para o ML (proxy.conf.json)' },
    { servico: 'Web API .NET', porta: '5079 / 7064', protocolo: 'HTTP / HTTPS', observacao: 'Swagger e migrations automáticas só em Development' },
    { servico: 'Serviço de ML', porta: '8000', protocolo: 'HTTP', observacao: 'Escuta em 127.0.0.1 por padrão (variável HOST); ML_ENV ausente conta como produção' },
    { servico: 'SQL Server', porta: '1433', protocolo: 'TDS', observacao: 'Contêiner em desenvolvimento; não deve ser exposto fora da máquina em produção' },
    { servico: 'API da bateria de ataques', porta: '5180 / 5181', protocolo: 'HTTP', observacao: 'Instância de teste (limites padrão) e instância de carga (limite global alto)' },
    { servico: 'ML da bateria de ataques', porta: '8001', protocolo: 'HTTP', observacao: 'Modo de produção, com CAMERA_EMPRESA_ID da empresa de teste' }
  ];

  protected readonly colunasPortas: ColunaTabela[] = [
    { id: 'servico', titulo: 'Serviço' },
    { id: 'porta', titulo: 'Porta', tipo: 'codigo' },
    { id: 'protocolo', titulo: 'Protocolo', filtravel: true },
    { id: 'observacao', titulo: 'Observação', larguraMin: '18rem', secundaria: true }
  ];

  protected readonly proxy: Linha[] = [
    { rota: '/api/**', destino: 'Web API .NET', reescrita: '—', quem: 'Navegador' },
    { rota: '/api/cameras/**', destino: 'Serviço de ML', reescrita: 'remove /api/cameras', quem: 'Navegador autenticado' },
    { rota: '/api/ml/chat', destino: 'Serviço de ML', reescrita: '→ /chat', quem: 'Navegador autenticado' },
    { rota: '/stream/**', destino: 'Serviço de ML', reescrita: '—', quem: 'Navegador com ticket de uso único' },
    { rota: '/face/*', destino: 'Serviço de ML', reescrita: 'não é exposta', quem: 'Somente a Web API (X-Internal-Token)' }
  ];

  protected readonly colunasProxy: ColunaTabela[] = [
    { id: 'rota', titulo: 'Rota', tipo: 'codigo' },
    { id: 'destino', titulo: 'Destino', filtravel: true },
    { id: 'reescrita', titulo: 'Reescrita', secundaria: true },
    { id: 'quem', titulo: 'Quem chama', larguraMin: '14rem' }
  ];

  protected readonly decisoes = [
    { icone: 'lucideWorkflow', titulo: 'CQRS com MediatR', texto: 'Cada caso de uso é um command ou query com seu handler; validação (FluentValidation) e regras ficam fora dos controllers, que só traduzem HTTP.' },
    { icone: 'lucideShield', titulo: 'Isolamento por empresa no DbContext', texto: 'O filtro global do EF Core aplica EmpresaId e !Excluido a toda entidade que herda de EntidadeBase; uma consulta esquecida de filtrar não vaza dados.' },
    { icone: 'lucideBot', titulo: 'ML sem estado de negócio', texto: 'O serviço Python lê imagens e devolve resultados. Quem decide aluguel, devolução e identidade é a Web API; as amostras faciais vivem no banco, cifradas.' },
    { icone: 'lucideScale', titulo: 'Cálculo no servidor', texto: 'O valor do aluguel é recalculado a partir do plano do grupo e das taxas escolhidas; o campo enviado pelo cliente é ignorado.' },
    { icone: 'lucideGlobe', titulo: 'Uma única origem', texto: 'Evita CORS em produção e permite cookie SameSite=Lax para o refresh token, com cabeçalho X-Locadora-Client contra CSRF.' },
    { icone: 'lucideLock', titulo: 'Falha fechada', texto: 'Sem ML_ENV=development o ML se comporta como produção: sem /docs, sem token padrão e sem prova de vida desligada.' }
  ];

  protected readonly passos = [
    { titulo: 'O navegador envia o access token', texto: 'Authorization: Bearer com o JWT de 15 minutos, que vive só em memória, para /api/… via nginx.' },
    { titulo: 'A Web API valida a sessão', texto: 'Confere assinatura, emissor, audiência e validade, e compara a versão do token (AccessTokenVersionId) com a do usuário: logout, troca de senha e desligamento revogam na hora.' },
    { titulo: 'A autorização confere o papel', texto: '[Authorize(Roles = …)] aceita Empresa ou Funcionário conforme o endpoint; rotas anônimas são só as de entrada e de renovação.' },
    { titulo: 'O handler executa a regra', texto: 'Comandos de aluguel e devolução são serializados por empresa; o DbContext aplica o filtro de empresa automaticamente.' },
    { titulo: 'O erro volta padronizado', texto: 'Erros de negócio saem como lista de mensagens com 400, 404, 409, 422 ou 428; falhas inesperadas viram 500 genérico, sem pilha.' }
  ];
}
