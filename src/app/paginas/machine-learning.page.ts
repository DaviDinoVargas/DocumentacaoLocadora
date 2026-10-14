import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import endpoints from '../dados/endpoints.json';
import ml from '../dados/ml.json';
import seguranca from '../dados/seguranca.json';
import { decimal, inteiro, percentual } from '../core/formato';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { ConceitosComponent, type Conceito } from '../shared/layout/conceitos.component';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const lfw = seguranca.lfw!;

@Component({
  selector: 'app-machine-learning',
  imports: [NgIcon, GraficoComponent, ConceitosComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Modelos pré-treinados" valor="5" apoio="YOLOv8n, SFace, MiniFASNet (2) e MediaPipe; nenhum treinamento" icone="lucideCpu" />
      <app-kpi-card rotulo="Endpoints" [valor]="endpoints.ml.length" apoio="câmeras, rosto, chat e saúde" icone="lucideRoute" />
      <app-kpi-card rotulo="Testes (pytest)" [valor]="ml.total.testes" apoio="com câmera e captura falsas" icone="lucideFlaskConical" />
      <app-kpi-card rotulo="Acurácia facial" [valor]="percentual(lfw.acuracia)" [apoio]="'LFW, ' + inteiro(lfw.paresMedidos) + ' pares'" icone="lucideScanFace" />
    </div>

    <app-secao titulo="Três módulos, só modelos pré-treinados" descricao="Aplicação FastAPI em Python 3.11 (diretório MachineLeaning, grafia original). O serviço não guarda nada de negócio: lê imagens e devolve resultados; quem decide aluguel, devolução e identidade é a Web API." id="modulos">
      <div class="grid gap-6 md:grid-cols-3">
        @for (m of modulos; track m.titulo) {
          <article class="border-border bg-card flex h-full flex-col gap-3 rounded-xl border p-6">
            <span class="bg-primary-container text-on-primary-container flex size-11 items-center justify-center rounded-full">
              <ng-icon [name]="m.icone" class="text-xl" aria-hidden="true" />
            </span>
            <h3 class="text-title-m text-foreground">{{ m.titulo }}</h3>
            <p class="text-body-m text-muted-foreground">{{ m.texto }}</p>
            <p class="text-label-m text-muted-foreground mt-auto"><span class="code-inline">{{ m.pasta }}</span></p>
          </article>
        }
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico titulo="Endpoints por grupo" subtitulo="Rotas HTTP do serviço" [configurar]="graficoGrupos" [altura]="300" [tabela]="tabelaGrupos" resumo="Rosca com os endpoints do serviço de ML por grupo: câmeras e placas, reconhecimento facial, assistente e saúde." />
        <app-grafico titulo="Testes por arquivo" subtitulo="def test_ em MachineLeaning/tests" [configurar]="graficoTestes" [altura]="300" [tabela]="tabelaTestes" resumo="Barras horizontais com a quantidade de testes pytest de cada arquivo." />
      </div>
    </app-secao>

    <app-secao titulo="Leitura de placas: como funciona" descricao="Uma cadeia de cinco etapas transforma quadros de webcam em uma placa confirmada. A emissão só ocorre depois de duas leituras iguais em 3 segundos, e leituras repetidas em 5 segundos são deduplicadas." id="placas">
      <ol class="grid gap-6 md:grid-cols-5" aria-label="Etapas do pipeline de placas">
        @for (e of etapas; track e.titulo; let i = $index) {
          <li class="border-border bg-card flex h-full flex-col gap-2 rounded-xl border p-5">
            <span class="bg-primary text-primary-foreground text-label-m tabular flex size-7 items-center justify-center rounded-full">{{ i + 1 }}</span>
            <p class="text-title-s text-foreground">{{ e.titulo }}</p>
            <p class="text-body-s text-muted-foreground">{{ e.texto }}</p>
          </li>
        }
      </ol>
      <app-conceitos [itens]="conceitosPlacas" />
      <app-nota tom="aviso" titulo="Limitação observada">
        Em teste manual, a placa real <span class="code-inline">BRA2E19</span> foi lida como <span class="code-inline">BKA2E19</span> (confusão R↔K). Mitigação no front:
        a função <span class="code-inline">casarPlaca</span> aceita a diferença de um caractere em pares conhecidos (R/K/B/P, B/8, O/0/Q/D, I/1/L, S/5, Z/2) quando há uma única placa
        candidata em aluguel aberto, e mostra "Leitura aproximada: a placa cadastrada é X". O tempo de leitura com a webcam real ainda não foi medido.
      </app-nota>
    </app-secao>

    <app-secao titulo="Reconhecimento facial: do clique à decisão" descricao="O navegador não chama o módulo facial: usa /api/auth/rosto, /rosto/verificar e /entrar-facial na Web API, que fala com o ML de servidor para servidor com X-Internal-Token." id="fluxo-facial">
      <ol class="grid gap-6 md:grid-cols-2">
        @for (p of fluxoFacial; track p.titulo; let i = $index) {
          <li class="border-border bg-card flex h-full gap-4 rounded-xl border p-6">
            <span class="bg-primary text-primary-foreground text-title-s tabular flex size-9 shrink-0 items-center justify-center rounded-full">{{ i + 1 }}</span>
            <div>
              <p class="text-title-s text-foreground">{{ p.titulo }}</p>
              <p class="text-body-m text-muted-foreground">{{ p.texto }}</p>
            </div>
          </li>
        }
      </ol>
    </app-secao>

    <app-secao titulo="A teoria por trás do reconhecimento" descricao="Os conceitos que explicam por que o sistema usa um vetor de 128 números, um limiar de 0,363 e uma rede separada para a prova de vida." id="teoria-facial">
      <app-conceitos [itens]="conceitosFacial" />
    </app-secao>

    <app-secao titulo="Medição no LFW" descricao="Protocolo oficial de 10 dobras, 6.000 pares de fotos (mesma pessoa e pessoas diferentes). Quanto maior o limiar de cosseno, menos impostores passam e mais pessoas certas são recusadas." id="medicao">
      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico titulo="Pessoa certa recusada × impostor aceito" subtitulo="FAR e FRR por limiar de cosseno (SFace)" [configurar]="graficoCurva" [altura]="340" [tabela]="tabelaCurva" resumo="Linhas que mostram a taxa de impostores aceitos (FAR) caindo e a de pessoas certas recusadas (FRR) subindo à medida que o limiar de cosseno aumenta; o limiar adotado é 0,363." />
        <app-grafico titulo="Comparador antigo × SFace" subtitulo="Mesmo protocolo, limiar de uso de cada um" [configurar]="graficoComparacao" [altura]="340" [tabela]="tabelaComparacao" resumo="Barras agrupadas: a geometria de landmarks recusava a pessoa certa em 94 por cento dos pares e aceitava 1,8 por cento de impostores; o SFace recusa 3,1 por cento e aceita 0,067 por cento." />
      </div>
      <app-tabela-dados [colunas]="colunasLimiares" [linhas]="limiares" legenda="limiares do SFace no LFW" arquivo="limiares-sface" [tamanhoInicial]="10" />
      <div class="grid gap-6 md:grid-cols-2">
        <app-nota tom="sucesso" titulo="Prova de vida">
          Ligada por padrão, obrigatória na API fora de desenvolvimento e com falha fechada: sem os pesos, as rotas respondem 503. Das {{ inteiro(lfw.provaDeVida.imagens) }} fotos reais do LFW,
          {{ percentual(lfw.provaDeVida.recusadasLimiar05) }} foram recusadas no limiar 0,5.
        </app-nota>
        <app-nota tom="aviso" titulo="Ainda não medido">
          A detecção de foto impressa e de tela com a webcam (o LFW só tem rostos reais) e o SFace com a câmera real. Os números acima são de fotos de internet de 250 px.
        </app-nota>
      </div>
    </app-secao>

    <app-secao titulo="Modelos e como são verificados" id="modelos">
      <app-tabela-dados [colunas]="colunasModelos" [linhas]="modelos" legenda="modelos usados pelo serviço de ML" arquivo="modelos-ml" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Controle de acesso e limites" descricao="Cada rota exige uma credencial diferente, e quase todas têm limite de uso por usuário." id="acesso">
      <app-tabela-dados [colunas]="colunasAcesso" [linhas]="acesso" legenda="controle de acesso do serviço de ML" arquivo="acesso-ml" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Assistente e câmera no Windows" id="assistente">
      <div class="grid gap-6 md:grid-cols-2">
        <article class="border-border bg-card flex h-full flex-col gap-3 rounded-xl border p-6">
          <h3 class="text-title-m text-foreground">Assistente por regras</h3>
          <p class="text-body-m text-muted-foreground">
            O ChatBot é baseado em regras e palavras-chave (decisão deliberada: sem modelo de linguagem). Consulta a Web API em nome do usuário logado para responder
            sobre clientes, atrasos, devoluções do mês, faturamento e cupons. Exige login e aceita 30 mensagens por minuto, de até 2.000 caracteres.
          </p>
        </article>
        <article class="border-border bg-card flex h-full flex-col gap-3 rounded-xl border p-6">
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

  private readonly grupos = (() => {
    const mapa = new Map<string, number>();
    for (const e of endpoints.ml) mapa.set(e.grupo, (mapa.get(e.grupo) ?? 0) + 1);
    return [...mapa.entries()].map(([name, value]) => ({ name, value }));
  })();
  protected readonly tabelaGrupos = { colunas: ['Grupo', 'Endpoints'], linhas: this.grupos.map((g) => [g.name, g.value]) };
  protected readonly graficoGrupos = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'item' },
    legend: { ...baseDoGrafico(t).legend, bottom: 0 },
    series: [{
      type: 'pie', radius: ['46%', '70%'], center: ['50%', '44%'],
      itemStyle: { borderColor: t.fundoDica, borderWidth: 2, borderRadius: 6 },
      label: { color: t.texto, fontFamily: t.fonte, formatter: '{c}' },
      data: this.grupos.map((g, i) => ({ ...g, itemStyle: { color: t.series[i % t.series.length] } }))
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

  protected readonly conceitosPlacas: Conceito[] = [
    { termo: 'Detecção de objetos (YOLO)', definicao: 'Uma rede neural convolucional que, em uma única passada pela imagem, devolve caixas delimitadoras e a classe de cada objeto. O yolov8n é o menor da família, treinado no conjunto COCO (carro, moto, ônibus, caminhão entre as 80 classes).', noSistema: 'Só localiza o veículo; ele não lê a placa. Sem veículo na imagem, o localizador procura a placa na imagem inteira.' },
    { termo: 'OCR (Tesseract)', definicao: 'Reconhecimento óptico de caracteres: segmenta o recorte em linhas e símbolos e escolhe, para cada símbolo, o caractere mais provável. Erra mais com baixa resolução e com símbolos parecidos (R/K, 0/O, 1/I).', noSistema: 'O recorte é limpo e ampliado, algumas variantes são testadas e o texto é filtrado pelo formato AAA0000 ou AAA0A00; no máximo uma correção por posição.' },
    { termo: 'Confirmação por repetição', definicao: 'Uma leitura isolada pode estar errada; exigir a mesma leitura mais de uma vez em uma janela curta troca velocidade por confiança e reduz falsos positivos.', noSistema: 'Duas leituras iguais em 3 s emitem a placa; a mesma placa não é emitida de novo por 5 s.' },
    { termo: 'MJPEG com ticket de uso único', definicao: 'MJPEG é uma sequência de quadros JPEG sobre HTTP, que o navegador exibe em um elemento de imagem. Esse elemento não envia o cabeçalho Authorization, então o acesso é autorizado por um ticket na própria URL.', noSistema: 'POST /api/cameras/stream-ticket emite um ticket válido por 30 s, ligado ao usuário e consumido no primeiro uso.' }
  ];

  protected readonly fluxoFacial = [
    { titulo: 'O navegador captura o rosto', texto: 'A tela de login ou de cadastro usa a webcam do usuário e envia a imagem à Web API (nunca direto ao ML).' },
    { titulo: 'A Web API protege a porta de entrada', texto: 'Limite de 10 por minuto por IP, bloqueio de conta e limite por par conta + IP; no cadastro, o consentimento versionado precisa estar aceito.' },
    { titulo: 'A Web API chama o ML', texto: 'De servidor para servidor, com X-Internal-Token (comparado em tempo constante) e limite de 120 por minuto.' },
    { titulo: 'O ML analisa a imagem', texto: 'Detecta o rosto, avalia a prova de vida e calcula o vetor de 128 números. Imagens de foto ou de tela são recusadas.' },
    { titulo: 'A Web API compara com as amostras', texto: 'Lê as amostras cifradas do banco, decifra e pede ao ML a comparação por cosseno; o ML não guarda nada.' },
    { titulo: 'Decisão e sessão', texto: 'Se o cosseno passa do limiar (e o código do 2FA, quando ativo, confere), a API emite o par de tokens; caso contrário a falha conta no bloqueio de conta.' }
  ];

  protected readonly conceitosFacial: Conceito[] = [
    { termo: 'Landmarks (MediaPipe FaceMesh)', definicao: 'Pontos de referência do rosto (468 no total): contorno, olhos, nariz e boca. Servem para localizar e alinhar o rosto antes de qualquer comparação.', noSistema: 'Só 5 pontos são usados (olhos, nariz e cantos da boca) para alinhar o recorte; a geometria dos 468 pontos já não decide a identidade.' },
    { termo: 'Embedding (SFace)', definicao: 'Uma rede neural transforma o rosto alinhado em um vetor de números tal que fotos da mesma pessoa ficam próximas e pessoas diferentes ficam distantes.', noSistema: 'Vetor de 128 números por amostra, cifrado em AES-256-GCM no banco. Cada rosto leva cerca de 20 ms.' },
    { termo: 'Similaridade de cosseno', definicao: 'O cosseno do ângulo entre dois vetores: 1 quando apontam para o mesmo lado, 0 quando não têm relação. Ignora o tamanho do vetor e olha só a direção.', noSistema: 'Cosseno médio medido no LFW: 0,67 para a mesma pessoa e 0,09 para pessoas diferentes. Aceita-se com cosseno ≥ 0,363.' },
    { termo: 'FAR, FRR e EER', definicao: 'FAR é a fração de impostores aceitos; FRR, a de pessoas certas recusadas; o EER é o ponto em que as duas se igualam. Subir o limiar baixa o FAR e sobe o FRR.', noSistema: 'No limiar 0,363: FAR de 0,067 % (1 em ~1.500) e FRR de 3,1 %. EER de cerca de 2,6 %.' },
    { termo: 'Prova de vida passiva (MiniFASNet)', definicao: 'Uma rede pequena olha uma única imagem, com o contexto ao redor do rosto, e estima a probabilidade de ser uma pessoa de verdade e não uma foto impressa ou uma tela.', noSistema: 'Duas redes (escalas 2,7× e 4×) somadas, limiar 0,5; ligada por padrão, com pesos de commit fixo e SHA-256 conferido.' },
    { termo: 'Defesa em camadas no login facial', definicao: 'Nenhum controle sozinho basta: o reconhecimento tem FAR pequeno mas não zero, e a prova de vida pode errar. Por isso os controles se somam.', noSistema: 'Prova de vida + cosseno + bloqueio de conta (10 erros) + limite por conta e IP (5) + código do 2FA, quando ativo.' }
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
    ...lfw.limiares.map((l) => ({ ponto: l.rotulo, limiar: decimal(l.limiar, 3), far: percentual(l.FAR, 3), frr: percentual(l.FRR, 2) })),
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
