import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { ITENS_SEGURANCA } from '../dados/seguranca-itens';
import seguranca from '../dados/seguranca.json';
import { decimal, inteiro, percentual } from '../core/formato';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import type { TomStatus } from '../shared/layout/status-badge.component';
import { TabelaDadosComponent, type Celula, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const lfw = seguranca.lfw!;
const carga = seguranca.rodada!.carga;

@Component({
  selector: 'app-metricas',
  imports: [MatTabsModule, GraficoComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <app-nota tom="aviso" titulo="Medidas locais são linha de base, não previsão de produção">
      Os números abaixo vêm de uma máquina de desenvolvimento, sem rede, com pouco dado e sem concorrência real. Servem para comparar versões. Onde algo ainda não foi medido, a tabela diz
      "não medido" — nenhum valor foi inventado.
    </app-nota>

    <app-secao titulo="Quadro-resumo" descricao="Cada métrica com instrumento, meta proposta, situação e o valor atual." id="quadro">
      <app-tabela-dados [colunas]="colunasQuadro" [linhas]="quadro" legenda="quadro-resumo das métricas" arquivo="quadro-de-metricas" [tamanhoInicial]="15" />
    </app-secao>

    <app-secao titulo="Latência da API" descricao="Medição pontual de 12/out/2026: 60 requisições sequenciais por rota, autenticado como Empresa, só leitura, uma chamada de aquecimento descartada." id="latencia">
      <div class="grid gap-6 sm:grid-cols-3">
        <app-kpi-card rotulo="Meta de p95 (local)" valor="≤ 200 ms" apoio="proposta do trabalho" icone="lucideTimer" />
        <app-kpi-card rotulo="Pior p95 medido" [valor]="piorP95 + ' ms'" apoio="GET /api/alugueis" icone="lucideGauge" />
        <app-kpi-card rotulo="Melhor p50" [valor]="melhorP50 + ' ms'" apoio="GET /api/clientes" icone="lucideCircleCheck" />
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico titulo="p50 e p95 por rota" subtitulo="Milissegundos, n = 60 por rota; muito abaixo dos 200 ms da meta" [configurar]="graficoLatencia" [altura]="340" [tabela]="tabelaLatencia" resumo="Barras agrupadas com a mediana e o percentil 95 da latência de seis rotas de leitura da API, todas abaixo de 20 milissegundos." />
        <app-grafico titulo="p95 sob concorrência" subtitulo="Rodada de carga de 13/out/2026: 10, 50 e 100 usuários simultâneos" [configurar]="graficoConcorrencia" [altura]="340" [tabela]="tabelaConcorrencia" resumo="Linhas com o percentil 95 da latência de três rotas de leitura crescendo de 10 para 100 usuários simultâneos, todas abaixo de 110 milissegundos." />
      </div>
    </app-secao>

    <app-secao titulo="Pacote do front-end" id="pacote">
      <div class="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <app-grafico titulo="Tamanho do pacote inicial (bruto)" subtitulo="Antes e depois da migração de UI, com os orçamentos do angular.json" [configurar]="graficoPacote" [altura]="300" [tabela]="tabelaPacote" resumo="Barras com o pacote inicial de 1.700 kB antes da migração e 785 kB depois, comparados ao orçamento de aviso de 900 kB e ao de erro de 1.500 kB." />
        <app-tabela-dados [colunas]="colunasPacote" [linhas]="pacote" legenda="tamanho do pacote do front-end" arquivo="pacote-front" [tamanhoInicial]="10" />
      </div>
    </app-secao>

    <app-secao titulo="Reconhecimento facial (LFW)" descricao="Protocolo oficial de 10 dobras, 6.000 pares, SFace com alinhamento por 5 pontos do MediaPipe; detalhes na página do serviço de ML." id="facial">
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <app-kpi-card rotulo="Acurácia" [valor]="percentual(lfw.acuracia)" [apoio]="'± ' + percentual(lfw.desvio, 1) + ' entre as dobras'" icone="lucideScanFace" />
        <app-kpi-card rotulo="EER" [valor]="percentual((lfw.eer.FAR + lfw.eer.FRR) / 2)" [apoio]="'no limiar ' + decimal(lfw.eer.limiar, 3)" icone="lucideScale" />
        <app-kpi-card rotulo="FAR no limiar 0,363" [valor]="percentual(lfw.limiares[3].FAR, 3)" apoio="impostor aceito (1 em ~1.500)" icone="lucideShieldCheck" />
        <app-kpi-card rotulo="FRR no limiar 0,363" [valor]="percentual(lfw.limiares[3].FRR, 2)" apoio="pessoa certa recusada" icone="lucideUsers" />
      </div>
    </app-secao>

    <app-secao titulo="Plano de medição" descricao="O que ainda será medido, como e com qual meta. As metas são propostas deste trabalho e podem ser ajustadas pela banca." id="plano">
      <mat-tab-group animationDuration="0ms" mat-align-tabs="start">
        <mat-tab label="Leitura de placa">
          <div class="flex flex-col gap-6 pt-6">
            <div class="grid gap-6 md:grid-cols-2">
              <article class="border-border bg-card flex flex-col gap-2 rounded-xl border p-6">
                <h3 class="text-title-m text-foreground">Definições</h3>
                <ul class="text-body-m text-muted-foreground list-disc pl-5">
                  <li><strong>Tempo de leitura</strong> T = t_confirmada − t_visível: do primeiro quadro com a placa legível até a emissão (duas leituras iguais em 3 s).</li>
                  <li><strong>Taxa de acerto</strong>: fração das apresentações em que a placa emitida é idêntica à real.</li>
                  <li><strong>CER</strong> = (S + D + I) / N: distância de Levenshtein sobre os caracteres da placa. Exemplo real: BRA2E19 lida como BKA2E19 tem CER ≈ 14,3 %.</li>
                </ul>
              </article>
              <article class="border-border bg-card flex flex-col gap-2 rounded-xl border p-6">
                <h3 class="text-title-m text-foreground">Protocolo proposto</h3>
                <ol class="text-body-m text-muted-foreground list-decimal pl-5">
                  <li>10 placas (antigo e Mercosul), impressas em tamanho real, diante da webcam.</li>
                  <li>Distância (50 cm, 1 m, 2 m), luz (clara e baixa) e ângulo (0° e 30°), 5 repetições por combinação.</li>
                  <li>Registrar T, placa emitida, CER e se houve leitura aproximada; reportar mediana e p95 de T.</li>
                  <li>Ligar SAVE_CROPS só durante o teste e apagar a pasta crops/ depois.</li>
                </ol>
              </article>
            </div>
            <app-nota tom="info">Nenhuma medição com webcam real foi feita; os testes existentes usam cenas sintéticas. Meta proposta: placa confirmada em até 5 s e acerto de pelo menos 90 %.</app-nota>
          </div>
        </mat-tab>
        <mat-tab label="Usabilidade (SUS e tarefas)">
          <div class="flex flex-col gap-6 pt-6">
            <div class="grid gap-6 md:grid-cols-2">
              <article class="border-border bg-card flex flex-col gap-2 rounded-xl border p-6">
                <h3 class="text-title-m text-foreground">Questionário SUS</h3>
                <p class="text-body-m text-muted-foreground">
                  Dez afirmativas de 1 a 5, alternando tom positivo e negativo. Pontuação = 2,5 × [Σ(x<sub>ímpares</sub> − 1) + Σ(5 − x<sub>pares</sub>)], de 0 a 100 — não é um percentual.
                  A média de referência da literatura é cerca de 68; acima de 80 costuma ser excelente. Meta: média ≥ 68 (alvo ≥ 80) com n ≥ 5.
                </p>
              </article>
              <article class="border-border bg-card flex flex-col gap-2 rounded-xl border p-6">
                <h3 class="text-title-m text-foreground">Tarefas cronometradas</h3>
                <p class="text-body-m text-muted-foreground">
                  Sem ajuda, com n ≥ 5. Sucesso com intervalo de confiança (Wilson), tempo pela média geométrica ou mediana e erros por tentativa. Os tempos são hipóteses a calibrar após um piloto de 2 pessoas.
                </p>
              </article>
            </div>
            <app-tabela-dados [colunas]="colunasTarefas" [linhas]="tarefas" legenda="tarefas cronometradas propostas" arquivo="tarefas-sus" [tamanhoInicial]="10" />
          </div>
        </mat-tab>
        <mat-tab label="Heurísticas de Nielsen">
          <div class="flex flex-col gap-6 pt-6">
            <app-grafico titulo="Problemas encontrados × número de avaliadores" subtitulo="Achados(n) = 1 − (1 − λ)ⁿ, com λ ≈ 0,31: cinco avaliadores encontram cerca de 84 %" [configurar]="graficoNielsen" [altura]="300" [tabela]="tabelaNielsen" resumo="Curva crescente com retorno decrescente: um avaliador encontra 31 por cento dos problemas, cinco encontram 84 por cento e dez encontram 98 por cento." />
            <app-tabela-dados [colunas]="colunasHeuristicas" [linhas]="heuristicas" legenda="autoavaliação pelas heurísticas de Nielsen" arquivo="heuristicas-nielsen" [tamanhoInicial]="10" />
            <app-nota tom="aviso">Autoavaliação preliminar do desenvolvedor: não substitui a avaliação independente com pelo menos três avaliadores.</app-nota>
          </div>
        </mat-tab>
      </mat-tab-group>
    </app-secao>
  `
})
export class MetricasPage {
  protected readonly lfw = lfw;
  protected readonly percentual = percentual;
  protected readonly decimal = decimal;
  protected readonly inteiro = inteiro;

  private readonly tomSituacao = (v: Celula): TomStatus => (v === 'Medido' ? 'success' : v === 'Parcial' ? 'warning' : 'neutral');

  protected readonly quadro: Linha[] = [
    { metrica: 'Lighthouse (Desempenho, Acessibilidade, Boas práticas)', instrumento: 'Lighthouse CI com script de login', meta: 'Acessibilidade ≥ 95; Desempenho ≥ 90', situacao: 'Planejado', valor: 'não medido' },
    { metrica: 'Web Vitals (LCP, CLS, INP/TBT)', instrumento: 'Lighthouse (laboratório) e web-vitals (campo)', meta: 'LCP ≤ 2,5 s; CLS ≤ 0,1; INP ≤ 200 ms', situacao: 'Planejado', valor: 'não medido' },
    { metrica: 'Tamanho do pacote inicial', instrumento: 'ng build e orçamentos do angular.json', meta: '≤ 900 kB', situacao: 'Medido', valor: '≈ 785 kB bruto · ≈ 188 kB transferido' },
    { metrica: 'Latência da API (p50/p95)', instrumento: 'Script de percentis e rodada de carga', meta: 'p95 ≤ 200 ms (local)', situacao: 'Parcial', valor: 'p95 de 7,6 a 17,8 ms em 6 rotas; até 102,8 ms com 100 usuários' },
    { metrica: 'Tempo de leitura de placa', instrumento: 'Cronômetro no ML e protocolo de bancada', meta: '≤ 5 s; acerto ≥ 90 %', situacao: 'Planejado', valor: 'não medido' },
    { metrica: 'Reconhecimento facial', instrumento: 'LFW, 6.000 pares, 10 dobras', meta: 'Acurácia alta com FAR baixo', situacao: 'Medido', valor: `${percentual(lfw.acuracia)} · FAR ${percentual(lfw.limiares[3].FAR, 3)} · FRR ${percentual(lfw.limiares[3].FRR, 1)}` },
    { metrica: 'Violações do axe', instrumento: 'axe-core nos specs do Karma', meta: '0 graves/críticas por tela', situacao: 'Planejado', valor: 'não medido' },
    { metrica: 'Questionário SUS', instrumento: '10 perguntas, n ≥ 5', meta: 'Média ≥ 68; alvo ≥ 80', situacao: 'Planejado', valor: 'não aplicado' },
    { metrica: 'Tarefas cronometradas', instrumento: '3 tarefas, n ≥ 5', meta: 'Sucesso ≥ 90 %', situacao: 'Planejado', valor: 'não aplicado' },
    { metrica: 'Heurísticas de Nielsen', instrumento: 'Avaliação com ≥ 3 avaliadores', meta: 'Nenhum problema de severidade ≥ 3', situacao: 'Parcial', valor: 'autoavaliação preliminar' },
    { metrica: 'Achados de segurança fechados', instrumento: 'Painel S1–S35 e bateria de ataques', meta: '0 abertos até a prioridade "urgente"', situacao: 'Parcial', valor: `${ITENS_SEGURANCA.filter((i) => i.estado === 'Corrigido').length} corrigidos · ${ITENS_SEGURANCA.filter((i) => i.estado === 'Parcial').length} parciais · ${ITENS_SEGURANCA.filter((i) => i.estado === 'Ignorado').length} ignorados` },
    { metrica: 'Testes automatizados', instrumento: 'MSTest, pytest, Karma', meta: '100 % verdes', situacao: 'Medido', valor: 'todos verdes nas execuções registradas' }
  ];

  protected readonly colunasQuadro: ColunaTabela[] = [
    { id: 'metrica', titulo: 'Métrica', larguraMin: '14rem' },
    { id: 'instrumento', titulo: 'Instrumento', secundaria: true, larguraMin: '12rem' },
    { id: 'meta', titulo: 'Meta proposta', larguraMin: '10rem' },
    { id: 'situacao', titulo: 'Situação', tipo: 'selo', filtravel: true, tom: this.tomSituacao },
    { id: 'valor', titulo: 'Valor atual', larguraMin: '12rem' }
  ];

  private readonly latencias = [
    ['/api/dashboard/resumo', 12.5, 15.7, 124.2],
    ['/api/alugueis', 7.3, 17.8, 25.7],
    ['/api/automoveis', 6.5, 10.5, 58.5],
    ['/api/clientes', 6.4, 7.6, 74.8],
    ['/api/alugueis/em-aberto', 6.7, 9.3, 14.9],
    ['/api/configuracoes', 6.7, 8.3, 12.6]
  ] as const;

  protected readonly piorP95 = decimal(Math.max(...this.latencias.map((l) => l[2])));
  protected readonly melhorP50 = decimal(Math.min(...this.latencias.map((l) => l[1])));

  protected readonly tabelaLatencia = {
    colunas: ['Rota (GET)', 'p50 (ms)', 'p95 (ms)', 'máx (ms)'],
    linhas: this.latencias.map(([r, a, b, c]) => [r, decimal(a), decimal(b), decimal(c)])
  };
  protected readonly graficoLatencia = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => decimal(v) + ' ms' },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.latencias.map((l) => l[0].replace('/api/', '')), { axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 10, interval: 0, rotate: 30 } }),
      yAxis: eixoValor(t, { name: 'ms', nameTextStyle: { color: t.textoSecundario } }),
      series: [
        { name: 'p50', type: 'bar', data: this.latencias.map((l) => l[1]), itemStyle: { color: t.series[0], borderRadius: [4, 4, 0, 0] } },
        { name: 'p95', type: 'bar', data: this.latencias.map((l) => l[2]), itemStyle: { color: t.series[1], borderRadius: [4, 4, 0, 0] } }
      ]
    };
  };

  private readonly leituras = ['GET /api/clientes', 'GET /api/dashboard/resumo', 'GET /api/automoveis'];
  private readonly concorrencias = [10, 50, 100];
  private p95(cenario: string, conc: number): number {
    return carga.find((c) => c.cenario === cenario && c.concorrencia === conc)?.p95 ?? 0;
  }
  protected readonly tabelaConcorrencia = {
    colunas: ['Cenário', ...this.concorrencias.map((c) => `${c} usuários (p95, ms)`)],
    linhas: this.leituras.map((l) => [l, ...this.concorrencias.map((c) => decimal(this.p95(l, c)))])
  };
  protected readonly graficoConcorrencia = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', valueFormatter: (v: number) => decimal(v) + ' ms' },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.concorrencias.map((c) => `${c} usuários`)),
      yAxis: eixoValor(t, { name: 'ms', nameTextStyle: { color: t.textoSecundario } }),
      series: this.leituras.map((l, i) => ({
        name: l.replace('GET ', ''), type: 'line', symbol: ['circle', 'diamond', 'rect'][i], symbolSize: 9,
        data: this.concorrencias.map((c) => this.p95(l, c)), lineStyle: { color: t.series[i], width: 2 }, itemStyle: { color: t.series[i] }
      }))
    };
  };

  private readonly pacotes = [
    ['Antes (Bootstrap + Material)', 1700],
    ['Depois da migração (Spartan + Tailwind)', 785]
  ] as const;
  protected readonly tabelaPacote = { colunas: ['Pacote inicial', 'Bruto (kB)'], linhas: this.pacotes.map(([n, v]) => [n, inteiro(v)]) };
  protected readonly graficoPacote = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 56, top: 16, bottom: 8, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => inteiro(v) + ' kB' },
    xAxis: eixoValor(t, { max: 1800, splitNumber: 4 }),
    yAxis: eixoCategoria(t, this.pacotes.map(([n]) => n), { inverse: true, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11, width: 130, overflow: 'break' } }),
    series: [{
      type: 'bar', barWidth: 28,
      data: this.pacotes.map(([, v], i) => ({ value: v, itemStyle: { color: i === 0 ? t.erro : t.sucesso, borderRadius: [0, 6, 6, 0] } })),
      label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte, formatter: (p: { value: number }) => inteiro(p.value) + ' kB' },
      markLine: {
        symbol: 'none', silent: true, lineStyle: { type: 'dashed', color: t.textoSecundario },
        label: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 10 },
        data: [{ xAxis: 900, label: { formatter: 'aviso 900', position: 'insideEndTop' } }, { xAxis: 1500, label: { formatter: 'erro 1.500', position: 'insideEndTop' } }]
      }
    }]
  });

  protected readonly pacote: Linha[] = [
    { item: 'Pacote inicial (depois da migração)', bruto: '≈ 785 kB', transferido: '≈ 188 kB' },
    { item: 'Pacote inicial (antes)', bruto: '≈ 1,7 MB', transferido: '—' },
    { item: 'Chunk do gráfico (ECharts, sob demanda)', bruto: '≈ 580 kB', transferido: '—' },
    { item: 'Orçamento (aviso / erro)', bruto: '900 kB / 1,5 MB', transferido: '—' }
  ];
  protected readonly colunasPacote: ColunaTabela[] = [
    { id: 'item', titulo: 'Item', larguraMin: '12rem' },
    { id: 'bruto', titulo: 'Bruto', tipo: 'numero' },
    { id: 'transferido', titulo: 'Transferido', tipo: 'numero' }
  ];

  protected readonly tarefas: Linha[] = [
    { tarefa: 'T1 Cadastrar cliente PF', percurso: 'Lista de clientes → cliente salvo', meta: 'Sucesso ≥ 90 %; ≤ 90 s' },
    { tarefa: 'T2 Criar aluguel com cupom', percurso: 'Home → aluguel salvo com o resumo conferido', meta: 'Sucesso ≥ 90 %; ≤ 3 min' },
    { tarefa: 'T3 Registrar devolução', percurso: 'Monitoramento ou lista → recibo', meta: 'Sucesso ≥ 90 %; ≤ 2 min' }
  ];
  protected readonly colunasTarefas: ColunaTabela[] = [
    { id: 'tarefa', titulo: 'Tarefa', larguraMin: '12rem' },
    { id: 'percurso', titulo: 'Ponto de partida e fim', larguraMin: '16rem' },
    { id: 'meta', titulo: 'Meta proposta' }
  ];

  private readonly avaliadores = Array.from({ length: 10 }, (_, i) => i + 1);
  protected readonly tabelaNielsen = {
    colunas: ['Avaliadores', 'Problemas encontrados'],
    linhas: this.avaliadores.map((n) => [n, percentual(1 - Math.pow(0.69, n), 0)])
  };
  protected readonly graficoNielsen = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 24, top: 16, bottom: 24, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', valueFormatter: (v: number) => decimal(v, 0) + ' %' },
    xAxis: eixoCategoria(t, this.avaliadores, { name: 'avaliadores', nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: t.textoSecundario } }),
    yAxis: eixoValor(t, { max: 100, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, formatter: '{value}%' } }),
    series: [{
      type: 'line', smooth: true, symbolSize: 8, data: this.avaliadores.map((n) => Number(((1 - Math.pow(0.69, n)) * 100).toFixed(1))),
      lineStyle: { color: t.series[0], width: 3 }, itemStyle: { color: t.series[0] }, areaStyle: { color: t.series[0], opacity: 0.1 },
      markPoint: { symbolSize: 54, itemStyle: { color: t.series[1] }, label: { color: t.texto, fontSize: 11, formatter: '84 %' }, data: [{ coord: [4, 84.4] }] }
    }]
  });

  protected readonly heuristicas: Linha[] = [
    { heuristica: '1 Visibilidade do estado', faz: 'Skeleton, estados de carregamento/vazio/erro, toasts, "Alterações não salvas"', lacuna: 'Sem "atualizado há X"' },
    { heuristica: '2 Correspondência com o mundo real', faz: 'pt-BR; máscaras de CPF, CNPJ e placa; moeda local', lacuna: 'Placa sem máscara em algumas listas' },
    { heuristica: '3 Controle e liberdade', faz: 'Cancelar, aviso ao fechar a aba, guarda de rota (canDeactivate)', lacuna: 'Sem desfazer' },
    { heuristica: '4 Consistência e padrões', faz: 'crudLista/crudForm, tokens, um só conjunto de ícones', lacuna: '—' },
    { heuristica: '5 Prevenção de erros', faz: 'Validação de dígito, simulação do valor, confirmação destrutiva, bloqueio de exclusão com vínculo', lacuna: 'CPF/CNPJ só no front (hoje também no servidor, S13)' },
    { heuristica: '6 Reconhecimento em vez de memória', faz: 'Menu com rótulos, paleta Ctrl+K, filtros com chips', lacuna: 'Rotas filhas escondidas com o menu recolhido' },
    { heuristica: '7 Flexibilidade e eficiência', faz: 'Atalhos, densidade da tabela, CSV, estado na URL', lacuna: 'Sem seleção em massa' },
    { heuristica: '8 Estética e minimalismo', faz: 'Uma ação primária por tela, hierarquia tipográfica', lacuna: '—' },
    { heuristica: '9 Ajudar a diagnosticar erros', faz: 'Mensagem real do servidor no toast', lacuna: 'Erro não mapeado ao campo' },
    { heuristica: '10 Ajuda e documentação', faz: 'Assistente (chatbot) e textos de apoio nos campos', lacuna: 'Sem manual nem ajuda contextual' }
  ];
  protected readonly colunasHeuristicas: ColunaTabela[] = [
    { id: 'heuristica', titulo: 'Heurística', larguraMin: '12rem' },
    { id: 'faz', titulo: 'O que o sistema já faz', larguraMin: '18rem' },
    { id: 'lacuna', titulo: 'Lacuna conhecida', larguraMin: '12rem' }
  ];
}
