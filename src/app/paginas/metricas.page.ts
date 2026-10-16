import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { COBERTURA_ML } from '../dados/cobertura';
import { ITENS_SEGURANCA } from '../dados/seguranca-itens';
import backend from '../dados/backend.json';
import frontend from '../dados/frontend.json';
import metricas from '../dados/metricas.json';
import ml from '../dados/ml.json';
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
const rodada = seguranca.rodada!;
const carga = rodada.carga;
const lh = metricas.lighthouse!;
const e2e = metricas.e2e!;
const pacote = metricas.pacote!;
const placa = metricas.placa!;
const cob = metricas.cobertura!;
const mut = metricas.mutacao!;
const zap = seguranca.zap!;

const faixa = (xs: number[], casas = 0) => {
  const a = Math.min(...xs);
  const b = Math.max(...xs);
  return a === b ? decimal(a, casas) : `${decimal(a, casas)} a ${decimal(b, casas)}`;
};
const desktop = lh.telas.filter((t) => t.formato === 'desktop');
const celular = lh.telas.filter((t) => t.formato === 'mobile');
const leituras = carga.filter((c) => c.cenario.startsWith('GET'));
const totalCobertas = cob.dotnet!.cobertas + cob.angular!.cobertas + COBERTURA_ML.cobertas;
const totalLinhas = cob.dotnet!.linhas + cob.angular!.linhas + COBERTURA_ML.linhas;
const escritasMistas = rodada.destaques['Carga|L09' as keyof typeof rodada.destaques] ?? '';
const p95Escritas = escritasMistas.match(/^([\d.]+) ms em (\d+)/);

