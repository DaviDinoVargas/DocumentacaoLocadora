import { ChangeDetectionStrategy, Component } from '@angular/core';
import metricas from '../dados/metricas.json';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { ConceitosComponent, type Conceito } from '../shared/layout/conceitos.component';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import type { TomStatus } from '../shared/layout/status-badge.component';
import { TabelaDadosComponent, type Celula, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const reflexao = metricas.reflexao ?? [];
const rotulosAcesso: Record<string, string> = {
  'Empresa ou Funcionario': 'Empresa ou Funcionário',
  'Qualquer usuário autenticado': 'Qualquer usuário autenticado',
  'Público (sem [Authorize])': 'Público (sem [Authorize])',
  Empresa: 'Somente Empresa'
};
const acesso = (a: string) => rotulosAcesso[a] ?? a;

@Component({
  selector: 'app-reflexao',
  imports: [GraficoComponent, ConceitosComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Endpoints lidos" [valor]="reflexao.length" apoio="todas as ações dos controllers da Web API" icone="lucideRoute" />
      <app-kpi-card rotulo="Rotas públicas" [valor]="publicas" apoio="registrar, autenticar, entrar-facial, esqueci/redefinir senha, rotacionar e sair" icone="lucideGlobe" />
      <app-kpi-card rotulo="Testes de reflexão" [valor]="testes.endpointsEPapeis + testes.comandosSerializados" [apoio]="testes.endpointsEPapeis + ' sobre endpoints e papéis · ' + testes.comandosSerializados + ' sobre comandos'" icone="lucideFlaskConical" />
      <app-kpi-card rotulo="Sabotagens controladas" valor="3" apoio="6 testes reprovaram, com a rota ou o tipo apontado na mensagem" icone="lucideSwords" />
    </div>

    <app-secao titulo="Por que testar com reflexão" descricao="Reflexão (System.Reflection) é a capacidade de o próprio programa ler os seus tipos, métodos e atributos em tempo de execução. Aqui ela serve para varrer tudo, sem lista escrita à mão." id="porque">
      <app-conceitos [itens]="conceitos" />
    </app-secao>

    <app-secao titulo="Cenários 1 e 6: endpoints, papéis e rotas" descricao="ReflexaoDeSegurancaTests lê os controllers e confere a proteção de cada ação. Duas famílias de teste: as regras do sistema e a confiabilidade do próprio analisador." id="endpoints">
      <app-tabela-dados [colunas]="colunasTestes" [linhas]="testesEndpoints" legenda="testes de reflexão sobre endpoints e papéis" arquivo="reflexao-endpoints" [tamanhoInicial]="12" />
    </app-secao>

    <app-secao titulo="Cenário 2: comandos serializados por empresa" descricao="ComandosSerializadosPorReflexaoTests varre todas as requisições do MediatR dos módulos de aluguel e devolução. Cada uma tem de carregar o marcador ISerializadoPorEmpresa ou estar declarada como consulta." id="comandos">
      <app-tabela-dados [colunas]="colunasTestes" [linhas]="testesComandos" legenda="testes de reflexão sobre comandos serializados" arquivo="reflexao-comandos" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="O mapa que a reflexão desenha" descricao="A tabela dos endpoints é gerada pelo teste e conferida contra a API oficial do ASP.NET (IApiDescriptionGroupCollectionProvider): mesmas rotas, mesmo acesso, mesmo método executado." id="mapa">
      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico titulo="Quem acessa" subtitulo="Endpoints por papel efetivo (classe e método se somam)" [configurar]="graficoAcesso" [altura]="320" [tabela]="tabelaAcesso" resumo="Rosca com os endpoints por papel: Empresa ou Funcionário, somente Empresa, qualquer usuário autenticado e públicos." />
        <app-grafico titulo="Verbos e limite de taxa" subtitulo="Rotas por verbo HTTP; as públicas e as de autenticação têm limite próprio" [configurar]="graficoVerbos" [altura]="320" [tabela]="tabelaVerbos" resumo="Barras empilhadas com as rotas por verbo HTTP, separando as que têm limite de taxa das que não têm." />
      </div>
      <app-tabela-dados [colunas]="colunasMapa" [linhas]="mapa" legenda="endpoints da Web API lidos por reflexão" arquivo="endpoints-por-reflexao" [tamanhoInicial]="25" />
    </app-secao>

    <app-secao titulo="O que a leitura revelou" id="achados">
      <div class="grid gap-6 md:grid-cols-2">
        <app-nota tom="aviso" titulo="Rotas públicas por omissão">
          As sete rotas públicas ficam abertas porque não têm atributo, e nenhuma usa <span class="code-inline">[AllowAnonymous]</span>; a API também não define política de autorização padrão.
          Uma ação nova sem <span class="code-inline">[Authorize]</span> ficaria aberta em silêncio. O teste é a rede de segurança: ele só aceita ação sem proteção se estiver na lista explícita.
        </app-nota>
        <app-nota tom="sucesso" titulo="Defeito encontrado e corrigido">
          <span class="code-inline">ClienteController.SelecionarTodos</span> tinha o atributo <span class="code-inline">[HttpGet]</span> repetido. Nenhum endpoint estava sem proteção.
        </app-nota>
      </div>
    </app-secao>

    <app-secao titulo="Prova de que o teste pega erro" descricao="Um teste que nunca falha não prova nada. As falhas foram provocadas de propósito e desfeitas em seguida." id="prova">
      <app-tabela-dados [colunas]="colunasSabotagem" [linhas]="sabotagens" legenda="sabotagens controladas dos testes de reflexão" arquivo="reflexao-sabotagens" [tamanhoInicial]="10" />
    </app-secao>
  `
})
export class ReflexaoPage {
  protected readonly reflexao = reflexao;
  protected readonly testes = metricas.reflexaoTestes ?? { endpointsEPapeis: 0, comandosSerializados: 0 };
  protected readonly publicas = reflexao.filter((e) => e.acesso.startsWith('Público')).length;

  protected readonly conceitos: Conceito[] = [
    { termo: 'Reflexão no C#', definicao: 'Os tipos, métodos e atributos de um programa .NET ficam descritos em metadados que o próprio código consegue consultar. Um teste pode listar todos os controllers, as ações de cada um e os atributos que carregam.', noSistema: 'O teste lista as ações com [HttpGet], [HttpPost], [HttpPut] e [HttpDelete] e confere [Authorize], papéis e limite de taxa.' },
    { termo: 'Varredura em vez de lista', definicao: 'Uma lista escrita à mão só protege o que o autor lembrou de incluir. Varrer tudo faz o teste cobrir também o que ainda não existe.', noSistema: 'Uma ação nova sem proteção, ou um comando novo de aluguel sem o marcador, derruba o teste na hora.' },
    { termo: 'Papéis que se somam', definicao: 'No ASP.NET, o [Authorize(Roles)] da classe e o do método valem juntos: o acesso é a interseção dos dois, não a união.', noSistema: 'Escrita em taxas e serviços exige Empresa mesmo com o controller aberto ao Funcionário.' },
    { termo: 'Marcador de serialização', definicao: 'Uma interface sem métodos (ISerializadoPorEmpresa) que marca os comandos que precisam entrar na fila da empresa. A reflexão confere se todo comando de escrita a carrega.', noSistema: 'Os sete comandos que mudam estado de aluguel e devolução são exatamente os marcados, nem mais nem menos.' }
  ];

  private readonly legivel: Record<string, [string, string, string]> = {
    TodaAcaoDeController_TemAutorizacaoDeclarada_OuEstaNaListaDeRotasPublicas: ['Regra', 'Toda ação tem [Authorize] ou está na lista explícita de rotas públicas', 'Fecha a porta para ação esquecida sem proteção.'],
    RotasPublicas_SaoExatamenteAsDaLista_NemMaisNemMenos: ['Regra', 'As rotas públicas são exatamente as da lista, nem mais nem menos', 'Uma rota que se abre ou some da lista é notada.'],
    RotasPublicas_TemLimiteDeTaxa_ParaBarrarForcaBruta: ['Regra', 'Toda rota pública tem limite de taxa', 'Entrada sem limite viraria alvo de força bruta.'],
    RotasQueUsamSoOCookie_ExigemOCabecalhoDoCliente: ['Regra', 'Rotacionar e sair, que dependem só do cookie, exigem X-Locadora-Client', 'Barra CSRF nas rotas que o navegador chama sozinho.'],
    EscritaEmTaxasEServicos_ExigeOCargoEmpresa_MesmoComOControllerAbertoAoFuncionario: ['Regra', 'Escrever em taxas e serviços exige o cargo Empresa', 'O preço é decisão da gerência, não do balcão.'],
    ControllersDeGestao_SaoSoDaEmpresa: ['Regra', 'Funcionários, auditoria e grupos de automóvel são só da Empresa', 'Gestão e trilha de auditoria não vazam para o Funcionário.'],
    Analise_PegaUmaAcaoSemAutorizacao_EAceitaAsDemaisFormasDeProteger: ['Analisador', 'O analisador acusa ação sem autorização e aceita as demais formas de proteger', 'Prova que a varredura enxerga o erro.'],
    Analise_SomaOsPapeisDoMetodoComOsDaClasse_EResolveRotaDeVariosVerbos: ['Analisador', 'Soma os papéis do método com os da classe e resolve rota de vários verbos', 'A leitura reproduz a regra real do ASP.NET.'],
    TabelaPorReflexao_BateComAApiOficialDoAspNet_NasRotasENoAcesso: ['Analisador', 'A tabela por reflexão bate com a API oficial do ASP.NET nas rotas e no acesso', 'Duas fontes independentes concordam.'],
    TabelaPorReflexao_CadaLinhaApontaParaOMesmoMetodoQueAApiOficialExecuta: ['Analisador', 'Cada linha aponta para o mesmo método que a API oficial executa', 'A rota listada é a que de fato roda.'],
    TabelaPorReflexao_ENaoTemRotaDuplicada: ['Analisador', 'A tabela não tem rota duplicada', 'Evita ambiguidade de verbo e caminho.'],
    TabelaPorReflexao_EGravadaForaDoRepositorio_EmMarkdownEJson: ['Analisador', 'A tabela é gravada fora do repositório, em Markdown e JSON', 'O mapa fica disponível como evidência e para esta documentação.']
  };

  protected readonly testesEndpoints: Linha[] = Object.values(this.legivel).map(([familia, regra, motivo]) => ({ familia, regra, motivo }));

  protected readonly testesComandos: Linha[] = [
    { familia: 'Regra', regra: 'Todo comando de aluguel e devolução tem o marcador ou está declarado como consulta', motivo: 'Comando novo sem fila é o erro que a varredura existe para pegar.' },
    { familia: 'Regra', regra: 'A lista de consultas não tem nome que sumiu nem consulta que recebeu o marcador', motivo: 'A lista de exceções não apodrece.' },
    { familia: 'Regra', regra: 'Os sete comandos que mudam estado são os marcados, e nada mais', motivo: 'Fecha o conjunto: o que é escrita entra na fila, o que é leitura não.' },
    { familia: 'Regra', regra: 'O marcador só é usado em requisições do MediatR', motivo: 'Só elas passam pelo behavior que cria a fila.' },
    { familia: 'Regra', regra: 'Exclusões que disputam com aluguéis e o cadastro de funcionário também entram na fila', motivo: 'Reflete defeitos reais achados pela bateria de corridas.' },
    { familia: 'Analisador', regra: 'A varredura pega o comando esquecido e aceita o marcado ou a consulta declarada', motivo: 'Prova que a varredura enxerga o erro.' },
    { familia: 'Analisador', regra: 'Não confunde nome parecido com consulta: só o que está na lista é isento', motivo: 'Nada é isento por prefixo de nome.' }
  ];

  protected readonly colunasTestes: ColunaTabela[] = [
    { id: 'familia', titulo: 'Tipo', tipo: 'selo', filtravel: true, tom: (v: Celula): TomStatus => (v === 'Regra' ? 'info' : 'neutral') },
    { id: 'regra', titulo: 'O que o teste afirma', larguraMin: '22rem' },
    { id: 'motivo', titulo: 'Por que importa', larguraMin: '16rem', secundaria: true }
  ];

  private readonly porAcesso = (() => {
    const mapa = new Map<string, number>();
    for (const e of reflexao) mapa.set(acesso(e.acesso), (mapa.get(acesso(e.acesso)) ?? 0) + 1);
    return [...mapa.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  })();
  protected readonly tabelaAcesso = { colunas: ['Quem acessa', 'Endpoints'], linhas: this.porAcesso.map((a) => [a.name, a.value]) };
  protected readonly graficoAcesso = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'item' },
    legend: { ...baseDoGrafico(t).legend, bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie', radius: ['46%', '70%'], center: ['50%', '42%'],
      itemStyle: { borderColor: t.fundoDica, borderWidth: 2, borderRadius: 6 },
      label: { color: t.texto, fontFamily: t.fonte, formatter: '{c}' },
      data: this.porAcesso.map((a, i) => ({ ...a, itemStyle: { color: t.series[i % t.series.length] } }))
    }]
  });

  private readonly verbos = ['GET', 'POST', 'PUT', 'DELETE'];
  private contar(verbo: string, comLimite: boolean): number {
    return reflexao.filter((e) => e.verbo === verbo && (e.limite !== '') === comLimite).length;
  }
  protected readonly tabelaVerbos = {
    colunas: ['Verbo', 'Com limite de taxa', 'Sem limite'],
    linhas: this.verbos.map((v) => [v, this.contar(v, true), this.contar(v, false)])
  };
  protected readonly graficoVerbos = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.verbos),
      yAxis: eixoValor(t, { minInterval: 1 }),
      series: [
        { name: 'Sem limite', type: 'bar', stack: 'v', data: this.verbos.map((v) => this.contar(v, false)), itemStyle: { color: t.series[0] } },
        { name: 'Com limite de taxa', type: 'bar', stack: 'v', data: this.verbos.map((v) => this.contar(v, true)), itemStyle: { color: t.series[3], borderRadius: [6, 6, 0, 0] } }
      ]
    };
  };

  private readonly tomAcesso = (v: Celula): TomStatus => (String(v).startsWith('Público') ? 'warning' : v === 'Somente Empresa' ? 'error' : v === 'Qualquer usuário autenticado' ? 'neutral' : 'success');
  protected readonly mapa: Linha[] = reflexao.map((e) => ({
    verbo: e.verbo, rota: e.rota, acao: e.acao.replace('AutenticacaoController', 'AuthController'), acesso: acesso(e.acesso), limite: e.limite || '—', cabecalho: e.cabecalho
  }));
  protected readonly colunasMapa: ColunaTabela[] = [
    { id: 'verbo', titulo: 'Verbo', filtravel: true },
    { id: 'rota', titulo: 'Rota', tipo: 'codigo', larguraMin: '16rem' },
    { id: 'acesso', titulo: 'Quem acessa', tipo: 'selo', filtravel: true, tom: this.tomAcesso },
    { id: 'limite', titulo: 'Limite', filtravel: true, secundaria: true },
    { id: 'cabecalho', titulo: 'Exige X-Locadora-Client', secundaria: true },
    { id: 'acao', titulo: 'Ação', secundaria: true, larguraMin: '14rem' }
  ];

  protected readonly sabotagens: Linha[] = [
    { alteracao: 'Tirar o [Authorize] de classe do DevolucaoController', resultado: 'Os testes de proteção reprovaram, apontando as rotas de devolução sem autorização.' },
    { alteracao: 'Rebaixar o [Authorize(Roles = "Empresa")] do POST de taxas e serviços', resultado: 'O teste de escrita em taxas reprovou, apontando a rota.' },
    { alteracao: 'Tirar o marcador ISerializadoPorEmpresa de IniciarAluguelCommand', resultado: 'A varredura de comandos reprovou, apontando o tipo.' }
  ];
  protected readonly colunasSabotagem: ColunaTabela[] = [
    { id: 'alteracao', titulo: 'Alteração provocada', larguraMin: '18rem' },
    { id: 'resultado', titulo: 'O que aconteceu', larguraMin: '18rem' }
  ];
}
