import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import endpoints from '../dados/endpoints.json';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import type { TomStatus } from '../shared/layout/status-badge.component';
import { TabelaDadosComponent, type Celula, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const VERBOS = ['GET', 'POST', 'PUT', 'DELETE'] as const;

@Component({
  selector: 'app-api',
  imports: [MatTabsModule, GraficoComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Endpoints da Web API" [valor]="dotnet.length" [apoio]="modulosDistintos + ' módulos, base /api'" icone="lucideRoute" />
      <app-kpi-card rotulo="Endpoints do ML" [valor]="ml.length" apoio="câmeras, rosto, chat e saúde" icone="lucideScanLine" />
      <app-kpi-card rotulo="Rotas públicas" [valor]="publicos" apoio="entrada, renovação e recuperação de senha" icone="lucideGlobe" />
      <app-kpi-card rotulo="Com limite próprio" [valor]="comLimite" apoio="política auth ou registro, por IP" icone="lucideTimer" />
    </div>

    <app-secao titulo="Panorama" descricao="Endpoints por módulo e por verbo, e quem pode chamar cada um." id="panorama">
      <div class="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <app-grafico titulo="Endpoints por módulo" subtitulo="Empilhados por verbo HTTP" [configurar]="graficoModulos" [altura]="380" [tabela]="tabelaModulos" resumo="Barras horizontais empilhadas com o número de endpoints de cada módulo, divididos por verbo GET, POST, PUT e DELETE." />
        <app-grafico titulo="Quem pode chamar" subtitulo="Papel exigido pelo [Authorize] efetivo" [configurar]="graficoPapeis" [altura]="380" [tabela]="tabelaPapeis" resumo="Rosca com a distribuição dos endpoints por papel exigido: Empresa, Empresa e Funcionário, autenticado e público." />
      </div>
    </app-secao>

    <app-secao titulo="Catálogo" descricao="Filtre por módulo, verbo ou papel. O papel é o efetivo: os [Authorize] da classe e do método se somam no ASP.NET, por isso uma rota de método aberto pode ficar restrita pela classe." id="catalogo">
      <mat-tab-group animationDuration="0ms" mat-stretch-tabs="false" mat-align-tabs="start">
        <mat-tab label="Web API .NET ({{ dotnet.length }})">
          <div class="pt-6">
            <app-tabela-dados [colunas]="colunasDotnet" [linhas]="linhasDotnet" legenda="endpoints da Web API .NET" arquivo="endpoints-web-api" [tamanhoInicial]="25" />
          </div>
        </mat-tab>
        <mat-tab label="Serviço de ML ({{ ml.length }})">
          <div class="flex flex-col gap-6 pt-6">
            <app-tabela-dados [colunas]="colunasMl" [linhas]="linhasMl" legenda="endpoints do serviço de ML" arquivo="endpoints-ml" [tamanhoInicial]="25" />
            <app-nota tom="info" titulo="Como o navegador chega ao ML">
              O navegador só alcança <span class="code-inline">/chat</span>, as rotas de câmera e o stream (pelo proxy, com o JWT validado na Web API). O módulo facial
              <span class="code-inline">/face/*</span> é chamado apenas pela Web API, com <span class="code-inline">X-Internal-Token</span> comparado em tempo constante.
            </app-nota>
          </div>
        </mat-tab>
        <mat-tab label="Convenções">
          <div class="flex flex-col gap-6 pt-6">
            <app-tabela-dados [colunas]="colunasConvencoes" [linhas]="convencoes" legenda="convenções da API" arquivo="convencoes-api" [tamanhoInicial]="10" />
          </div>
        </mat-tab>
      </mat-tab-group>
    </app-secao>
  `
})
export class ApiPage {
  protected readonly dotnet = endpoints.dotnet;
  protected readonly ml = endpoints.ml;

  protected readonly modulosDistintos = new Set(endpoints.dotnet.map((e) => e.modulo)).size;
  protected readonly publicos = endpoints.dotnet.filter((e) => e.papel === 'Público').length;
  protected readonly comLimite = endpoints.dotnet.filter((e) => e.limite).length;

  protected readonly linhasDotnet: Linha[] = endpoints.dotnet.map((e) => ({
    modulo: e.modulo, metodo: e.metodo, rota: e.rota, acao: e.acao, papel: e.papel, limite: e.limite
  }));

  private readonly tomVerbo = (v: Celula): TomStatus => (v === 'GET' ? 'info' : v === 'DELETE' ? 'error' : v === 'POST' ? 'success' : 'warning');
  private readonly tomPapel = (v: Celula): TomStatus => (v === 'Público' ? 'warning' : v === 'Empresa' ? 'error' : v === 'Autenticado' ? 'neutral' : 'success');

  protected readonly colunasDotnet: ColunaTabela[] = [
    { id: 'modulo', titulo: 'Módulo', filtravel: true },
    { id: 'metodo', titulo: 'Verbo', tipo: 'selo', filtravel: true, tom: this.tomVerbo },
    { id: 'rota', titulo: 'Rota', tipo: 'codigo', larguraMin: '14rem' },
    { id: 'acao', titulo: 'Ação', secundaria: true },
    { id: 'papel', titulo: 'Papel', tipo: 'selo', filtravel: true, tom: this.tomPapel },
    { id: 'limite', titulo: 'Limite', secundaria: true }
  ];

  protected readonly linhasMl: Linha[] = endpoints.ml.map((e) => ({ grupo: e.grupo, metodo: e.metodo, rota: e.rota, acesso: e.acesso, limite: e.limite }));

  protected readonly colunasMl: ColunaTabela[] = [
    { id: 'grupo', titulo: 'Grupo', filtravel: true },
    { id: 'metodo', titulo: 'Verbo', tipo: 'selo', filtravel: true, tom: this.tomVerbo },
    { id: 'rota', titulo: 'Rota', tipo: 'codigo' },
    { id: 'acesso', titulo: 'Acesso', larguraMin: '14rem' },
    { id: 'limite', titulo: 'Limite', secundaria: true }
  ];

  protected readonly convencoes: Linha[] = [
    { tema: 'Base', regra: 'Todas as rotas de negócio ficam em /api/…; o front usa caminho relativo (API_BASE_URL = /api), na mesma origem.' },
    { tema: 'Formato', regra: 'JSON; enums como texto; "<", ">" e "&" saem escapados (\\u003C) mesmo que um cliente interprete o JSON como HTML.' },
    { tema: 'Erros de negócio', regra: 'Corpo é um array de strings com a mensagem real do servidor; o front mostra essa mensagem, não "Http failure response".' },
    { tema: 'Códigos', regra: '200/201/204 sucesso; 400 entrada inválida; 401 sem sessão; 403 papel insuficiente; 404 inexistente ou de outra empresa; 409 duplicidade ou transição inválida; 413 corpo acima de 2 MB; 415 tipo de conteúdo; 422 exclusão bloqueada; 428 falta o 2FA; 429 limite de uso.' },
    { tema: 'Autenticação', regra: 'Authorization: Bearer <access token>. Refresh token só no cookie HttpOnly, e rotacionar/sair exigem X-Locadora-Client.' },
    { tema: 'Isolamento', regra: 'A empresa vem do token; um empresaId no corpo é ignorado. Ids de outra empresa respondem 404.' },
    { tema: 'Documentação interativa', regra: 'Swagger só em Development; o ML publica /docs e /openapi.json apenas com ML_ENV=development.' }
  ];

  protected readonly colunasConvencoes: ColunaTabela[] = [
    { id: 'tema', titulo: 'Tema' },
    { id: 'regra', titulo: 'Regra', larguraMin: '24rem' }
  ];

  private readonly porModulo = (() => {
    const mapa = new Map<string, Record<string, number>>();
    for (const e of endpoints.dotnet) {
      const m = mapa.get(e.modulo) ?? { GET: 0, POST: 0, PUT: 0, DELETE: 0 };
      m[e.metodo] = (m[e.metodo] ?? 0) + 1;
      mapa.set(e.modulo, m);
    }
    return [...mapa.entries()]
      .map(([modulo, verbos]) => ({ modulo, verbos, total: Object.values(verbos).reduce((x, y) => x + y, 0) }))
      .sort((x, y) => y.total - x.total);
  })();

  protected readonly tabelaModulos = {
    colunas: ['Módulo', ...VERBOS, 'Total'],
    linhas: this.porModulo.map((m) => [m.modulo, ...VERBOS.map((v) => m.verbos[v] ?? 0), m.total])
  };

  protected readonly graficoModulos = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoValor(t, { minInterval: 1 }),
      yAxis: eixoCategoria(t, this.porModulo.map((m) => m.modulo), { inverse: true, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11 } }),
      series: VERBOS.map((v, i) => ({
        name: v, type: 'bar', stack: 'verbos', data: this.porModulo.map((m) => m.verbos[v] ?? 0),
        itemStyle: { color: t.series[i] }, emphasis: { focus: 'series' }
      }))
    };
  };

  private readonly porPapel = (() => {
    const mapa = new Map<string, number>();
    for (const e of endpoints.dotnet) mapa.set(e.papel, (mapa.get(e.papel) ?? 0) + 1);
    return [...mapa.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  })();

  protected readonly tabelaPapeis = { colunas: ['Papel', 'Endpoints'], linhas: this.porPapel.map((p) => [p.name, p.value]) };

  protected readonly graficoPapeis = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'item' },
    legend: { ...baseDoGrafico(t).legend, bottom: 0 },
    series: [{
      type: 'pie', radius: ['46%', '70%'], center: ['50%', '44%'],
      itemStyle: { borderColor: t.fundoDica, borderWidth: 2, borderRadius: 6 },
      label: { color: t.texto, fontFamily: t.fonte, formatter: '{c}' },
      data: this.porPapel.map((p, i) => ({ ...p, itemStyle: { color: t.series[i % t.series.length] } }))
    }]
  });
}