@Component({
  selector: 'app-metricas',
  imports: [MatTabsModule, GraficoComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Métricas medidas" [valor]="medidas + ' de ' + quadro.length" apoio="as demais têm protocolo pronto ou dependem de coleta com pessoas" icone="lucideGauge" />
      <app-kpi-card rotulo="Latência de leitura (p95)" [valor]="'até ' + p95Max + ' ms'" apoio="com 100 usuários simultâneos, sem erro 5xx" icone="lucideTimer" />
      <app-kpi-card rotulo="Cobertura de linhas" [valor]="percentual(totalCobertas / totalLinhas)" apoio="soma de .NET, Angular e ML" icone="lucideTarget" />
      <app-kpi-card rotulo="Acessibilidade" valor="0 violações" apoio="axe-core nas telas e nas páginas inteiras, nos dois temas" icone="lucideEye" />
    </div>

    <app-nota tom="info" titulo="Medidas locais são linha de base">
      Os números vêm de uma máquina de desenvolvimento, sem rede real e com poucos dados. Servem para comparar versões. O que não foi medido aparece como "não medido" ou "coleta pendente".
    </app-nota>

    <app-secao titulo="Quadro-resumo" descricao="Cada métrica com instrumento, meta, situação e valor atual." id="quadro">
      <app-tabela-dados [colunas]="colunasQuadro" [linhas]="quadro" legenda="quadro-resumo das métricas" arquivo="quadro-de-metricas" [tamanhoInicial]="20" />
    </app-secao>

    <app-secao titulo="Latência da API sob carga" descricao="Cenários de leitura com 10, 50 e 100 usuários simultâneos por 10 segundos, contra uma instância dedicada à carga. A coluna de escrita está na página Concorrência." id="latencia">
      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico titulo="p95 sob concorrência" subtitulo="Milissegundos; quanto menor, melhor" [configurar]="graficoConcorrencia" [altura]="340" [tabela]="tabelaConcorrencia" resumo="Linhas com o percentil 95 da latência de três rotas de leitura crescendo de 10 para 100 usuários simultâneos, todas abaixo de 150 milissegundos." />
        <app-grafico titulo="Vazão" subtitulo="Requisições por segundo em cada cenário" [configurar]="graficoVazao" [altura]="340" [tabela]="tabelaVazao" resumo="Barras agrupadas com a vazão em requisições por segundo de cada rota de leitura em 10, 50 e 100 usuários simultâneos." />
      </div>
      <app-tabela-dados [colunas]="colunasCarga" [linhas]="linhasCarga" legenda="medições de carga da API" arquivo="carga-da-api" [tamanhoInicial]="15" />
    </app-secao>

    <app-secao titulo="Reconhecimento facial (LFW)" descricao="Protocolo oficial de 10 dobras, 6.000 pares, SFace com alinhamento por 5 pontos do MediaPipe; detalhes na página do serviço de ML." id="facial">
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <app-kpi-card rotulo="Acurácia" [valor]="percentual(lfw.acuracia)" [apoio]="'± ' + percentual(lfw.desvio, 1) + ' entre as dobras'" icone="lucideScanFace" />
        <app-kpi-card rotulo="EER" [valor]="percentual((lfw.eer.FAR + lfw.eer.FRR) / 2)" [apoio]="'no limiar ' + decimal(lfw.eer.limiar, 3)" icone="lucideScale" />
        <app-kpi-card rotulo="FAR no limiar 0,363" [valor]="percentual(lfw.limiares[3].FAR, 3)" apoio="impostor aceito (1 em ~1.500)" icone="lucideShieldCheck" />
        <app-kpi-card rotulo="FRR no limiar 0,363" [valor]="percentual(lfw.limiares[3].FRR, 2)" apoio="pessoa certa recusada" icone="lucideUsers" />
      </div>
    </app-secao>

    <app-secao titulo="O que falta medir" descricao="Medições que dependem de câmera real ou de pessoas." id="plano">
      <mat-tab-group animationDuration="0ms" mat-align-tabs="start">
        <mat-tab label="Leitura de placa">
          <div class="flex flex-col gap-6 pt-6">
            <div class="grid gap-6 md:grid-cols-2">
              <article class="border-border bg-card flex flex-col gap-3 rounded-xl border p-6">
                <h3 class="text-title-m text-foreground">Já medido: o custo do OCR</h3>
                <p class="text-body-m text-muted-foreground">
                  {{ placa.quantidade }} placas sintéticas (metade no formato antigo, metade Mercosul, com ruído 0, 6 e 12), Tesseract {{ placa.tesseract.split('.').slice(0, 2).join('.') }}, uma thread:
                  mediana de {{ decimal(placa.p50, 0) }} ms, p95 de {{ decimal(placa.p95, 0) }} ms e máximo de {{ decimal(placa.max, 0) }} ms. O p95 é o custo do pior caso: quando não acha placa, o OCR roda as quatro tentativas.
                </p>
                <p class="text-body-s text-muted-foreground">Não inclui o YOLO nem a câmera, e o acerto não é reportado: placa desenhada com a fonte do OpenCV não representa placa real.</p>
              </article>
              <article class="border-border bg-card flex flex-col gap-3 rounded-xl border p-6">
                <h3 class="text-title-m text-foreground">Protocolo de bancada</h3>
                <ol class="text-body-m text-muted-foreground list-decimal pl-5">
                  <li>10 placas (antigo e Mercosul), impressas em tamanho real, diante da webcam.</li>
                  <li>Distância (50 cm, 1 m, 2 m), luz (clara e baixa) e ângulo (0° e 30°), 5 repetições por combinação.</li>
                  <li>Registrar tempo de leitura, placa emitida, taxa de erro de caracteres e se houve leitura aproximada.</li>
                  <li>Ligar SAVE_CROPS só durante o teste e apagar a pasta de recortes depois.</li>
                </ol>
              </article>
            </div>
            <app-nota tom="info">Meta: placa confirmada em até 5 s e acerto de pelo menos 90 %. Taxa de erro de caracteres = (substituições + remoções + inserções) ÷ caracteres da placa; BRA2E19 lida como BKA2E19 dá cerca de 14,3 %.</app-nota>
          </div>
        </mat-tab>
        <mat-tab label="Usabilidade com pessoas">
          <div class="flex flex-col gap-6 pt-6">
            <div class="grid gap-6 md:grid-cols-2">
              <article class="border-border bg-card flex flex-col gap-3 rounded-xl border p-6">
                <h3 class="text-title-m text-foreground">Questionário SUS</h3>
                <p class="text-body-m text-muted-foreground">
                  Dez afirmativas de 1 a 5, alternando tom positivo e negativo. Pontuação = 2,5 × [Σ(ímpares − 1) + Σ(5 − pares)], de 0 a 100; não é um percentual.
                  A média de referência é cerca de 68, e acima de 80 costuma ser excelente. Meta: média ≥ 68, alvo ≥ 80, com 5 a 8 participantes.
                </p>
              </article>
              <article class="border-border bg-card flex flex-col gap-3 rounded-xl border p-6">
                <h3 class="text-title-m text-foreground">Tarefas cronometradas</h3>
                <p class="text-body-m text-muted-foreground">
                  Sem ajuda, do primeiro clique ao resultado visível. Sucesso com intervalo de confiança (Wilson), tempo pela mediana e erros por tentativa. O piso automatizado já existe (página Acessibilidade e desempenho); o que falta é a hesitação humana.
                </p>
              </article>
            </div>
            <app-tabela-dados [colunas]="colunasTarefas" [linhas]="tarefas" legenda="tarefas do protocolo de usabilidade" arquivo="tarefas-de-usabilidade" [tamanhoInicial]="10" />
          </div>
        </mat-tab>
        <mat-tab label="Heurísticas de Nielsen">
          <div class="flex flex-col gap-6 pt-6">
            <app-grafico titulo="Problemas encontrados × número de avaliadores" subtitulo="Achados(n) = 1 − (1 − λ)ⁿ, com λ ≈ 0,31: cinco avaliadores encontram cerca de 84 %" [configurar]="graficoNielsen" [altura]="300" [tabela]="tabelaNielsen" resumo="Curva crescente com retorno decrescente: um avaliador encontra 31 por cento dos problemas, cinco encontram 84 por cento e dez encontram 98 por cento." />
            <app-tabela-dados [colunas]="colunasHeuristicas" [linhas]="heuristicas" legenda="autoavaliação pelas heurísticas de Nielsen" arquivo="heuristicas-nielsen" [tamanhoInicial]="10" />
            <app-nota tom="aviso">Esta é uma autoavaliação de quem desenvolveu o sistema; a avaliação independente, com pelo menos três avaliadores, ainda não foi feita.</app-nota>
          </div>
        </mat-tab>
      </mat-tab-group>
    </app-secao>
  `
})
export class MetricasPage {
  protected readonly percentual = percentual;
  protected readonly decimal = decimal;
  protected readonly lfw = lfw;
  protected readonly placa = placa;
  protected readonly totalCobertas = totalCobertas;
  protected readonly totalLinhas = totalLinhas;
  protected readonly p95Max = decimal(Math.max(...leituras.filter((c) => c.concorrencia === 100).map((c) => c.p95)), 0);

  private readonly tomSituacao = (v: Celula): TomStatus => (v === 'Medido' ? 'success' : v === 'Parcial' ? 'warning' : 'neutral');

  protected readonly quadro: Linha[] = [
    { metrica: 'Lighthouse: desempenho, acessibilidade e boas práticas', instrumento: `Lighthouse ${lh.versao} no Edge, mediana de ${lh.rodadas} rodadas`, meta: 'Acessibilidade ≥ 95; desempenho ≥ 90', situacao: 'Medido', valor: `Desktop: desempenho ${faixa(desktop.map((t) => t.desempenho))}, acessibilidade 100. Celular simulado: desempenho ${faixa(celular.map((t) => t.desempenho))}, acessibilidade 100` },
    { metrica: 'Web Vitals: LCP, CLS e TBT', instrumento: 'Lighthouse em laboratório (o INP só existe em campo)', meta: 'LCP ≤ 2,5 s; CLS ≤ 0,1', situacao: 'Parcial', valor: `Desktop: LCP ${faixa(desktop.map((t) => t.lcp_ms / 1000), 2)} s, CLS até ${decimal(Math.max(...desktop.map((t) => t.cls)), 3)}. Celular simulado: LCP ${faixa(celular.map((t) => t.lcp_ms / 1000), 1)} s, acima da meta` },
    { metrica: 'Tamanho do pacote inicial', instrumento: 'Build de produção', meta: '≤ 900 kB', situacao: 'Medido', valor: `${decimal(pacote[0].brutoKb, 1)} KiB bruto · ${decimal(pacote[0].gzipKb, 1)} KiB gzip` },
    { metrica: 'Latência de leitura da API', instrumento: 'Cenários de carga, 10 a 100 usuários', meta: 'p95 ≤ 200 ms (local)', situacao: 'Medido', valor: `p95 de ${faixa(leituras.map((c) => c.p95))} ms; 0 erros 5xx e 0 conexões derrubadas` },
    { metrica: 'Latência de escrita sob carga mista', instrumento: 'Leitura e escrita juntas, 20 usuários', meta: 'p95 < 3 s', situacao: 'Medido', valor: p95Escritas ? `p95 de ${p95Escritas[1].replace('.', ',')} ms em ${inteiro(Number(p95Escritas[2]))} escritas` : '—' },
    { metrica: 'Tempo de leitura de placa', instrumento: 'OCR em placas sintéticas (sem YOLO nem câmera)', meta: '≤ 5 s; acerto ≥ 90 %', situacao: 'Parcial', valor: `OCR: mediana ${decimal(placa.p50, 0)} ms, p95 ${decimal(placa.p95, 0)} ms; câmera real não medida` },
    { metrica: 'Reconhecimento facial', instrumento: 'LFW, 6.000 pares, 10 dobras', meta: 'Acurácia alta com FAR baixo', situacao: 'Medido', valor: `${percentual(lfw.acuracia)} · FAR ${percentual(lfw.limiares[3].FAR, 3)} · FRR ${percentual(lfw.limiares[3].FRR, 1)}` },
    { metrica: 'Acessibilidade automática', instrumento: 'axe-core no Karma (21 telas × 2 temas) e no Playwright (página inteira)', meta: '0 violações graves', situacao: 'Medido', valor: `0 violações em ${e2e.acessibilidade.length} auditorias de página inteira e nos specs` },
    { metrica: 'Fluxos ponta a ponta', instrumento: 'Playwright no Edge', meta: 'Fluxos críticos aprovados', situacao: 'Medido', valor: `${e2e.aprovados} de ${e2e.aprovados + e2e.reprovados} testes aprovados` },
    { metrica: 'Tarefas cronometradas', instrumento: 'Piso automatizado do Playwright', meta: 'Sucesso ≥ 90 %', situacao: 'Parcial', valor: e2e.tarefas.map((t) => `${t.tarefa.replace(' (pessoa física)', '')} ${decimal(t.tempoS)} s`).join(' · ') + '; sem participantes' },
    { metrica: 'Questionário SUS', instrumento: '10 perguntas, 5 a 8 participantes', meta: 'Média ≥ 68; alvo ≥ 80', situacao: 'Planejado', valor: 'protocolo pronto; coleta pendente' },
    { metrica: 'Heurísticas de Nielsen', instrumento: 'Avaliação com ≥ 3 avaliadores', meta: 'Nenhum problema de severidade ≥ 3', situacao: 'Parcial', valor: 'autoavaliação do desenvolvedor' },
    { metrica: 'Achados de segurança', instrumento: 'Painel S1–S35', meta: '0 abertos até a prioridade "urgente"', situacao: 'Parcial', valor: `${ITENS_SEGURANCA.filter((i) => i.estado === 'Corrigido').length} corrigidos · ${ITENS_SEGURANCA.filter((i) => i.estado === 'Parcial').length} parciais · ${ITENS_SEGURANCA.filter((i) => i.estado === 'Ignorado').length} ignorados` },
    { metrica: 'Bateria de ataques e OWASP ZAP', instrumento: 'Testes-Seguranca e ZAP ativo autenticado', meta: '0 reprovadas', situacao: 'Medido', valor: `${rodada.aprovadas} de ${rodada.total} aprovadas (0 reprovadas); ZAP ${zap.aprovadas} de ${zap.aprovadas + zap.reprovadas}, ${inteiro(zap.requisicoes)} requisições` },
    { metrica: 'Testes e cobertura', instrumento: 'MSTest, pytest, Karma e coletores de cobertura', meta: '100 % verdes; cobertura ≥ 80 %', situacao: 'Medido', valor: `${inteiro(backend.testes.unidade + backend.testes.integracao + backend.testes.webapi + frontend.total.testes + ml.total.testes)} testes · cobertura ${percentual(totalCobertas / totalLinhas)} · mutação ${decimal(mut.pct)} %` }
  ];
  protected readonly medidas = this.quadro.filter((q) => q['situacao'] === 'Medido').length;

  protected readonly colunasQuadro: ColunaTabela[] = [
    { id: 'metrica', titulo: 'Métrica', larguraMin: '14rem' },
    { id: 'instrumento', titulo: 'Instrumento', secundaria: true, larguraMin: '12rem' },
    { id: 'meta', titulo: 'Meta', larguraMin: '10rem' },
    { id: 'situacao', titulo: 'Situação', tipo: 'selo', filtravel: true, tom: this.tomSituacao },
    { id: 'valor', titulo: 'Valor atual', larguraMin: '16rem' }
  ];

  private readonly cenarios = [...new Set(leituras.map((c) => c.cenario))];
  private readonly concorrencias = [10, 50, 100];
  private valor(cenario: string, conc: number, campo: 'p95' | 'rps'): number {
    return leituras.find((c) => c.cenario === cenario && c.concorrencia === conc)?.[campo] ?? 0;
  }
  private readonly nomeRota = (c: string) => c.replace('GET /api/', '');

  protected readonly tabelaConcorrencia = {
    colunas: ['Rota', ...this.concorrencias.map((c) => `${c} usuários (p95, ms)`)],
    linhas: this.cenarios.map((c) => [this.nomeRota(c), ...this.concorrencias.map((n) => decimal(this.valor(c, n, 'p95')))])
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
      series: this.cenarios.map((c, i) => ({
        name: this.nomeRota(c), type: 'line', symbol: ['circle', 'diamond', 'rect'][i % 3], symbolSize: 9,
        data: this.concorrencias.map((n) => this.valor(c, n, 'p95')), lineStyle: { color: t.series[i], width: 2 }, itemStyle: { color: t.series[i] }
      }))
    };
  };

  protected readonly tabelaVazao = {
    colunas: ['Rota', ...this.concorrencias.map((c) => `${c} usuários (req/s)`)],
    linhas: this.cenarios.map((c) => [this.nomeRota(c), ...this.concorrencias.map((n) => inteiro(Math.round(this.valor(c, n, 'rps'))))])
  };
  protected readonly graficoVazao = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.cenarios.map(this.nomeRota)),
      yAxis: eixoValor(t),
      series: this.concorrencias.map((n, i) => ({ name: `${n} usuários`, type: 'bar', data: this.cenarios.map((c) => Math.round(this.valor(c, n, 'rps'))), itemStyle: { color: t.series[i], borderRadius: [4, 4, 0, 0] } }))
    };
  };

  protected readonly linhasCarga: Linha[] = carga.map((c) => ({
    cenario: c.cenario, concorrencia: c.concorrencia, requisicoes: c.requisicoes, rps: Math.round(c.rps), p50: c.p50, p95: c.p95, p99: c.p99, erros: c.erros5xx + c.falhasConexao
  }));
  protected readonly colunasCarga: ColunaTabela[] = [
    { id: 'cenario', titulo: 'Cenário', filtravel: true, larguraMin: '14rem' },
    { id: 'concorrencia', titulo: 'Usuários', tipo: 'numero' },
    { id: 'requisicoes', titulo: 'Requisições', tipo: 'numero', secundaria: true },
    { id: 'rps', titulo: 'req/s', tipo: 'numero' },
    { id: 'p50', titulo: 'p50 (ms)', tipo: 'numero' },
    { id: 'p95', titulo: 'p95 (ms)', tipo: 'numero' },
    { id: 'p99', titulo: 'p99 (ms)', tipo: 'numero', secundaria: true },
    { id: 'erros', titulo: 'Erros 5xx e de conexão', tipo: 'numero' }
  ];

  protected readonly tarefas: Linha[] = [
    { tarefa: 'T1 · Cadastrar uma cliente pessoa física', fim: 'O cliente aparece na lista de clientes', meta: 'Sucesso ≥ 90 %' },
    { tarefa: 'T2 · Reservar um carro para uma cliente existente', fim: 'O aluguel aparece na lista como Reservado', meta: 'Sucesso ≥ 90 %' },
    { tarefa: 'T3 · Registrar a devolução de um aluguel em andamento', fim: 'A devolução aparece na lista, com condutor e cliente', meta: 'Sucesso ≥ 90 %' }
  ];
  protected readonly colunasTarefas: ColunaTabela[] = [
    { id: 'tarefa', titulo: 'Tarefa dada ao participante', larguraMin: '16rem' },
    { id: 'fim', titulo: 'Concluída quando', larguraMin: '16rem' },
    { id: 'meta', titulo: 'Meta' }
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
    { heuristica: '1 Visibilidade do estado', faz: 'Skeleton, estados de carregamento, vazio e erro, toasts e "Alterações não salvas"', lacuna: 'Sem "atualizado há X"' },
    { heuristica: '2 Correspondência com o mundo real', faz: 'pt-BR; máscaras de CPF, CNPJ e placa; moeda local', lacuna: '—' },
    { heuristica: '3 Controle e liberdade', faz: 'Cancelar, aviso ao fechar a aba e guarda de rota', lacuna: 'Sem desfazer' },
    { heuristica: '4 Consistência e padrões', faz: 'Blocos compartilhados de lista e formulário, tokens e um só conjunto de ícones', lacuna: '—' },
    { heuristica: '5 Prevenção de erros', faz: 'Validação de dígito, simulação do valor, confirmação destrutiva e bloqueio de exclusão com vínculo', lacuna: '—' },
    { heuristica: '6 Reconhecimento em vez de memória', faz: 'Menu com rótulos, paleta Ctrl+K e filtros com chips; subitens alcançáveis também no menu recolhido', lacuna: '—' },
    { heuristica: '7 Flexibilidade e eficiência', faz: 'Atalhos, densidade da tabela, CSV e estado na URL', lacuna: 'Sem seleção em massa' },
    { heuristica: '8 Estética e minimalismo', faz: 'Uma ação primária por tela e barra de ações ancorada no rodapé', lacuna: '—' },
    { heuristica: '9 Ajudar a diagnosticar erros', faz: 'Mensagem real do servidor, no campo correspondente quando a mensagem aponta um campo', lacuna: '—' },
    { heuristica: '10 Ajuda e documentação', faz: 'Assistente (chatbot) e textos de apoio nos campos', lacuna: 'Sem manual nem ajuda contextual' }
  ];
  protected readonly colunasHeuristicas: ColunaTabela[] = [
    { id: 'heuristica', titulo: 'Heurística', larguraMin: '12rem' },
    { id: 'faz', titulo: 'O que o sistema já faz', larguraMin: '18rem' },
    { id: 'lacuna', titulo: 'Lacuna conhecida', larguraMin: '12rem' }
  ];
}
