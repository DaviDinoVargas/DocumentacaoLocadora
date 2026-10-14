import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import configuracao from '../dados/configuracao.json';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { CodigoComponent } from '../shared/layout/codigo.component';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import type { TomStatus } from '../shared/layout/status-badge.component';
import { TabelaDadosComponent, type Celula, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

interface Detalhe {
  tema: string;
  descricao: string;
  padrao?: string;
  segredo?: boolean;
}

const DETALHES: Record<string, Detalhe> = {
  ASPNETCORE_ENVIRONMENT: { tema: 'Ambiente', descricao: 'Development libera Swagger, migrations automáticas, token padrão do ML e e-mail no log; qualquer outro valor é tratado como produção.' },
  SQL_CONNECTION_STRING: { tema: 'Banco', descricao: 'Conexão com o SQL Server (o appsettings.json aponta para o LocalDB como exemplo).', segredo: true },
  JWT_GENERATION_KEY: { tema: 'Sessão', descricao: 'Chave de assinatura do JWT; precisa ter pelo menos 32 caracteres.', segredo: true },
  JWT_AUDIENCE_DOMAIN: { tema: 'Sessão', descricao: 'Audiência aceita nos tokens.' },
  LUCKYPENNY_LICENSE_KEY: { tema: 'Banco', descricao: 'Licença do MediatR; sem ela a API não sobe.', segredo: true },
  'MlApi:BaseUrl': { tema: 'Integração ML', descricao: 'Endereço do serviço de ML chamado pela Web API.', padrao: 'http://localhost:8000' },
  'MlApi:InternalToken': { tema: 'Integração ML', descricao: 'Segredo compartilhado com o ML (ML_INTERNAL_TOKEN); fora de Development precisa ter 32+ caracteres e não pode ser o padrão público.', segredo: true },
  FACE_ENCRYPTION_KEYS: { tema: 'Biometria', descricao: 'Chaves AES-256-GCM das amostras faciais no formato "1:<base64>;2:<base64>" (32 bytes cada), versionadas.', segredo: true },
  ANTISPOOF_REQUIRED: { tema: 'Biometria', descricao: 'Exige que o ML tenha feito a prova de vida; obrigatória fora de Development.' },
  CORS_ALLOWED_ORIGINS: { tema: 'Rede', descricao: 'Origens permitidas (API e ML), separadas por ponto e vírgula; nunca "*".', padrao: 'http://localhost:4200;https://localhost:4200 (ML)' },
  TRUSTED_PROXIES: { tema: 'Rede', descricao: 'IPs ou CIDR de proxies confiáveis (separados por ;) para ler X-Forwarded-For.' },
  MAX_REQUEST_BODY_BYTES: { tema: 'Rede', descricao: 'Tamanho máximo do corpo da requisição.', padrao: '2 MB' },
  RATE_LIMIT_PER_MINUTE: { tema: 'Rede', descricao: 'Limite global por usuário ou IP.', padrao: '300' },
  REGISTRATION_LIMIT_PER_HOUR: { tema: 'Rede', descricao: 'Cadastros por IP por hora.', padrao: '5' },
  FRONTEND_URL: { tema: 'E-mail', descricao: 'Base do link de redefinição de senha.', padrao: 'http://localhost:4200' },
  SMTP_HOST: { tema: 'E-mail', descricao: 'Servidor SMTP; sem ele, em Development o e-mail cai no log da API e fora dele nada é enviado.' },
  SMTP_PORT: { tema: 'E-mail', descricao: 'Porta do SMTP.', padrao: '587' },
  SMTP_USER: { tema: 'E-mail', descricao: 'Usuário do SMTP (também remetente quando SMTP_FROM falta).' },
  SMTP_PASSWORD: { tema: 'E-mail', descricao: 'Senha (de aplicativo) do SMTP.', segredo: true },
  SMTP_FROM: { tema: 'E-mail', descricao: 'Endereço do remetente.' },
  SMTP_SSL: { tema: 'E-mail', descricao: 'STARTTLS; use false só em servidor local de teste.', padrao: 'true' },
  ML_ENV: { tema: 'Ambiente', descricao: 'Só "development" liga o modo de desenvolvimento do ML; ausente conta como produção (falha fechada).' },
  ML_INTERNAL_TOKEN: { tema: 'Integração ML', descricao: 'Segredo que autoriza a Web API a chamar /face/*.', padrao: 'valor público só em desenvolvimento', segredo: true },
  HOST: { tema: 'Rede', descricao: 'Endereço de escuta do ML (vale o de shared/settings.py).', padrao: '127.0.0.1' },
  PORT: { tema: 'Rede', descricao: 'Declarada em yolo_tesseract/config.py, mas sem efeito: o main.py sobe sempre na porta 8000.', padrao: '8000' },
  CAMERA_EMPRESA_ID: { tema: 'Câmera', descricao: 'Empresa dona das câmeras do servidor; em desenvolvimento, vazia libera qualquer conta; fora dele, vazia não libera ninguém.' },
  CAMERA_IDLE_TIMEOUT_S: { tema: 'Câmera', descricao: 'Segundos sem contato do navegador até soltar a webcam.', padrao: '45' },
  CAMERA_MAX_PROBE: { tema: 'Câmera', descricao: 'Quantidade de índices de câmera testados na busca.', padrao: '4' },
  CAMERA_SERVER: { tema: 'Câmera', descricao: 'URL de uma câmera remota, se houver.' },
  ANTISPOOF_ENABLED: { tema: 'Biometria', descricao: 'Liga a prova de vida; desligar só em desenvolvimento.', padrao: 'true' },
  ANTISPOOF_THRESHOLD: { tema: 'Biometria', descricao: 'Limiar de vida (se rostos reais forem recusados, reduzir).', padrao: '0,5' },
  ANTISPOOF_DIR: { tema: 'Biometria', descricao: 'Pasta dos pesos da prova de vida.', padrao: 'FaceAuth/modelos' },
  FACE_COSINE_THRESHOLD: { tema: 'Biometria', descricao: 'Limiar de cosseno do SFace (recomendado pelo OpenCV e confirmado no LFW).', padrao: '0,363' },
  FACE_MODEL_DIR: { tema: 'Biometria', descricao: 'Pasta do modelo SFace.', padrao: 'FaceAuth/modelos' },
  DOTNET_API_URL: { tema: 'Integração ML', descricao: 'Endereço da Web API consultado pelo ML para validar a sessão e pelo chatbot.', padrao: 'https://localhost:7064' },
  DOTNET_API_VERIFY_SSL: { tema: 'Integração ML', descricao: 'Verificação do certificado; por padrão só é dispensada em localhost.' },
  YOLO_MODEL: { tema: 'Placas', descricao: 'Caminho do peso do YOLO.', padrao: 'yolov8n.pt' },
  YOLO_MODEL_SHA256: { tema: 'Placas', descricao: 'Hash esperado do peso (cadeia de suprimentos).' },
  MIN_CONF: { tema: 'Placas', descricao: 'Confiança mínima da detecção do veículo.', padrao: '0,35' },
  MIN_PLATE_AREA: { tema: 'Placas', descricao: 'Área mínima (px) do retângulo candidato a placa.', padrao: '500' },
  OCR_LANG: { tema: 'Placas', descricao: 'Idioma do Tesseract.', padrao: 'eng' },
  TESSERACT_CMD: { tema: 'Placas', descricao: 'Caminho do executável do Tesseract, se fora do PATH.' },
  SAVE_CROPS: { tema: 'Placas', descricao: 'Grava os recortes das placas (só durante testes).', padrao: 'false' },
  CROPS_DIR: { tema: 'Placas', descricao: 'Pasta dos recortes.', padrao: 'crops' },
  CROPS_RETENTION_HOURS: { tema: 'Placas', descricao: 'Horas até apagar recortes antigos.', padrao: '24' }
};

@Component({
  selector: 'app-configuracao',
  imports: [MatTabsModule, GraficoComponent, CodigoComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Variáveis de configuração" [valor]="variaveis.length" apoio="lidas pelo código da Web API e do ML" icone="lucideSettings" />
      <app-kpi-card rotulo="Segredos" [valor]="segredos" apoio="nunca no repositório: user-secrets ou ambiente" icone="lucideKeyRound" />
      <app-kpi-card rotulo="Web API" [valor]="daApi" apoio="appsettings + user-secrets + ambiente" icone="lucideServer" />
      <app-kpi-card rotulo="Serviço de ML" [valor]="doMl" apoio="variáveis de ambiente (shared/settings.py e config.py)" icone="lucideScanLine" />
    </div>

    <app-secao titulo="Rodando em desenvolvimento" descricao="Um terminal por serviço; o script da raiz inicia o Angular e o ML juntos." id="rodar">
      <mat-tab-group animationDuration="0ms" mat-align-tabs="start">
        <mat-tab label="1 · Dependências">
          <div class="flex flex-col gap-4 pt-6">
            <p class="text-body-m text-muted-foreground prose-doc">Pré-requisitos: Node.js, SDK do .NET 8, Python 3.11, SQL Server (em contêiner ou LocalDB) e Tesseract instalado no sistema.</p>
            <app-codigo rotulo="Raiz do repositório" [texto]="cmdInstalar" />
          </div>
        </mat-tab>
        <mat-tab label="2 · Segredos da API">
          <div class="flex flex-col gap-4 pt-6">
            <p class="text-body-m text-muted-foreground prose-doc">Os segredos ficam no user-secrets da Web API; os valores abaixo são exemplos. Em desenvolvimento, MlApi:InternalToken e FACE_ENCRYPTION_KEYS são opcionais.</p>
            <app-codigo rotulo="Server/web-api" [texto]="cmdSegredos" />
          </div>
        </mat-tab>
        <mat-tab label="3 · Subir tudo">
          <div class="flex flex-col gap-4 pt-6">
            <app-codigo rotulo="Três terminais" [texto]="cmdSubir" />
            <app-nota tom="info">O proxy do Angular (proxy.conf.json) encaminha /api/** para https://localhost:7064 e as rotas de câmera, chat e stream para o ML na porta 8000.</app-nota>
          </div>
        </mat-tab>
        <mat-tab label="Scripts da raiz">
          <div class="pt-6">
            <app-tabela-dados [colunas]="colunasScripts" [linhas]="scripts" legenda="scripts do package.json da raiz" arquivo="scripts" [tamanhoInicial]="10" />
          </div>
        </mat-tab>
      </mat-tab-group>
    </app-secao>

    <app-secao titulo="Desenvolvimento × produção" descricao="O ML falha fechado: esquecer a variável nunca expõe nada." id="ambientes">
      <app-tabela-dados [colunas]="colunasAmbientes" [linhas]="ambientes" legenda="diferenças entre desenvolvimento e produção" arquivo="ambientes" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Variáveis de configuração" descricao="Extraídas do código (configuration[…], GetEnvironmentVariable e os.environ). Descrições e padrões vêm do próprio código e dos documentos do projeto." id="variaveis">
      <div class="grid gap-6 lg:grid-cols-2">
        <app-grafico titulo="Variáveis por tema" subtitulo="Onde a configuração se concentra" [configurar]="graficoTemas" [altura]="320" [tabela]="tabelaTemas" resumo="Barras horizontais com a quantidade de variáveis de configuração por tema: placas, e-mail, rede, biometria, câmera, integração com o ML, ambiente, sessão e banco." />
        <app-grafico titulo="Quem lê cada variável" subtitulo="Web API, serviço de ML ou ambos" [configurar]="graficoComponentes" [altura]="320" [tabela]="tabelaComponentes" resumo="Rosca com a quantidade de variáveis lidas pela Web API, pelo serviço de ML ou por ambos." />
      </div>
      <app-tabela-dados [colunas]="colunasVariaveis" [linhas]="linhasVariaveis" legenda="variáveis de configuração" arquivo="variaveis-de-configuracao" [tamanhoInicial]="25" />
    </app-secao>

    <app-secao titulo="Fora de escopo, por decisão" id="fora">
      <app-nota tom="aviso" titulo="Docker, nginx e CI/CD">
        Os Dockerfiles, o docker-compose.yml, o nginx.conf e o workflow de CI existem na pasta de trabalho do software, mas não estão versionados e não foram exercitados: foram
        deixados fora do escopo (achados S7, S8 em parte, e S16). Esta página não os descreve como pronto.
      </app-nota>
    </app-secao>
  `
})
export class ConfiguracaoPage {
  protected readonly variaveis = configuracao.variaveis;
  protected readonly segredos = configuracao.variaveis.filter((v) => DETALHES[v.nome]?.segredo).length;
  protected readonly daApi = configuracao.variaveis.filter((v) => v.componentes.includes('Web API')).length;
  protected readonly doMl = configuracao.variaveis.filter((v) => v.componentes.includes('Serviço de ML')).length;

  protected readonly cmdInstalar = 'npm run install:all\n# = cd Client && npm install && cd ../MachineLeaning && pip install -r requirements.txt';
  protected readonly cmdSegredos = [
    'cd Server/web-api',
    'dotnet user-secrets set JWT_GENERATION_KEY "<chave-aleatoria-de-64-caracteres>"',
    'dotnet user-secrets set JWT_AUDIENCE_DOMAIN "localhost"',
    'dotnet user-secrets set SQL_CONNECTION_STRING "<connection-string-do-sql-server>"',
    'dotnet user-secrets set LUCKYPENNY_LICENSE_KEY "<licenca-do-mediatr>"',
    '# opcionais em desenvolvimento, obrigatórios em produção:',
    'dotnet user-secrets set MlApi:InternalToken "<token-aleatorio-de-32+-caracteres>"',
    'dotnet user-secrets set FACE_ENCRYPTION_KEYS "1:<32-bytes-em-base64>"'
  ].join('\n');
  protected readonly cmdSubir = [
    '# 1) Web API (HTTPS 7064, Swagger e migrations em Development)',
    'dotnet run --project Server/web-api',
    '',
    '# 2) Serviço de ML (porta 8000; ML_ENV=development libera /docs)',
    'cd MachineLeaning && ML_ENV=development python main.py',
    '',
    '# 3) Angular (porta 4200, com o proxy.conf.json)',
    'cd Client && npm start',
    '',
    '# ou, para o Angular e o ML juntos:',
    'npm start'
  ].join('\n');

  protected readonly scripts: Linha[] = [
    { script: 'npm start', faz: 'node start-dev.js: inicia o Angular e o serviço de ML juntos, com a saída colorida por serviço' },
    { script: 'npm run start:angular', faz: 'cd Client && npm start (ng serve)' },
    { script: 'npm run start:python', faz: 'cd MachineLeaning && python main.py' },
    { script: 'npm run install:all', faz: 'instala as dependências do Angular e do ML' },
    { script: 'Testes-Seguranca/rodar.sh', faz: 'ataques | carga | tudo | comparar | limpar: bateria de segurança' }
  ];
  protected readonly colunasScripts: ColunaTabela[] = [
    { id: 'script', titulo: 'Comando', tipo: 'codigo', larguraMin: '14rem' },
    { id: 'faz', titulo: 'O que faz', larguraMin: '20rem' }
  ];

  protected readonly ambientes: Linha[] = [
    { aspecto: 'Swagger e migrations automáticas', desenvolvimento: 'Ligados', producao: 'Desligados; entra o HSTS' },
    { aspecto: 'Token interno do ML', desenvolvimento: 'Aceita o padrão público', producao: 'Exige segredo próprio, longo, diferente do padrão' },
    { aspecto: '/docs e /openapi.json do ML', desenvolvimento: 'Publicados (ML_ENV=development)', producao: 'Não existem; /health só informa "healthy"' },
    { aspecto: 'Prova de vida', desenvolvimento: 'Pode ser desligada', producao: 'Ligada; a API exige que o ML a tenha feito (503 sem os pesos)' },
    { aspecto: 'E-mail de recuperação de senha', desenvolvimento: 'Cai no log da API sem SMTP_HOST', producao: 'Só envia com SMTP_HOST; sem ele nada sai' },
    { aspecto: 'Chaves das amostras faciais', desenvolvimento: 'Chave de desenvolvimento', producao: 'FACE_ENCRYPTION_KEYS obrigatória' },
    { aspecto: 'Câmeras do ML', desenvolvimento: 'Qualquer conta autenticada acessa sem CAMERA_EMPRESA_ID', producao: 'Sem CAMERA_EMPRESA_ID ninguém acessa' },
    { aspecto: 'Escuta do ML', desenvolvimento: '127.0.0.1, com reload automático', producao: '127.0.0.1 (HOST define outro), sem reload' }
  ];
  protected readonly colunasAmbientes: ColunaTabela[] = [
    { id: 'aspecto', titulo: 'Aspecto', larguraMin: '12rem' },
    { id: 'desenvolvimento', titulo: 'Desenvolvimento', larguraMin: '14rem' },
    { id: 'producao', titulo: 'Produção', larguraMin: '14rem' }
  ];

  private readonly temas = (() => {
    const mapa = new Map<string, number>();
    for (const v of configuracao.variaveis) {
      const t = DETALHES[v.nome]?.tema ?? 'Outros';
      mapa.set(t, (mapa.get(t) ?? 0) + 1);
    }
    return [...mapa.entries()].map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total);
  })();
  protected readonly tabelaTemas = { colunas: ['Tema', 'Variáveis'], linhas: this.temas.map((t) => [t.nome, t.total]) };
  protected readonly graficoTemas = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 36, top: 8, bottom: 8, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: eixoValor(t, { minInterval: 1 }),
    yAxis: eixoCategoria(t, this.temas.map((x) => x.nome), { inverse: true }),
    series: [{
      type: 'bar', barWidth: 16,
      data: this.temas.map((x, i) => ({ value: x.total, itemStyle: { color: t.series[i % t.series.length], borderRadius: [0, 6, 6, 0] } })),
      label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte }
    }]
  });

  private readonly porComponente = (() => {
    const mapa = new Map<string, number>();
    for (const v of configuracao.variaveis) {
      const c = v.componentes.join(' + ');
      mapa.set(c, (mapa.get(c) ?? 0) + 1);
    }
    return [...mapa.entries()].map(([name, value]) => ({ name, value }));
  })();
  protected readonly tabelaComponentes = { colunas: ['Lida por', 'Variáveis'], linhas: this.porComponente.map((c) => [c.name, c.value]) };
  protected readonly graficoComponentes = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'item' },
    legend: { ...baseDoGrafico(t).legend, bottom: 0 },
    series: [{
      type: 'pie', radius: ['46%', '70%'], center: ['50%', '44%'],
      itemStyle: { borderColor: t.fundoDica, borderWidth: 2, borderRadius: 6 },
      label: { color: t.texto, fontFamily: t.fonte, formatter: '{c}' },
      data: this.porComponente.map((c, i) => ({ ...c, itemStyle: { color: t.series[i % t.series.length] } }))
    }]
  });

  protected readonly linhasVariaveis: Linha[] = configuracao.variaveis.map((v) => {
    const d = DETALHES[v.nome];
    return { variavel: v.nome, componente: v.componentes.join(' + '), tema: d?.tema ?? 'Outros', padrao: d?.padrao ?? '—', segredo: d?.segredo ? 'Segredo' : '—', descricao: d?.descricao ?? '—', arquivo: v.arquivos.map((a) => a.split('/').pop()).join(', ') };
  });

  private readonly tomSegredo = (v: Celula): TomStatus => (v === 'Segredo' ? 'warning' : 'neutral');
  protected readonly colunasVariaveis: ColunaTabela[] = [
    { id: 'variavel', titulo: 'Variável', tipo: 'codigo', larguraMin: '14rem' },
    { id: 'componente', titulo: 'Lida por', filtravel: true, secundaria: true },
    { id: 'tema', titulo: 'Tema', filtravel: true, secundaria: true },
    { id: 'segredo', titulo: 'Sensível', tipo: 'selo', filtravel: true, tom: this.tomSegredo },
    { id: 'padrao', titulo: 'Padrão', secundaria: true },
    { id: 'descricao', titulo: 'Para que serve', larguraMin: '22rem' },
    { id: 'arquivo', titulo: 'Arquivo', secundaria: true }
  ];
}
