import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import backend from '../dados/backend.json';
import dependencias from '../dados/dependencias.json';
import { inteiro } from '../core/formato';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

@Component({
  selector: 'app-backend',
  imports: [NgIcon, GraficoComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Projetos da solução" [valor]="projetos.length" apoio="4 de produção + 3 de teste" icone="lucideBox" />
      <app-kpi-card rotulo="Linhas de produção" [valor]="inteiro(backend.tamanhoTotal)" apoio="domínio + aplicação + infra + Web API" icone="lucideCode" />
      <app-kpi-card rotulo="Controllers" [valor]="16" apoio="todos com [Authorize]; anônimos só de entrada" icone="lucideRoute" />
      <app-kpi-card rotulo="Alvo" valor=".NET 8" apoio="net8.0; SDK 9 compila para net8.0" icone="lucideServer" />
    </div>

    <app-secao titulo="Camadas" descricao="A infraestrutura implementa as interfaces do domínio; o domínio não depende de nenhuma outra camada." id="camadas">
      <div class="flex flex-col gap-3" role="list" aria-label="Camadas da solução, de cima para baixo">
        @for (c of pilha; track c.nome) {
          <div role="listitem" class="border-border flex flex-wrap items-center gap-3 rounded-xl border p-5" [class]="c.classe">
            <span class="text-title-s min-w-40 font-semibold">{{ c.nome }}</span>
            <span class="text-body-m flex-1">{{ c.texto }}</span>
            <span class="text-label-m tabular opacity-80">{{ inteiro(c.linhas) }} linhas · {{ c.arquivos }} arquivos</span>
          </div>
        }
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico titulo="Linhas por projeto" subtitulo="Produção e testes na mesma escala" [configurar]="graficoProjetos" [altura]="320" [tabela]="tabelaProjetos" resumo="Barras horizontais com as linhas de código de cada projeto da solução .NET, incluindo os três projetos de teste." />
        <app-grafico titulo="Pacotes NuGet por projeto" subtitulo="Dependências diretas declaradas nos .csproj" [configurar]="graficoPacotes" [altura]="320" [tabela]="tabelaPacotes" resumo="Barras com a quantidade de pacotes NuGet diretos de cada projeto." />
      </div>
    </app-secao>

    <app-secao titulo="Padrões em uso" id="padroes">
      <ul class="grid gap-6 md:grid-cols-2">
        @for (p of padroes; track p.titulo) {
          <li class="border-border bg-card flex gap-4 rounded-xl border p-6">
            <span class="bg-secondary text-secondary-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
              <ng-icon [name]="p.icone" class="text-lg" aria-hidden="true" />
            </span>
            <div>
              <p class="text-title-s text-foreground">{{ p.titulo }}</p>
              <p class="text-body-m text-muted-foreground">{{ p.texto }}</p>
            </div>
          </li>
        }
      </ul>
    </app-secao>

    <app-secao titulo="Do resultado ao HTTP" descricao="Cada handler devolve um resultado tipado (FluentResults); MainController.MapearErro traduz o TipoErro para o código HTTP." id="erros">
      <app-tabela-dados [colunas]="colunasErros" [linhas]="erros" legenda="mapeamento de erros para HTTP" arquivo="erros-http" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Pipeline HTTP" descricao="Ordem dos middlewares em Program.cs; o erro nunca devolve pilha de execução." id="pipeline">
      <ol class="grid gap-4 md:grid-cols-2">
        @for (m of pipeline; track m.nome; let i = $index) {
          <li class="border-border bg-card flex items-start gap-4 rounded-xl border p-5">
            <span class="bg-primary-container text-on-primary-container text-label-m tabular flex size-7 shrink-0 items-center justify-center rounded-full">{{ i + 1 }}</span>
            <div>
              <p class="text-title-s text-foreground code-inline w-fit">{{ m.nome }}</p>
              <p class="text-body-s text-muted-foreground mt-1">{{ m.texto }}</p>
            </div>
          </li>
        }
      </ol>
    </app-secao>

    <app-secao titulo="Identidade e sessão" id="identidade">
      <app-tabela-dados [colunas]="colunasSessao" [linhas]="sessao" legenda="controles de sessão e senha" arquivo="sessao" [tamanhoInicial]="10" />
      <app-nota tom="info" titulo="Renovação no navegador">
        O interceptor de autenticação do front renova a sessão em qualquer 401 de quem tinha sessão, com uma única chamada compartilhada, repete a
        requisição original e só leva ao login se a renovação falhar. Um refresh token inválido, revogado ou expirado responde 401.
      </app-nota>
    </app-secao>

    <app-secao titulo="Limites de uso" descricao="Rate limit nativo do ASP.NET; IPv6 vale pelo prefixo /64 para que trocar de endereço não escape do limite." id="limites">
      <app-tabela-dados [colunas]="colunasLimites" [linhas]="limites" legenda="limites de uso da API" arquivo="limites" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Persistência" descricao="EF Core com SQL Server: o acesso a dados é sempre pelo ORM, e o filtro por empresa mora no DbContext." id="persistencia">
      <ul class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        @for (p of persistencia; track p.titulo) {
          <li class="border-border bg-card flex h-full flex-col gap-3 rounded-xl border p-6">
            <span class="bg-primary-container text-on-primary-container flex size-11 items-center justify-center rounded-full">
              <ng-icon [name]="p.icone" class="text-xl" aria-hidden="true" />
            </span>
            <p class="text-title-m text-foreground">{{ p.titulo }}</p>
            <p class="text-body-m text-muted-foreground">{{ p.texto }}</p>
          </li>
        }
      </ul>
    </app-secao>
  `
})
export class BackendPage {
  protected readonly backend = backend;
  protected readonly inteiro = inteiro;

  protected readonly projetos = dependencias.nuget;

  protected readonly pilha = [
    { nome: 'WebApi', texto: 'Controllers, Program.cs, identidade, rate limit, cabeçalhos de segurança, Swagger.', linhas: backend.camadas.webapi, arquivos: backend.arquivosPorCamada.webapi, classe: 'bg-primary-container text-on-primary-container' },
    { nome: 'Core.Aplicacao', texto: 'Commands, handlers, validators e serviços (JWT, 2FA, limitador de login, auditoria).', linhas: backend.camadas.aplicacao, arquivos: backend.arquivosPorCamada.aplicacao, classe: 'bg-surface-container text-foreground' },
    { nome: 'Core.Dominio', texto: 'Entidades, regras (multa, cupom, ciclo do aluguel) e interfaces de repositório.', linhas: backend.camadas.dominio, arquivos: backend.arquivosPorCamada.dominio, classe: 'bg-surface-container text-foreground' },
    { nome: 'Infraestrutura.Orm', texto: 'EF Core, repositórios, filtro por empresa, migrations e geração do JWT.', linhas: backend.camadas.infraestrutura + backend.camadas.migrations, arquivos: backend.arquivosPorCamada.infraestrutura + backend.arquivosPorCamada.migrations, classe: 'bg-card text-foreground' }
  ];

  private readonly sizes = [
    ['Core.Aplicacao', backend.camadas.aplicacao],
    ['Infraestrutura.Orm (migrations)', backend.camadas.migrations],
    ['Tests.Integracao', backend.camadas.testesIntegracao],
    ['WebApi', backend.camadas.webapi],
    ['Infraestrutura.Orm', backend.camadas.infraestrutura],
    ['Testes.Unidade', backend.camadas.testesUnidade],
    ['Core.Dominio', backend.camadas.dominio],
    ['Tests.WebApi', backend.camadas.testesWebApi]
  ] as const;

  protected readonly tabelaProjetos = { colunas: ['Projeto', 'Linhas'], linhas: this.sizes.map(([n, v]) => [n, inteiro(v)]) };
  protected readonly graficoProjetos = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => inteiro(v) + ' linhas' },
    xAxis: eixoValor(t, { splitNumber: 3 }),
    yAxis: eixoCategoria(t, this.sizes.map(([n]) => n), { inverse: true, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11 } }),
    series: [{
      type: 'bar', barWidth: 16,
      data: this.sizes.map(([n, v]) => ({ value: v, itemStyle: { color: /Tests?\./.test(n) ? t.series[2] : n.includes('migrations') ? t.series[4] : t.series[0], borderRadius: [0, 6, 6, 0] } })),
      label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte, formatter: (p: { value: number }) => inteiro(p.value) }
    }]
  });

  protected readonly tabelaPacotes = { colunas: ['Projeto', 'Pacotes'], linhas: dependencias.nuget.map((p) => [p.projeto, p.pacotes.length]) };
  protected readonly graficoPacotes = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: eixoValor(t, { minInterval: 1 }),
    yAxis: eixoCategoria(t, dependencias.nuget.map((p) => p.projeto), { inverse: true, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11 } }),
    series: [{
      type: 'bar', barWidth: 16,
      data: dependencias.nuget.map((p) => ({ value: p.pacotes.length, itemStyle: { color: t.series[1], borderRadius: [0, 6, 6, 0] } })),
      label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte }
    }]
  });

  protected readonly persistencia = [
    { icone: 'lucideDatabase', titulo: 'Sem SQL cru', texto: 'Nenhum FromSqlRaw ou ExecuteSqlRaw: tudo passa pelo EF Core, o que elimina injeção por concatenação.' },
    { icone: 'lucideLayers', titulo: 'Migrations versionadas', texto: `${backend.migrations.length} migrations, do primeiro esquema (funcionários e grupos) aos índices únicos por empresa, passando pela auditoria e pelo consentimento facial.` },
    { icone: 'lucideEraser', titulo: 'Exclusão lógica', texto: 'Excluido e ExcluidoEmUtc na EntidadeBase; as consultas nunca devolvem o que foi excluído.' },
    { icone: 'lucideShield', titulo: 'Filtro por empresa no DbContext', texto: 'O contexto descobre por reflexão as entidades que herdam de EntidadeBase<T> e aplica HasQueryFilter com EmpresaId e !Excluido. O provedor de empresa é um objeto nunca nulo (null object): o EF avalia o acesso ao membro antes do curto-circuito do C#.' },
    { icone: 'lucideClock', titulo: 'Retenção automática', texto: 'LimpezaPeriodicaService apaga rosto sem uso há 12 meses, IP antigo da auditoria e refresh tokens vencidos.' },
    { icone: 'lucideMail', titulo: 'Recuperação em segundo plano', texto: 'ProcessadorDeRecuperacaoDeSenha envia o e-mail fora da requisição: a resposta é igual para qualquer e-mail.' }
  ];

  protected readonly padroes = [
    { icone: 'lucideWorkflow', titulo: 'CQRS e MediatR', texto: 'Um command ou query por caso de uso, com handler próprio; os controllers só montam o comando e traduzem o resultado. SerializarPorEmpresaBehavior envolve os comandos de aluguel e devolução, com um semáforo por empresa e uma trava no banco (sp_getapplock) que vale entre instâncias.' },
    { icone: 'lucideShield', titulo: 'Isolamento por empresa', texto: 'Filtro global por EmpresaId e !Excluido no DbContext; EmpresaId vem do token e o campo enviado no corpo é ignorado (mass assignment barrado).' },
    { icone: 'lucideKeyRound', titulo: 'Identidade', texto: 'ASP.NET Identity com SignInManager e lockout. Papéis Empresa e Funcionário; o Funcionário herda a empresa que o cadastrou.' },
    { icone: 'lucideCircleCheck', titulo: 'Validação', texto: 'FluentValidation por command; documentos (CPF/CNPJ), senha, foto do veículo e período do aluguel conferidos no servidor.' },
    { icone: 'lucideEye', titulo: 'Auditoria por empresa', texto: 'RegistroDeAuditoria guarda ação, entidade, campos alterados (nunca valores) e IP; login, falha, bloqueio, rosto e 2FA entram na trilha.' },
    { icone: 'lucideBot', titulo: 'Cliente do ML', texto: 'FacialAuthClient chama o ML de servidor para servidor com X-Internal-Token, timeout de 10 s e falha fechada quando a prova de vida não vem.' }
  ];

  protected readonly erros: Linha[] = [
    { tipo: 'RequisicaoInvalida', http: '400', quando: 'Entrada inválida ou regra de negócio violada' },
    { tipo: 'NaoAutorizado', http: '401', quando: 'Sem sessão, token revogado ou credencial incorreta' },
    { tipo: 'RegistroNaoEncontrado', http: '404', quando: 'Id inexistente ou de outra empresa' },
    { tipo: 'RegistroDuplicado', http: '409', quando: 'Valor único repetido, inclusive quando o índice único barra dois pedidos simultâneos' },
    { tipo: 'EstadoInvalido', http: '409', quando: 'Transição não permitida (iniciar duas vezes, reserva dupla)' },
    { tipo: 'ExclusaoBloqueada', http: '422', quando: 'Exclusão com vínculo ativo' },
    { tipo: 'SegundoFatorObrigatorio', http: '428', quando: 'Falta o código do segundo fator no login' },
    { tipo: 'ExcecaoInterna', http: '500', quando: 'Falha inesperada, sem causa exposta' }
  ];

  protected readonly colunasErros: ColunaTabela[] = [
    { id: 'tipo', titulo: 'TipoErro', tipo: 'codigo' },
    { id: 'http', titulo: 'HTTP', tipo: 'selo', filtravel: true, tom: (v) => (String(v).startsWith('5') ? 'error' : String(v) === '428' ? 'warning' : 'info') },
    { id: 'quando', titulo: 'Quando acontece', larguraMin: '18rem' }
  ];

  protected readonly pipeline = [
    { nome: 'UseForwardedHeaders', texto: 'Troca o IP do proxy pelo do cliente, só se o proxy estiver em TRUSTED_PROXIES.' },
    { nome: 'UseCabecalhosDeSeguranca', texto: 'Cabeçalhos de segurança em toda resposta da API (ataque D01); sem X-Powered-By e sem versão no cabeçalho Server (D02).' },
    { nome: 'UseGlobalExceptionHandler', texto: 'Captura exceções de qualquer middleware seguinte e nunca devolve a pilha.' },
    { nome: 'AplicarMigracoesOrm + Swagger', texto: 'Só em Development; fora dele entra o HSTS.' },
    { nome: 'UseHttpsRedirection · UseCors', texto: 'CORS com origens explícitas (CORS_ALLOWED_ORIGINS); nunca "*".' },
    { nome: 'UseAuthentication', texto: 'JWT Bearer com verificação do AccessTokenVersionId do usuário a cada requisição.' },
    { nome: 'UseRateLimiter', texto: 'Depois da autenticação, para que o limite geral seja por usuário e não só por IP.' },
    { nome: 'UseAuthorization · MapControllers', texto: '[Authorize(Roles = …)] em todos os controllers; rotas anônimas são exceção.' }
  ];

  protected readonly sessao: Linha[] = [
    { controle: 'Access token', detalhe: 'JWT de 15 minutos: assinatura, emissor, audiência e validade; ClockSkew de 30 s; chave de pelo menos 32 caracteres', onde: 'Memória do navegador' },
    { controle: 'Revogação imediata', detalhe: 'AccessTokenVersionId do token comparado ao do usuário em toda requisição; logout, troca de senha e desligamento invalidam', onde: 'Web API' },
    { controle: 'Refresh token', detalhe: 'Valor aleatório rotativo e atômico; só o hash SHA-256 vai ao banco; reuso derruba a sessão inteira', onde: 'Cookie HttpOnly; Secure; SameSite=Lax' },
    { controle: 'Anti-CSRF', detalhe: 'Rotacionar e sair exigem o cabeçalho X-Locadora-Client', onde: 'Web API' },
    { controle: 'Hash de senha', detalhe: 'PasswordHasher do Identity (PBKDF2 com sal), 210.000 iterações', onde: 'Banco' },
    { controle: 'Política de senha', detalhe: 'De 8 a 128 caracteres com número, maiúscula e minúscula, igual no front e no back', onde: 'Front e Web API' },
    { controle: 'Bloqueio de conta', detalhe: '5 erros travam o par conta + IP; 10 erros no total travam a conta por 15 minutos; mesma resposta para senha errada, bloqueio e e-mail inexistente', onde: 'LimitadorDeLoginPorConta' },
    { controle: 'Segundo fator', detalhe: 'TOTP por aplicativo autenticador, com 10 códigos de recuperação; cada código vale uma vez', onde: 'VerificadorDeSegundoFator' },
    { controle: 'Recuperação de senha', detalhe: 'Token de uso único, 3 pedidos por hora por e-mail, resposta idêntica com ou sem conta', onde: 'RecuperacaoDeSenha + SMTP' }
  ];

  protected readonly colunasSessao: ColunaTabela[] = [
    { id: 'controle', titulo: 'Controle' },
    { id: 'detalhe', titulo: 'Como funciona', larguraMin: '20rem' },
    { id: 'onde', titulo: 'Onde', filtravel: true, secundaria: true }
  ];

  protected readonly limites: Linha[] = [
    { politica: 'Global', limite: '300 por minuto', chave: 'Usuário autenticado ou IP', variavel: 'RATE_LIMIT_PER_MINUTE' },
    { politica: 'auth (login, rosto, 2FA…)', limite: '10 por minuto', chave: 'IP (IPv6 por /64)', variavel: '—' },
    { politica: 'registro', limite: '5 por hora', chave: 'IP (IPv6 por /64)', variavel: 'REGISTRATION_LIMIT_PER_HOUR' },
    { politica: 'Corpo da requisição', limite: '2 MB', chave: 'Requisição', variavel: 'MAX_REQUEST_BODY_BYTES' },
    { politica: 'Login com senha errada', limite: '5 erros por par conta + IP em 15 min', chave: 'Conta + IP', variavel: '—' }
  ];

  protected readonly colunasLimites: ColunaTabela[] = [
    { id: 'politica', titulo: 'Política' },
    { id: 'limite', titulo: 'Limite' },
    { id: 'chave', titulo: 'Chave do limite', secundaria: true },
    { id: 'variavel', titulo: 'Variável', tipo: 'codigo' }
  ];
}
