import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import seguranca from '../dados/seguranca.json';
import { decimal, inteiro } from '../core/formato';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { CodigoComponent } from '../shared/layout/codigo.component';
import { ConceitosComponent, type Conceito } from '../shared/layout/conceitos.component';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import type { TomStatus } from '../shared/layout/status-badge.component';
import { TabelaDadosComponent, type Celula, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const rodada = seguranca.rodada!;

const ROTULO_SEVERIDADE: Record<string, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

@Component({
  selector: 'app-ataques',
  imports: [MatTabsModule, GraficoComponent, CodigoComponent, ConceitosComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Verificações" [valor]="rodada.total" [apoio]="'rodada do commit ' + rodada.commit" icone="lucideShieldAlert" />
      <app-kpi-card rotulo="Aprovadas" [valor]="rodada.aprovadas" apoio="o ataque foi barrado" icone="lucideCircleCheck" />
      <app-kpi-card rotulo="Reprovadas" [valor]="rodada.reprovadas" apoio="achados novos: nenhum" icone="lucideCircleX" />
      <app-kpi-card rotulo="Informativas" [valor]="rodada.informativas" apoio="registram um fato ou uma pendência conhecida" icone="lucideInfo" />
    </div>

    <app-secao titulo="Como funciona" descricao="Uma bateria versionada que ataca uma instância de teste e compara o resultado com o que deveria acontecer." id="metodo">
      <div class="grid gap-6 lg:grid-cols-2">
        <article class="border-border bg-card flex h-full flex-col gap-4 rounded-xl border p-6">
          <h3 class="text-title-m text-foreground">O ciclo de uma rodada</h3>
          <p class="text-body-m text-muted-foreground">
            <span class="code-inline">Testes-Seguranca/</span> usa só a biblioteca padrão do Python. O script sobe uma Web API (porta 5180, limites padrão) e um ML em modo de produção (8001)
            contra o banco separado <span class="code-inline">LocadoraDeVeiculos_Seguranca</span>, ataca, mede, e uma segunda API (5181, limite global alto) recebe a carga.
          </p>
          <p class="text-body-m text-muted-foreground">
            Cada rodada grava <span class="code-inline">resultado.json</span> e <span class="code-inline">resumo.md</span> em uma pasta própria, fora do repositório; <span class="code-inline">comparar</span>
            lista quem passou a passar entre duas rodadas. Cada correção de segurança vira um commit com o ataque que a verifica.
          </p>
          <app-codigo class="mt-auto" rotulo="Testes-Seguranca" [texto]="comandos" />
        </article>
        <article class="border-border bg-card flex h-full flex-col gap-4 rounded-xl border p-6">
          <h3 class="text-title-m text-foreground">O que cada categoria ataca</h3>
          <ul class="flex flex-1 flex-col justify-between gap-3">
            @for (c of letras; track c.letra) {
              <li class="flex items-center gap-3">
                <span class="bg-primary-container text-on-primary-container text-title-s flex size-9 shrink-0 items-center justify-center rounded-full">{{ c.letra }}</span>
                <span class="text-body-m text-foreground">{{ c.nome }}</span>
              </li>
            }
          </ul>
        </article>
      </div>
    </app-secao>

    <app-secao titulo="A teoria da bateria" descricao="Por que o teste de segurança é escrito como ataque, e como ler cada número." id="teoria">
      <app-conceitos [itens]="conceitos" />
    </app-secao>

    <app-secao titulo="Resultado por categoria" descricao="Cada barra é uma categoria de ataque; nenhuma verificação reprovou." id="categorias">
      <div class="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <app-grafico titulo="Verificações por categoria" subtitulo="Rodada de referência" [configurar]="graficoCategorias" [altura]="360" [tabela]="tabelaCategorias" resumo="Barras horizontais empilhadas com as verificações de cada categoria, divididas em aprovadas, informativas e reprovadas." />
        <app-grafico titulo="Por severidade" subtitulo="Severidade atribuída a cada verificação" [configurar]="graficoSeveridade" [altura]="360" [tabela]="tabelaSeveridade" resumo="Rosca com as verificações por severidade: alta, média e baixa." />
      </div>
    </app-secao>

    <app-secao titulo="Evolução entre rodadas" descricao="A primeira rodada completa, antes das correções, tinha 21 reprovações; cada correção virou um ataque que passou a passar." id="evolucao">
      <app-grafico titulo="Aprovadas e reprovadas por rodada" subtitulo="Rodadas completas, na ordem em que foram executadas (uma por commit)" [configurar]="graficoEvolucao" [altura]="340" [tabela]="tabelaEvolucao" resumo="Linhas que mostram o número de verificações aprovadas subindo de 65 para 154 e o de reprovadas caindo de 21 para zero ao longo das rodadas." />
    </app-secao>

    <app-secao titulo="Carga" descricao="Cenários de leitura e de login com 5 a 100 usuários simultâneos, 10 segundos cada, contra a instância de carga (porta 5181, banco de teste)." id="carga">
      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico titulo="Latência p95 por concorrência" subtitulo="Milissegundos; quanto menor, melhor" [configurar]="graficoCarga" [altura]="320" [tabela]="tabelaCarga" resumo="Barras agrupadas com a latência p95 de cada cenário de leitura em 10, 50 e 100 usuários simultâneos." />
        <app-grafico titulo="Requisições por segundo" subtitulo="Vazão sustentada em cada cenário de leitura" [configurar]="graficoVazao" [altura]="320" [tabela]="tabelaVazao" resumo="Barras agrupadas com a vazão em requisições por segundo de cada cenário de leitura em 10, 50 e 100 usuários simultâneos." />
      </div>
      <app-nota tom="info" titulo="Como ler">
        Medidas locais (API e cliente de teste na mesma máquina, banco com poucos dados). O login é lento de propósito: o hash PBKDF2 de 210.000 iterações custa centenas de milissegundos.
        Em toda a carga foram <strong>0 erros 5xx e 0 conexões derrubadas</strong>; a memória do processo ao fim foi de {{ memoria }} MB.
      </app-nota>
    </app-secao>

    <app-secao titulo="Catálogo das verificações" descricao="As {{ rodada.total }} verificações da rodada, com filtros por categoria, resultado e severidade." id="catalogo">
      <mat-tab-group animationDuration="0ms" mat-align-tabs="start">
        <mat-tab label="Todas ({{ rodada.total }})">
          <div class="pt-6">
            <app-tabela-dados [colunas]="colunasVerificacoes" [linhas]="verificacoes" legenda="verificações da bateria de ataques" arquivo="verificacoes-de-ataque" [tamanhoInicial]="25" />
          </div>
        </mat-tab>
        <mat-tab label="Carga">
          <div class="pt-6">
            <app-tabela-dados [colunas]="colunasCarga" [linhas]="medicoes" legenda="medições de carga" arquivo="medicoes-de-carga" [tamanhoInicial]="25" />
          </div>
        </mat-tab>
      </mat-tab-group>
    </app-secao>
  `
})
export class AtaquesPage {
  protected readonly rodada = rodada;
  protected readonly memoria = '470,8';

  protected readonly comandos = ['./rodar.sh ataques   # só os ataques', './rodar.sh carga      # só a carga', './rodar.sh tudo       # ataques + carga', './rodar.sh comparar   # quem passou a passar', './rodar.sh limpar     # apaga os dados de teste'].join('\n');

  protected readonly conceitos: Conceito[] = [
    { termo: 'Verificação, achado e referência', definicao: 'Uma verificação é um ataque com resultado esperado e resultado obtido; ela passa se os dois coincidem. Um achado (S1–S35) é o defeito que uma verificação reprovada revelou, e a coluna "Achado" liga os dois.', noSistema: 'Cada verificação tem ID de categoria (A01, B11…), severidade (alta, média, baixa) e, quando existe, o S# que ela guarda.' },
    { termo: 'Ataque reproduzível e regressão', definicao: 'Um ataque escrito como código roda igual a cada versão. Um defeito corrigido que volta a aparecer é uma regressão, e só um teste automatizado a pega a tempo.', noSistema: 'A primeira rodada completa reprovou 21 verificações; cada correção virou uma verificação que passou a passar e que é reexecutada a cada rodada.' },
    { termo: 'Informativa e pendente', definicao: 'Nem toda verificação é aprovada ou reprovada: algumas só registram um fato (Swagger ligado em desenvolvimento, memória do processo) ou uma pendência conhecida que depende de decisão de produto.', noSistema: 'Uma pendência conhecida aparece em toda rodada sem reprovar.' },
    { termo: 'Percentis de latência (p50, p95, p99)', definicao: 'A média esconde a cauda: poucos pedidos lentos mexem pouco nela e muito na experiência. O p95 é o valor abaixo do qual estão 95 % dos pedidos; o p99, 99 %.', noSistema: 'Os cenários de carga reportam p50, p95, p99 e máximo; a meta de leitura é p95 abaixo de 1.000 ms com 50 usuários e a de login, abaixo de 3.000 ms.' },
    { termo: 'Por que o login é lento de propósito', definicao: 'Senhas são guardadas com um hash propositalmente caro (PBKDF2): cada tentativa custa centenas de milissegundos, o que torna a força bruta inviável.', noSistema: '210.000 iterações; o mesmo custo é pago para e-mail inexistente, para que o tempo não revele quais contas existem.' },
    { termo: 'Corridas (race conditions)', definicao: 'Quando dois pedidos simultâneos leem o mesmo estado antes de qualquer um gravar, ambos podem "ganhar". Só um teste com pedidos realmente paralelos revela isso.', noSistema: 'Dez pedidos simultâneos para o mesmo carro criam no máximo um aluguel; um cupom de uso único usado por seis pedidos vale uma vez.' }
  ];

  protected readonly letras = [
    { letra: 'A', nome: 'Autenticação: JWT forjado, refresh, bloqueio, limites e enumeração' },
    { letra: 'B', nome: 'Autorização: papéis, IDOR entre empresas, auditoria e funcionário desligado' },
    { letra: 'C', nome: 'Entradas: SQL, XSS, corpo grande, JSON malformado, fotos' },
    { letra: 'D', nome: 'Configuração: cabeçalhos, CORS, Swagger, modo de produção do ML e hashes' },
    { letra: 'E', nome: 'ML: token interno, isolamento das câmeras, /docs, /chat e limites' },
    { letra: 'F', nome: 'Conta e privacidade: consentimento, 2FA e recuperação de senha' },
    { letra: 'G', nome: 'Robustez: fuzz, replay do TOTP, corridas, Host forjado e tempo' },
    { letra: 'H', nome: 'Regras de negócio: reserva dupla, cupom, período e preço' }
  ];

  private readonly categorias = [...rodada.porCategoria].sort((a, b) => b.total - a.total);
  protected readonly tabelaCategorias = {
    colunas: ['Categoria', 'Total', 'Aprovadas', 'Informativas', 'Reprovadas'],
    linhas: this.categorias.map((c) => [c.categoria, c.total, c.aprovadas, c.informativas, c.reprovadas])
  };
  protected readonly graficoCategorias = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 24, top: 36, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoValor(t, { minInterval: 1 }),
      yAxis: eixoCategoria(t, this.categorias.map((c) => c.categoria), { inverse: true }),
      series: [
        { name: 'Aprovadas', type: 'bar', stack: 'r', data: this.categorias.map((c) => c.aprovadas), itemStyle: { color: t.sucesso } },
        { name: 'Informativas', type: 'bar', stack: 'r', data: this.categorias.map((c) => c.informativas), itemStyle: { color: t.aviso } },
        { name: 'Reprovadas', type: 'bar', stack: 'r', data: this.categorias.map((c) => c.reprovadas), itemStyle: { color: t.erro } }
      ]
    };
  };

  private readonly severidades = rodada.porSeveridade.map((s) => ({ name: ROTULO_SEVERIDADE[s.severidade] ?? s.severidade, value: s.total }));
  protected readonly tabelaSeveridade = { colunas: ['Severidade', 'Verificações'], linhas: this.severidades.map((s) => [s.name, s.value]) };
  protected readonly graficoSeveridade = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'item' },
    legend: { ...baseDoGrafico(t).legend, bottom: 0 },
    series: [{
      type: 'pie', radius: ['46%', '70%'], center: ['50%', '44%'],
      itemStyle: { borderColor: t.fundoDica, borderWidth: 2, borderRadius: 6 },
      label: { color: t.texto, fontFamily: t.fonte, formatter: '{c}' },
      data: this.severidades.map((s, i) => ({ ...s, itemStyle: { color: [t.erro, t.aviso, t.series[0]][i] ?? t.series[i] } }))
    }]
  });

  // só rodadas completas (as parciais rodam um módulo) e a última de cada commit
  private readonly evolucao = (() => {
    const completas = rodada.evolucao.filter((e) => e.total >= 60);
    const porCommit = new Map<string, (typeof completas)[number]>();
    for (const e of completas) porCommit.set(e.commit, e);
    return [...porCommit.values()];
  })();
  protected readonly tabelaEvolucao = {
    colunas: ['Commit', 'Verificações', 'Aprovadas', 'Reprovadas'],
    linhas: this.evolucao.map((e) => [e.commit, e.total, e.aprovadas, e.reprovadas])
  };
  protected readonly graficoEvolucao = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis' },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.evolucao.map((e) => e.commit), { name: 'commit', nameLocation: 'end', nameTextStyle: { color: t.textoSecundario } }),
      yAxis: eixoValor(t, { minInterval: 1 }),
      series: [
        { name: 'Aprovadas', type: 'line', data: this.evolucao.map((e) => e.aprovadas), symbolSize: 8, lineStyle: { color: t.sucesso, width: 2 }, itemStyle: { color: t.sucesso }, areaStyle: { color: t.sucesso, opacity: 0.08 } },
        { name: 'Reprovadas', type: 'line', data: this.evolucao.map((e) => e.reprovadas), symbol: 'diamond', symbolSize: 9, lineStyle: { color: t.erro, width: 2, type: 'dashed' }, itemStyle: { color: t.erro } }
      ]
    };
  };

  private readonly leituras = ['GET /api/clientes', 'GET /api/dashboard/resumo', 'GET /api/automoveis'];
  private readonly concorrencias = [10, 50, 100];
  private valorDe(cenario: string, conc: number, campo: 'p95' | 'rps'): number {
    return rodada.carga.find((c) => c.cenario === cenario && c.concorrencia === conc)?.[campo] ?? 0;
  }
  protected readonly tabelaCarga = {
    colunas: ['Cenário', ...this.concorrencias.map((c) => c + ' usuários (p95, ms)')],
    linhas: this.leituras.map((l) => [l, ...this.concorrencias.map((c) => decimal(this.valorDe(l, c, 'p95'), 1))])
  };
  protected readonly tabelaVazao = {
    colunas: ['Cenário', ...this.concorrencias.map((c) => c + ' usuários (req/s)')],
    linhas: this.leituras.map((l) => [l, ...this.concorrencias.map((c) => inteiro(Math.round(this.valorDe(l, c, 'rps'))))])
  };
  private serieCarga(t: TemaGrafico, campo: 'p95' | 'rps', formato: (v: number) => string) {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.leituras.map((l) => l.replace('GET /api/', ''))),
      yAxis: eixoValor(t),
      series: this.concorrencias.map((c, i) => ({
        name: c + ' usuários', type: 'bar', itemStyle: { color: t.series[i], borderRadius: [4, 4, 0, 0] },
        data: this.leituras.map((l) => this.valorDe(l, c, campo)),
        label: { show: true, position: 'top', color: t.texto, fontFamily: t.fonte, fontSize: 10, formatter: (p: { value: number }) => formato(p.value) }
      }))
    };
  }
  protected readonly graficoCarga = (t: TemaGrafico) => this.serieCarga(t, 'p95', (v) => decimal(v, 0));
  protected readonly graficoVazao = (t: TemaGrafico) => this.serieCarga(t, 'rps', (v) => inteiro(Math.round(v)));

  private readonly tomResultado = (v: Celula): TomStatus => (v === 'Aprovada' ? 'success' : v === 'Reprovada' ? 'error' : 'warning');
  protected readonly verificacoes: Linha[] = rodada.verificacoes.map((v) => ({
    id: v.id, categoria: v.categoria, titulo: v.titulo, resultado: v.resultado, severidade: ROTULO_SEVERIDADE[v.severidade] ?? v.severidade, ref: v.ref
  }));
  protected readonly colunasVerificacoes: ColunaTabela[] = [
    { id: 'id', titulo: 'ID', tipo: 'codigo' },
    { id: 'categoria', titulo: 'Categoria', filtravel: true, secundaria: true },
    { id: 'titulo', titulo: 'Verificação', larguraMin: '22rem' },
    { id: 'resultado', titulo: 'Resultado', tipo: 'selo', filtravel: true, tom: this.tomResultado },
    { id: 'severidade', titulo: 'Severidade', filtravel: true, secundaria: true },
    { id: 'ref', titulo: 'Achado', secundaria: true }
  ];

  protected readonly medicoes: Linha[] = rodada.carga.map((c) => ({
    cenario: c.cenario, concorrencia: c.concorrencia, requisicoes: c.requisicoes, rps: Math.round(c.rps), p50: c.p50, p95: c.p95, p99: c.p99, maximo: c.max, erros: c.erros5xx + c.falhasConexao
  }));
  protected readonly colunasCarga: ColunaTabela[] = [
    { id: 'cenario', titulo: 'Cenário', filtravel: true, larguraMin: '14rem' },
    { id: 'concorrencia', titulo: 'Usuários', tipo: 'numero' },
    { id: 'requisicoes', titulo: 'Requisições', tipo: 'numero', secundaria: true },
    { id: 'rps', titulo: 'req/s', tipo: 'numero' },
    { id: 'p50', titulo: 'p50 (ms)', tipo: 'numero' },
    { id: 'p95', titulo: 'p95 (ms)', tipo: 'numero' },
    { id: 'p99', titulo: 'p99 (ms)', tipo: 'numero', secundaria: true },
    { id: 'maximo', titulo: 'máx (ms)', tipo: 'numero', secundaria: true },
    { id: 'erros', titulo: 'Erros 5xx / conexão', tipo: 'numero' }
  ];
}
