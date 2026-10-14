import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import endpoints from '../dados/endpoints.json';
import ml from '../dados/ml.json';
import seguranca from '../dados/seguranca.json';
import { decimal, inteiro, percentual } from '../core/formato';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const lfw = seguranca.lfw!;

@Component({
  selector: 'app-machine-learning',
  imports: [NgIcon, GraficoComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Linhas de Python" [valor]="inteiro(ml.total.loc)" [apoio]="ml.total.arquivos + ' arquivos de produção'" icone="lucideCode" />
      <app-kpi-card rotulo="Testes (pytest)" [valor]="ml.total.testes" [apoio]="inteiro(ml.total.locTestes) + ' linhas de teste'" icone="lucideFlaskConical" />
      <app-kpi-card rotulo="Endpoints" [valor]="endpoints.ml.length" apoio="câmeras, rosto, chat e saúde" icone="lucideRoute" />
      <app-kpi-card rotulo="Acurácia facial" [valor]="percentual(lfw.acuracia)" [apoio]="'LFW, ' + inteiro(lfw.paresMedidos) + ' pares'" icone="lucideScanFace" />
    </div>

    <app-secao titulo="Três módulos, só modelos pré-treinados" descricao="Aplicação FastAPI em Python 3.11 (diretório MachineLeaning, grafia original). Nenhum treinamento foi feito; cada modelo tem origem e hash conferidos." id="modulos">
      <div class="grid gap-3 md:grid-cols-3">
        @for (m of modulos; track m.titulo) {
          <article class="border-border bg-card flex flex-col gap-2 rounded-xl border p-5">
            <span class="bg-primary-container text-on-primary-container flex size-10 items-center justify-center rounded-full">
              <ng-icon [name]="m.icone" class="text-lg" aria-hidden="true" />
            </span>
            <h3 class="text-title-m text-foreground">{{ m.titulo }}</h3>
            <p class="text-body-m text-muted-foreground">{{ m.texto }}</p>
            <p class="text-label-m text-muted-foreground mt-auto"><span class="code-inline">{{ m.pasta }}</span></p>
          </article>
        }
      </div>
      <div class="grid gap-4 lg:grid-cols-2">
        <app-grafico titulo="Linhas por área" subtitulo="Código de produção do serviço" [configurar]="graficoAreas" [altura]="280" [tabela]="tabelaAreas" resumo="Barras horizontais com as linhas de Python de cada pasta do serviço de ML." />
        <app-grafico titulo="Testes por arquivo" subtitulo="def test_ em MachineLeaning/tests" [configurar]="graficoTestes" [altura]="280" [tabela]="tabelaTestes" resumo="Barras horizontais com a quantidade de testes pytest de cada arquivo." />
      </div>
    </app-secao>

    <app-secao titulo="Leitura de placas (YOLO + OCR)" descricao="A emissão só ocorre depois de duas leituras iguais em 3 segundos, o que reduz falsos positivos; leituras repetidas em 5 segundos são deduplicadas." id="placas">
      <ol class="grid gap-2 md:grid-cols-5" aria-label="Etapas do pipeline de placas">
        @for (e of etapas; track e.titulo; let i = $index) {
          <li class="border-border bg-card relative flex flex-col gap-1 rounded-xl border p-4">
            <span class="bg-primary text-primary-foreground text-label-m tabular flex size-6 items-center justify-center rounded-full">{{ i + 1 }}</span>
            <p class="text-title-s text-foreground">{{ e.titulo }}</p>
            <p class="text-body-s text-muted-foreground">{{ e.texto }}</p>
          </li>
        }
      </ol>
      <app-nota tom="aviso" titulo="Limitação observada">
        Em teste manual, a placa real <span class="code-inline">BRA2E19</span> foi lida como <span class="code-inline">BKA2E19</span> (confusão R↔K). Mitigação no front:
        a função <span class="code-inline">casarPlaca</span> aceita a diferença de um caractere em pares conhecidos (R/K/B/P, B/8, O/0/Q/D, I/1/L, S/5, Z/2) quando há uma única placa
        candidata em aluguel aberto, e mostra "Leitura aproximada: a placa cadastrada é X". Não foi medido o tempo de leitura com a webcam real.
      </app-nota>
    </app-secao>

    <app-secao titulo="Reconhecimento facial" descricao="O navegador não chama o módulo facial: usa /api/auth/rosto, /rosto/verificar e /entrar-facial na Web API, que fala com o ML de servidor para servidor." id="facial">
      <div class="grid gap-4 lg:grid-cols-2">
        <app-grafico titulo="Pessoa certa recusada × impostor aceito" subtitulo="FAR e FRR no LFW por limiar de cosseno (SFace)" [configurar]="graficoCurva" [altura]="320" [tabela]="tabelaCurva" resumo="Linhas que mostram a taxa de impostores aceitos (FAR) caindo e a de pessoas certas recusadas (FRR) subindo à medida que o limiar de cosseno aumenta; o limiar adotado é 0,363." />
        <app-grafico titulo="Comparador antigo × SFace" subtitulo="Mesmo protocolo do LFW (6000 pares), limiar de uso de cada um" [configurar]="graficoComparacao" [altura]="320" [tabela]="tabelaComparacao" resumo="Barras agrupadas: a geometria de landmarks recusava a pessoa certa em 94 por cento dos pares e aceitava 1,8 por cento de impostores; o SFace recusa 3,1 por cento e aceita 0,067 por cento." />
      </div>
      <app-tabela-dados [colunas]="colunasLimiares" [linhas]="limiares" legenda="limiares do SFace no LFW" arquivo="limiares-sface" [tamanhoInicial]="10" />
      <ul class="text-body-m text-foreground prose-doc flex list-disc flex-col gap-2 pl-5">
        <li>O alinhamento usa 5 pontos tirados dos landmarks do MediaPipe FaceMesh (nunca a foto é guardada); o SFace gera um vetor de 128 números e a decisão é o cosseno ≥ 0,363.</li>
        <li>Cada amostra fica cifrada (AES-256-GCM) no banco; o ML não guarda nada. Quem tinha rosto no formato antigo precisa recadastrar.</li>
        <li>A <strong>prova de vida passiva</strong> (MiniFASNet, duas redes de ~0,4 milhão de parâmetros) vem ligada por padrão e falha fechada: sem os pesos, as rotas respondem 503. Das {{ inteiro(lfw.provaDeVida.imagens) }} fotos reais do LFW, {{ percentual(lfw.provaDeVida.recusadasLimiar05) }} foram recusadas no limiar 0,5.</li>
        <li><strong>Ainda não medido:</strong> a detecção de foto impressa ou de tela com a webcam (o LFW só tem rostos reais) e o SFace com a câmera real.</li>
      </ul>
    </app-secao>

    <app-secao titulo="Modelos e como são verificados" id="modelos">
      <app-tabela-dados [colunas]="colunasModelos" [linhas]="modelos" legenda="modelos usados pelo serviço de ML" arquivo="modelos-ml" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Controle de acesso e limites" id="acesso">
      <app-tabela-dados [colunas]="colunasAcesso" [linhas]="acesso" legenda="controle de acesso do serviço de ML" arquivo="acesso-ml" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Assistente e câmera no Windows" id="assistente">
      <div class="grid gap-4 md:grid-cols-2">
        <article class="border-border bg-card flex flex-col gap-2 rounded-xl border p-5">
          <h3 class="text-title-m text-foreground">Assistente por regras</h3>
          <p class="text-body-m text-muted-foreground">
            O ChatBot é baseado em regras e palavras-chave (decisão deliberada: sem modelo de linguagem). Consulta a Web API em nome do usuário logado para responder
            sobre clientes, atrasos, devoluções do mês, faturamento e cupons. Exige login e aceita 30 mensagens por minuto, de até 2.000 caracteres.
          </p>
        </article>
        <article class="border-border bg-card flex flex-col gap-2 rounded-xl border p-5">
          <h3 class="text-title-m text-foreground">Webcam exclusiva</h3>
          <p class="text-body-m text-muted-foreground">
            Se o servidor está capturando (Monitoramento), o navegador não consegue usar a webcam no login ou na verificação facial. O processamento se solta sozinho
            após 45 s sem contato. No Windows, <span class="code-inline">OPENCV_VIDEOIO_MSMF_ENABLE_HW_TRANSFORMS=0</span> evita a abertura lenta do backend padrão.
          </p>
        </article>
      </div>
    </app-secao>
  `
})
export class MachineLearningPage {
  protected readonly ml = ml;
  protected readonly endpoints = endpoints;
  protected readonly lfw = lfw;
  protected readonly inteiro = inteiro;
  protected readonly percentual = percentual;

  protected readonly modulos = [
    { icone: 'lucideCamera', titulo: 'Câmeras e placas', pasta: 'yolo_tesseract/', texto: 'Webcam local do servidor (OpenCV), detecção de veículo com YOLOv8n, localizador de placa e OCR com Tesseract; vídeo entregue como MJPEG por ticket de uso único.' },
    { icone: 'lucideScanFace', titulo: 'Reconhecimento facial', pasta: 'FaceAuth/', texto: 'Landmarks do MediaPipe, embedding SFace de 128 números e prova de vida MiniFASNet. Só a Web API chama, com X-Internal-Token.' },
    { icone: 'lucideBot', titulo: 'Assistente', pasta: 'ChatBot/', texto: 'Respostas por regras e busca, consultando a Web API com o token do usuário; única rota de texto alcançável pelo navegador.' }
  ];

  protected readonly tabelaAreas = { colunas: ['Área', 'Linhas', 'Arquivos'], linhas: ml.areas.map((a) => [a.area, inteiro(a.loc), a.arquivos]) };
  protected readonly graficoAreas = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => inteiro(v) + ' linhas' },
    xAxis: eixoValor(t, { splitNumber: 3 }),
    yAxis: eixoCategoria(t, ml.areas.map((a) => a.area), { inverse: true }),
    series: [{
      type: 'bar', barWidth: 18,
      data: ml.areas.map((a, i) => ({ value: a.loc, itemStyle: { color: t.series[i % t.series.length], borderRadius: [0, 6, 6, 0] } })),
      label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte, formatter: (p: { value: number }) => inteiro(p.value) }
    }]
  });

  protected readonly tabelaTestes = { colunas: ['Arquivo', 'Testes'], linhas: ml.testes.map((a) => [a.arquivo, a.testes]) };
  protected readonly graficoTestes = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: eixoValor(t, { minInterval: 1 }),
    yAxis: eixoCategoria(t, ml.testes.map((a) => a.arquivo), { inverse: true, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 10 } }),
    series: [{
      type: 'bar', barWidth: 12,
      data: ml.testes.map((a) => ({ value: a.testes, itemStyle: { color: t.series[2], borderRadius: [0, 6, 6, 0] } })),
      label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte }
    }]
  });

  protected readonly etapas = [
    { titulo: 'Webcam', texto: 'OpenCV lê os quadros; só uma captura por servidor.' },
    { titulo: 'YOLOv8n', texto: 'Modelo genérico (COCO) apenas localiza o veículo.' },
    { titulo: 'Localizador', texto: 'Procura o retângulo da placa (proporção ≈ 3:1) dentro do veículo ou da imagem.' },
    { titulo: 'Tesseract', texto: 'Remove borda e faixa azul, amplia e procura o formato brasileiro (antigo e Mercosul).' },
    { titulo: 'Confirmação', texto: 'Duas leituras iguais em 3 s; no máximo uma correção por posição.' }
  ];

  private readonly curva = lfw.curva.filter((c) => c.limiar >= 0 && c.limiar <= 0.7);
  protected readonly tabelaCurva = {
    colunas: ['Limiar', 'FAR', 'FRR'],
    linhas: this.curva.map((c) => [decimal(c.limiar, 2), percentual(c.FAR, 2), percentual(c.FRR, 2)])
  };
  protected readonly graficoCurva = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 24, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', valueFormatter: (v: number) => decimal(v, 2) + ' %' },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.curva.map((c) => decimal(c.limiar, 2)), { name: 'limiar de cosseno', nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: t.textoSecundario }, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11, interval: 3 } }),
      yAxis: eixoValor(t, { name: '%', nameTextStyle: { color: t.textoSecundario }, max: 40 }),
      series: [
        {
          name: 'FAR (impostor aceito)', type: 'line', data: this.curva.map((c) => Number((c.FAR * 100).toFixed(2))), symbol: 'none', lineStyle: { color: t.erro, width: 2 }, itemStyle: { color: t.erro },
          markLine: { symbol: 'none', silent: true, lineStyle: { color: t.textoSecundario, type: 'dashed' }, label: { color: t.textoSecundario, formatter: 'limiar 0,363' }, data: [{ xAxis: decimal(0.36, 2) }] }
        },
        { name: 'FRR (pessoa certa recusada)', type: 'line', data: this.curva.map((c) => Number((c.FRR * 100).toFixed(2))), symbol: 'none', lineStyle: { color: t.series[0], width: 2, type: 'dashed' }, itemStyle: { color: t.series[0] } }
      ]
    };
  };

  private readonly comparacao = [
    ['Geometria (antes)', lfw.anterior.FRR, lfw.anterior.FAR],
    ['SFace (agora)', lfw.limiares[3].FRR, lfw.limiares[3].FAR]
  ] as const;
  protected readonly tabelaComparacao = {
    colunas: ['Comparador', 'Pessoa certa recusada (FRR)', 'Impostor aceito (FAR)'],
    linhas: this.comparacao.map(([n, frr, far]) => [n, percentual(frr, 2), percentual(far, 2)])
  };
  protected readonly graficoComparacao = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => decimal(v, 2) + ' %' },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.comparacao.map(([n]) => n)),
      yAxis: eixoValor(t, { name: '%', nameTextStyle: { color: t.textoSecundario }, max: 100 }),
      series: [
        { name: 'FRR', type: 'bar', data: this.comparacao.map(([, frr]) => Number((frr * 100).toFixed(2))), itemStyle: { color: t.series[0], borderRadius: [6, 6, 0, 0] }, label: { show: true, position: 'top', color: t.texto, fontFamily: t.fonte, formatter: (p: { value: number }) => decimal(p.value, 2) + ' %' } },
        { name: 'FAR', type: 'bar', data: this.comparacao.map(([, , far]) => Number((far * 100).toFixed(3))), itemStyle: { color: t.erro, borderRadius: [6, 6, 0, 0] }, label: { show: true, position: 'top', color: t.texto, fontFamily: t.fonte, formatter: (p: { value: number }) => decimal(p.value, 3) + ' %' } }
      ]
    };
  };

  protected readonly limiares: Linha[] = [
    ...lfw.limiares.map((l) => ({ ponto: l.rotulo, limiar: decimal(l.limiar, 3), far: percentual(l.FAR ?? 0, 3), frr: percentual(l.FRR ?? 0, 2) })),
    { ponto: 'EER (ponto de equilíbrio)', limiar: decimal(lfw.eer.limiar, 3), far: percentual(lfw.eer.FAR, 3), frr: percentual(lfw.eer.FRR, 2) }
  ];
  protected readonly colunasLimiares: ColunaTabela[] = [
    { id: 'ponto', titulo: 'Ponto de operação' },
    { id: 'limiar', titulo: 'Limiar', tipo: 'numero' },
    { id: 'far', titulo: 'FAR', tipo: 'numero' },
    { id: 'frr', titulo: 'FRR', tipo: 'numero' }
  ];

  protected readonly modelos: Linha[] = [
    { modelo: 'YOLOv8n (yolov8n.pt)', uso: 'Localiza o veículo (COCO genérico)', origem: 'Ultralytics', verificacao: 'SHA-256 do peso (YOLO_MODEL_SHA256); arquivos .pt fora do git' },
    { modelo: 'Tesseract', uso: 'OCR da placa', origem: 'Instalado no sistema', verificacao: 'Testes de OCR ignorados quando ausente' },
    { modelo: 'MediaPipe FaceMesh', uso: 'Landmarks para alinhar o rosto', origem: 'Google', verificacao: 'Dependência com versão e hash travados' },
    { modelo: 'SFace (face_recognition_sface_2021dec.onnx)', uso: 'Embedding de 128 números', origem: 'OpenCV Zoo, Apache-2.0', verificacao: 'Commit fixo; SHA-256 e tamanho conferidos; falha fechada (503) sem o modelo' },
    { modelo: 'MiniFASNetV2 + V1SE', uso: 'Prova de vida passiva', origem: 'Silent-Face-Anti-Spoofing (Minivision), Apache-2.0', verificacao: 'Commit fixo; SHA-256 no download e antes de carregar; weights_only=True' }
  ];
  protected readonly colunasModelos: ColunaTabela[] = [
    { id: 'modelo', titulo: 'Modelo' },
    { id: 'uso', titulo: 'Uso', larguraMin: '12rem' },
    { id: 'origem', titulo: 'Origem e licença', secundaria: true, larguraMin: '12rem' },
    { id: 'verificacao', titulo: 'Verificação', larguraMin: '16rem' }
  ];

  protected readonly acesso: Linha[] = [
    { rota: '/face/*', quem: 'Somente a Web API', credencial: 'X-Internal-Token (hmac.compare_digest)', limite: '120/min' },
    { rota: 'Câmeras, /start, /stop, /last', quem: 'Usuário da empresa dona das câmeras', credencial: 'JWT validado na Web API (GET /api/auth/sessao, cache de 30 s)', limite: '300/min leitura · 30/min ações' },
    { rota: '/stream/{id} (MJPEG)', quem: 'Navegador', credencial: 'Ticket de uso único, 30 s, ligado ao usuário', limite: '20/min' },
    { rota: '/chat', quem: 'Usuário autenticado', credencial: 'JWT via Web API', limite: '30/min' },
    { rota: '/health, /docs, /openapi.json', quem: 'Público', credencial: '— (em produção /docs não existe e /health é mínimo)', limite: '—' }
  ];
  protected readonly colunasAcesso: ColunaTabela[] = [
    { id: 'rota', titulo: 'Rota', tipo: 'codigo', larguraMin: '12rem' },
    { id: 'quem', titulo: 'Quem chama', secundaria: true },
    { id: 'credencial', titulo: 'Credencial', larguraMin: '16rem' },
    { id: 'limite', titulo: 'Limite' }
  ];
}
