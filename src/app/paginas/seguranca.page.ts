import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { NgIcon } from '@ng-icons/core';
import { ITENS_SEGURANCA, ORDEM_PRIORIDADE, type EstadoSeguranca } from '../dados/seguranca-itens';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { ConceitosComponent, type Conceito } from '../shared/layout/conceitos.component';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import type { TomStatus } from '../shared/layout/status-badge.component';
import { TabelaDadosComponent, type Celula, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const ESTADOS: EstadoSeguranca[] = ['Corrigido', 'Parcial', 'Ignorado'];

@Component({
  selector: 'app-seguranca',
  imports: [MatExpansionModule, NgIcon, GraficoComponent, ConceitosComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Achados" [valor]="itens.length" apoio="S1–S35, revisões de 12 e 13/out/2026" icone="lucideShieldAlert" />
      <app-kpi-card rotulo="Corrigidos" [valor]="contagem['Corrigido']" apoio="cada um reverificado por ataque automatizado" icone="lucideCircleCheck" />
      <app-kpi-card rotulo="Parciais" [valor]="contagem['Parcial']" [apoio]="idsParciais" icone="lucideTriangleAlert" />
      <app-kpi-card rotulo="Ignorados por decisão" [valor]="contagem['Ignorado']" [apoio]="idsIgnorados + ': Docker e CI fora de escopo'" icone="lucideCircleX" />
    </div>

    <app-nota tom="sucesso" titulo="Nenhum item crítico nem 'muito urgente' em aberto">
      Na rodada de ataques de referência: 154 verificações aprovadas, 0 reprovadas, 1 pendência conhecida (A16, confirmação de e-mail) e nenhum erro 5xx sob carga.
      Antes de usar com pessoas reais resta decidir a confirmação de e-mail (S6) e configurar o envio por SMTP; antes de publicar, a prova de vida com a webcam (S3), o CSP do SPA (S8) e o
      endurecimento de implantação.
    </app-nota>

    <app-secao titulo="Panorama dos achados" descricao="Prioridade com que cada achado nasceu e o que aconteceu com ele." id="panorama">
      <div class="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <app-grafico titulo="Achados por prioridade de origem" subtitulo="Empilhados pela situação atual" [configurar]="graficoPrioridade" [altura]="320" [tabela]="tabelaPrioridade" resumo="Barras empilhadas com a quantidade de achados em cada prioridade de origem, divididos entre corrigidos, parciais e ignorados." />
        <app-grafico titulo="Achados por área" subtitulo="Onde o risco se concentrava" [configurar]="graficoAreas" [altura]="320" [tabela]="tabelaAreas" resumo="Rosca com a quantidade de achados por área: sessão e senha, biometria, borda e rede, serviço de ML, dados e logs, regras de negócio e cadeia de suprimentos." />
      </div>
    </app-secao>

    <app-secao titulo="Os 35 achados" descricao="Filtre por situação, prioridade de origem ou área. A coluna Ataques lista as verificações da bateria que reverificam cada item." id="achados">
      <app-tabela-dados [colunas]="colunasItens" [linhas]="linhasItens" legenda="achados de segurança S1 a S35" arquivo="achados-seguranca" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Controles que já protegem" descricao="O que foi conferido no código e por ataque, por área." id="controles">
      <mat-accordion multi>
        @for (g of controles; track g.titulo) {
          <mat-expansion-panel [expanded]="g.aberto">
            <mat-expansion-panel-header>
              <mat-panel-title class="gap-2"><ng-icon [name]="g.icone" aria-hidden="true" /> {{ g.titulo }}</mat-panel-title>
              <mat-panel-description class="max-md:hidden">{{ g.itens.length }} controles</mat-panel-description>
            </mat-expansion-panel-header>
            <ul class="text-body-m text-foreground flex list-disc flex-col gap-1.5 pl-5">
              @for (i of g.itens; track i) {
                <li>{{ i }}</li>
              }
            </ul>
          </mat-expansion-panel>
        }
      </mat-accordion>
    </app-secao>

    <app-secao titulo="Quem poderia atacar" descricao="O modelo de ameaça considera cinco atores. Ele não inclui o administrador do servidor." id="atores">
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        @for (a of atores; track a.ator) {
          <article class="border-border bg-card flex h-full flex-col gap-3 rounded-xl border p-6">
            <span class="bg-secondary text-secondary-foreground flex size-11 items-center justify-center rounded-full">
              <ng-icon [name]="a.icone" class="text-xl" aria-hidden="true" />
            </span>
            <h3 class="text-title-m text-foreground">{{ a.ator }}</h3>
            <p class="text-body-m text-muted-foreground"><span class="text-foreground font-medium">Tentaria:</span> {{ a.tentaria }}</p>
            <p class="text-body-m text-muted-foreground border-border mt-auto border-t pt-3"><span class="text-foreground font-medium">O que impede:</span> {{ a.impede }}</p>
          </article>
        }
      </div>
    </app-secao>

    <app-secao titulo="Conceitos por trás dos controles" descricao="O vocabulário mínimo para ler os achados e a bateria de ataques." id="conceitos">
      <app-conceitos [itens]="conceitos" />
    </app-secao>

    <app-secao titulo="Mapeamento com o OWASP Top 10 (2021)" descricao="Correspondência aproximada entre as categorias e os controles e achados do sistema." id="owasp">
      <app-tabela-dados [colunas]="colunasOwasp" [linhas]="owasp" legenda="correspondência com o OWASP Top 10" arquivo="owasp" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Dados faciais e LGPD" descricao="O rosto é dado pessoal sensível (Lei 13.709/2018, art. 5º, II, e art. 11)." id="lgpd">
      <div class="grid gap-6 md:grid-cols-2">
        @for (l of lgpd; track l.titulo) {
          <article class="border-border bg-card flex gap-3 rounded-xl border p-6">
            <span class="bg-primary-container text-on-primary-container flex size-10 shrink-0 items-center justify-center rounded-full">
              <ng-icon [name]="l.icone" class="text-lg" aria-hidden="true" />
            </span>
            <div>
              <p class="text-title-s text-foreground">{{ l.titulo }}</p>
              <p class="text-body-m text-muted-foreground">{{ l.texto }}</p>
            </div>
          </article>
        }
      </div>
    </app-secao>

    <app-secao titulo="Método e limites da revisão" id="metodo">
      <div class="grid gap-6 md:grid-cols-2">
        <article class="border-border bg-card flex flex-col gap-2 rounded-xl border p-6">
          <h3 class="text-title-m text-foreground">O que foi feito</h3>
          <ul class="text-body-m text-muted-foreground list-disc pl-5">
            <li>Revisão estática da Web API, do Angular, do serviço de ML, da configuração e do histórico do git (busca por segredos)</li>
            <li>Verificação ao vivo local: cabeçalhos, CORS, anti-CSRF, limite de corpo, rate limit, tempo de login e acesso ao ML com credencial de outro papel</li>
            <li>dotnet list package --vulnerable, npm audit e pip-audit</li>
            <li>Bateria automatizada de ataques e carga (próxima página), reexecutada a cada correção</li>
          </ul>
        </article>
        <article class="border-border bg-card flex flex-col gap-2 rounded-xl border p-6">
          <h3 class="text-title-m text-foreground">O que não foi feito</h3>
          <ul class="text-body-m text-muted-foreground list-disc pl-5">
            <li>Pen-test e DAST externos (por exemplo OWASP ZAP) e teste contra ambiente publicado</li>
            <li>Comportamento com a webcam real: prova de vida contra foto impressa e de tela</li>
            <li>Revisão de banco, backup e logs de um ambiente de produção (inexistente)</li>
            <li>Execução de Docker e CI (fora de escopo por decisão)</li>
          </ul>
        </article>
      </div>
    </app-secao>
  `
})
export class SegurancaPage {
  protected readonly itens = ITENS_SEGURANCA;
  protected readonly contagem: Record<EstadoSeguranca, number> = {
    Corrigido: ITENS_SEGURANCA.filter((i) => i.estado === 'Corrigido').length,
    Parcial: ITENS_SEGURANCA.filter((i) => i.estado === 'Parcial').length,
    Ignorado: ITENS_SEGURANCA.filter((i) => i.estado === 'Ignorado').length
  };

  protected readonly idsParciais = ITENS_SEGURANCA.filter((i) => i.estado === 'Parcial').map((i) => i.id).join(', ');
  protected readonly idsIgnorados = ITENS_SEGURANCA.filter((i) => i.estado === 'Ignorado').map((i) => i.id).join(' e ');

  protected readonly linhasItens: Linha[] = ITENS_SEGURANCA.map((i) => ({
    id: i.id, titulo: i.titulo, estado: i.estado, prioridade: i.prioridade, area: i.area, ataques: i.ataques, resumo: i.resumo
  }));

  private readonly tomEstado = (v: Celula): TomStatus => (v === 'Corrigido' ? 'success' : v === 'Parcial' ? 'warning' : 'neutral');

  protected readonly colunasItens: ColunaTabela[] = [
    { id: 'id', titulo: 'ID', tipo: 'codigo' },
    { id: 'titulo', titulo: 'Achado', larguraMin: '14rem' },
    { id: 'estado', titulo: 'Situação', tipo: 'selo', filtravel: true, tom: this.tomEstado },
    { id: 'prioridade', titulo: 'Prioridade de origem', filtravel: true, secundaria: true },
    { id: 'area', titulo: 'Área', filtravel: true, secundaria: true },
    { id: 'resumo', titulo: 'O que foi feito / o que resta', larguraMin: '24rem', secundaria: true },
    { id: 'ataques', titulo: 'Ataques', secundaria: true }
  ];

  protected readonly tabelaPrioridade = {
    colunas: ['Prioridade de origem', ...ESTADOS],
    linhas: ORDEM_PRIORIDADE.map((p) => [p, ...ESTADOS.map((e) => ITENS_SEGURANCA.filter((i) => i.prioridade === p && i.estado === e).length)])
  };

  protected readonly graficoPrioridade = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    const cores: Record<EstadoSeguranca, string> = { Corrigido: t.sucesso, Parcial: t.aviso, Ignorado: t.textoSecundario };
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, [...ORDEM_PRIORIDADE]),
      yAxis: eixoValor(t, { minInterval: 1 }),
      series: ESTADOS.map((e) => ({
        name: e, type: 'bar', stack: 'estado', emphasis: { focus: 'series' }, itemStyle: { color: cores[e] },
        data: ORDEM_PRIORIDADE.map((p) => ITENS_SEGURANCA.filter((i) => i.prioridade === p && i.estado === e).length)
      }))
    };
  };

  private readonly porArea = (() => {
    const mapa = new Map<string, number>();
    for (const i of ITENS_SEGURANCA) mapa.set(i.area, (mapa.get(i.area) ?? 0) + 1);
    return [...mapa.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  })();

  protected readonly tabelaAreas = { colunas: ['Área', 'Achados'], linhas: this.porArea.map((a) => [a.name, a.value]) };
  protected readonly graficoAreas = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'item' },
    legend: { ...baseDoGrafico(t).legend, bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie', radius: ['42%', '66%'], center: ['50%', '42%'],
      itemStyle: { borderColor: t.fundoDica, borderWidth: 2, borderRadius: 6 },
      label: { color: t.texto, fontFamily: t.fonte, formatter: '{c}' },
      data: this.porArea.map((a, i) => ({ ...a, itemStyle: { color: t.series[i % t.series.length] } }))
    }]
  });

  protected readonly atores = [
    { icone: 'lucideUsers', ator: 'Visitante anônimo', tentaria: 'forjar um JWT, adivinhar senhas, descobrir quais e-mails têm conta, abusar do cadastro.', impede: 'assinatura e versão do token conferidas, bloqueio por conta + IP, limites de uso e respostas idênticas para e-mail com e sem conta.' },
    { icone: 'lucideUserX', ator: 'Funcionário mal-intencionado ou conta comprometida', tentaria: 'subir para Empresa, mudar o preço das taxas ou continuar entrando depois de desligado.', impede: 'papéis conferidos no servidor, taxas só da Empresa e acesso encerrado na hora ao desligar (token, conta e rosto).' },
    { icone: 'lucideBuilding2', ator: 'Administrador de outra empresa', tentaria: 'ler ou alterar clientes, aluguéis e câmeras de uma empresa vizinha trocando um identificador.', impede: 'filtro global por empresa no DbContext, ids de outra empresa respondendo 404 e câmeras do ML só da empresa dona.' },
    { icone: 'lucideNetwork', ator: 'Pessoa na mesma rede', tentaria: 'chamar o ML ou o banco direto, sem passar pela Web API.', impede: 'ML escutando só em 127.0.0.1, /face/* com token interno e falha fechada sem ML_ENV.' },
    { icone: 'lucideFileSearch', ator: 'Quem lê logs e backups', tentaria: 'achar senhas, tokens, e-mails ou rostos em texto puro.', impede: 'logs sem senha nem comando inteiro, e-mail mascarado, refresh token só com hash e amostras faciais cifradas.' }
  ];

  protected readonly conceitos: Conceito[] = [
    { termo: 'Access token e refresh token', definicao: 'O access token é uma credencial de vida curta enviada em cada chamada; o refresh token, de vida longa, serve só para pedir um novo par. Separar os dois limita o estrago de um roubo.', noSistema: 'JWT de 15 minutos na memória do navegador e refresh token em cookie HttpOnly, rotativo, com só o hash no banco.' },
    { termo: 'Rotação e detecção de reuso', definicao: 'Cada refresh token vale uma vez. Se um token antigo reaparece, alguém o copiou; a resposta segura é encerrar toda a sessão.', noSistema: 'Reuso derruba a sessão inteira; seis rotações simultâneas do mesmo token resultam em no máximo uma bem-sucedida.' },
    { termo: 'Isolamento multiempresa e IDOR', definicao: 'IDOR (referência direta insegura a objeto) é acessar o registro de outro trocando o identificador na URL. A defesa não é esconder ids: é filtrar sempre pelo dono.', noSistema: 'EmpresaId vem do token e entra em todo filtro do DbContext; o campo empresaId enviado no corpo é ignorado.' },
    { termo: 'Rate limit e bloqueio de conta', definicao: 'Limitar tentativas por unidade de tempo barra força bruta e abuso. Bloquear a conta inteira, porém, vira arma contra o dono; por isso o limite também considera o IP.', noSistema: '5 erros travam o par conta + IP e 10 travam a conta; IPv6 vale pelo prefixo /64.' },
    { termo: 'CSRF', definicao: 'Um site de terceiros faz o navegador do usuário enviar um pedido com os cookies dele. A defesa é exigir algo que o outro site não consegue enviar.', noSistema: 'Rotacionar e sair exigem o cabeçalho X-Locadora-Client, além do cookie SameSite=Lax.' },
    { termo: 'Enumeração de usuários', definicao: 'Descobrir quais contas existem pela diferença de mensagem, de status ou de tempo de resposta e usar isso para ataques dirigidos.', noSistema: 'Mesma mensagem e mesmo custo de hash para e-mail existente, inexistente e bloqueado; cadastro e recuperação de senha neutros.' },
    { termo: 'Falha fechada', definicao: 'Quando algo essencial falta (variável, modelo, token), o sistema nega em vez de liberar. É mais barato errar para o lado seguro.', noSistema: 'ML_ENV ausente conta como produção; sem pesos da prova de vida o ML responde 503; sem CAMERA_EMPRESA_ID ninguém acessa as câmeras.' },
    { termo: 'Defesa em profundidade', definicao: 'Várias camadas independentes, de modo que a falha de uma não basta para o ataque.', noSistema: 'Papel no front, papel na API, filtro por empresa no banco, token interno no ML e auditoria por empresa.' }
  ];

  protected readonly controles = [
    {
      icone: 'lucideKeyRound', titulo: 'Sessão e autenticação', aberto: true,
      itens: [
        'JWT de 15 minutos com assinatura, emissor, audiência e validade conferidos; ClockSkew de 30 s; chave de pelo menos 32 caracteres',
        'Revogação imediata: o AccessTokenVersionId do token é comparado ao do usuário a cada requisição',
        'Refresh token rotativo e atômico, só o hash SHA-256 no banco, cookie HttpOnly; Secure; SameSite=Lax; reuso derruba a sessão inteira',
        'Anti-CSRF: rotacionar e sair exigem X-Locadora-Client',
        'Senha com 8 a 128 caracteres, PBKDF2 de 210.000 iterações; 5 erros travam o par conta + IP e 10 travam a conta; mensagens genéricas e tempo igual',
        'Segundo fator TOTP (código de uso único) com códigos de recuperação; "esqueci minha senha" neutro, com token de uso único'
      ]
    },
    {
      icone: 'lucideShield', titulo: 'Autorização e isolamento', aberto: false,
      itens: [
        '[Authorize(Roles)] em todos os controllers; anônimos apenas registrar, autenticar, entrar-facial, rotacionar, sair e recuperação de senha',
        'Filtro global por EmpresaId e !Excluido no DbContext; EmpresaId vem do token; IDOR entre duas empresas barrado (B10–B16)',
        'Campos extras no corpo (empresaId, cargo, roles, isAdmin) são ignorados (mass assignment)',
        'Funcionário não cria taxas nem recursos reservados à Empresa; desligar o funcionário revoga tudo na hora',
        'Comandos de aluguel e devolução serializados por empresa (reserva dupla e cupom de uso único)'
      ]
    },
    {
      icone: 'lucideGlobe', titulo: 'API e borda', aberto: false,
      itens: [
        'Cabeçalhos de segurança, sem X-Powered-By e sem versão no cabeçalho Server; HSTS e redirecionamento HTTPS fora de desenvolvimento',
        'CORS só com a origem exata configurada; Swagger só em Development; erro sem pilha de execução',
        'Corpo ≤ 2 MB (413), rate limit global, de autenticação e de registro, IPv6 por /64, TRACE recusado',
        'Só EF Core: sem SQL cru, e SQL injection (inclusive por tempo) e XSS recusados; JSON escapa < > &'
      ]
    },
    {
      icone: 'lucideScanLine', titulo: 'Serviço de ML', aberto: false,
      itens: [
        'Falha fechada: ML_ENV ausente conta como produção; escuta só em 127.0.0.1; /docs e /health mínimos fora de desenvolvimento',
        '/face/* exige X-Internal-Token (comparação em tempo constante) e recusa o token padrão público em produção',
        'Câmeras, placas e stream só da empresa dona (CAMERA_EMPRESA_ID); ticket de vídeo de uso único; limites por usuário',
        'Modelos com SHA-256 e commit fixo; dependências travadas com hash e instaladas com --require-hashes; recortes de câmera apagados em 24 h'
      ]
    },
    {
      icone: 'lucideScanFace', titulo: 'Biometria', aberto: false,
      itens: [
        'AES-256-GCM com chave fora do banco e versionada; o ML não guarda nada; só vetores, nunca a foto',
        'Consentimento obrigatório e versionado antes do cadastro; retenção de 12 meses sem uso; exclusão ao encerrar a conta ou desligar o funcionário',
        'Prova de vida passiva ligada por padrão e obrigatória na API fora de desenvolvimento; falha fechada (503)',
        'Login facial passa pelo bloqueio de conta, pelo limite por conta + IP e pelo código do 2FA'
      ]
    },
    {
      icone: 'lucideEye', titulo: 'Logs e auditoria', aberto: false,
      itens: [
        'Nenhum log contém senha, token ou comando inteiro; e-mail mascarado; quebra de linha em dados do usuário é saneada',
        'Trilha por empresa (sem valores nem dados pessoais) com login, falha, bloqueio, troca de senha, 2FA, reuso de refresh token, logout e rosto',
        'IP da auditoria anonimizado depois de 180 dias; tela "Auditoria" restrita à Empresa'
      ]
    }
  ];

  protected readonly owasp: Linha[] = [
    { categoria: 'A01 Quebra de controle de acesso', controles: 'Papéis em todos os controllers, filtro por empresa, IDOR barrado entre duas empresas, ML só da empresa dona, taxas só da Empresa', itens: 'S24, S26, S32, S34' },
    { categoria: 'A02 Falhas criptográficas', controles: 'JWT assinado, refresh token só com hash, amostras faciais em AES-256-GCM, PBKDF2 de 210.000 iterações, HSTS', itens: 'S1, S17, S21 · resta S8 (TLS no nginx)' },
    { categoria: 'A03 Injeção', controles: 'Somente EF Core; SQL injection e injeção por tempo recusadas; JSON escapado; sem innerHTML no front', itens: 'S13, S35' },
    { categoria: 'A04 Design inseguro', controles: 'Serialização por empresa nas regras de aluguel; prova de vida; limites de cadastro', itens: 'S34 · restam S3 e S6' },
    { categoria: 'A05 Configuração incorreta', controles: 'ML com falha fechada, Swagger só em dev, CORS fechado, /docs removido em produção', itens: 'S12, S25 · restam S2, S7 e S8' },
    { categoria: 'A06 Componentes vulneráveis', controles: 'dotnet, npm (--omit=dev) e pip-audit limpos; pacotes sem uso removidos; dependências do ML com hash', itens: 'S5, S23, S30' },
    { categoria: 'A07 Falhas de identificação e autenticação', controles: 'Bloqueio por conta + IP, mensagens genéricas, 2FA TOTP, refresh rotativo, recuperação de senha neutra', itens: 'S18, S20, S27, S28, S29 · resta S3' },
    { categoria: 'A08 Integridade de software e dados', controles: 'Pesos de modelos com SHA-256 e commit fixo; locks com hash', itens: 'S23, S33 · resta S16 (CI)' },
    { categoria: 'A09 Falhas de log e monitoramento', controles: 'Sem senha nem dados pessoais em log; trilha de auditoria por empresa com tela', itens: 'S11, S14, S22' },
    { categoria: 'A10 SSRF', controles: 'Sem achado: a API só chama o ML configurado; o link de redefinição usa FRONTEND_URL, não o Host da requisição', itens: '—' }
  ];

  protected readonly colunasOwasp: ColunaTabela[] = [
    { id: 'categoria', titulo: 'Categoria', larguraMin: '12rem' },
    { id: 'controles', titulo: 'Controles', larguraMin: '22rem' },
    { id: 'itens', titulo: 'Achados', secundaria: true, larguraMin: '10rem' }
  ];

  protected readonly lgpd = [
    { icone: 'lucideFileText', titulo: 'Base legal e consentimento', texto: 'Termo versionado, mostrado só a quem está logado, aceito antes de cadastrar o rosto; quem recadastra aceita a nova versão.' },
    { icone: 'lucideTag', titulo: 'Finalidade e minimização', texto: 'Só o vetor de 128 números do rosto é guardado, nunca a foto, e só para entrar no sistema.' },
    { icone: 'lucideClock', titulo: 'Retenção e exclusão', texto: 'Rosto sem uso há 12 meses é apagado; o usuário pode apagar o seu a qualquer momento; encerrar a conta da empresa apaga os rostos.' },
    { icone: 'lucideLock', titulo: 'Segurança', texto: 'Cifra em repouso, acesso mínimo (só a Web API), auditoria de cadastro, verificação e remoção, e nenhuma biometria em log.' }
  ];
}
