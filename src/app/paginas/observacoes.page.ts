import { ChangeDetectionStrategy, Component } from '@angular/core';
import backend from '../dados/backend.json';
import { ITENS_SEGURANCA } from '../dados/seguranca-itens';
import frontend from '../dados/frontend.json';
import ml from '../dados/ml.json';
import seguranca from '../dados/seguranca.json';
import visao from '../dados/visaoGeral.json';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import type { TomStatus } from '../shared/layout/status-badge.component';
import { TabelaDadosComponent, type Celula, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const corrigidos = ITENS_SEGURANCA.filter((i) => i.estado === 'Corrigido').length;

@Component({
  selector: 'app-observacoes',
  imports: [GraficoComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <app-nota tom="info" titulo="Regra de conflito">
      Quando o material complementar (LaTeX e apresentação do TCC, de 12/out/2026) e o código (branch {{ ramo }}, de 13/out/2026) discordam, <strong>o código vence</strong>. Cada divergência
      está registrada abaixo com o que cada fonte diz e o que esta documentação adotou.
    </app-nota>

    <app-secao titulo="O texto ficou para trás, o código seguiu" descricao="O mesmo indicador no material do TCC e no código de hoje." id="comparativo">
      <div class="grid gap-4 lg:grid-cols-2">
        <app-grafico titulo="Segurança e dados" subtitulo="Material (12/out) × código (13/out)" [configurar]="graficoSeguranca" [altura]="320" [tabela]="tabelaSeguranca" resumo="Barras agrupadas: migrations de 11 para 14, achados de segurança de 23 para 35, achados corrigidos de 0 para 29 e verificações de ataque de 0 para 157." />
        <app-grafico titulo="Testes automatizados" subtitulo="Material (12/out) × código (declarados hoje)" [configurar]="graficoTestes" [altura]="320" [tabela]="tabelaTestes" resumo="Barras agrupadas com os testes de .NET, Angular e Python no material do TCC e no código de hoje." />
      </div>
    </app-secao>

    <app-secao titulo="Conflitos entre o material e o código" descricao="Filtre por tema. A coluna Adotado diz qual versão está nas páginas." id="conflitos">
      <app-tabela-dados [colunas]="colunasConflitos" [linhas]="conflitos" legenda="conflitos entre o material do TCC e o código" arquivo="conflitos" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Pontos de atenção encontrados no código" descricao="Não são conflitos com o texto: são achados desta leitura do repositório, para quem for evoluir o sistema." id="atencao">
      <app-tabela-dados [colunas]="colunasAtencao" [linhas]="atencao" legenda="pontos de atenção no código" arquivo="pontos-de-atencao" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Como esta documentação foi montada" id="metodo">
      <ul class="text-body-m text-foreground prose-doc flex list-disc flex-col gap-2 pl-5">
        <li>Os números (linhas, endpoints, rotas, módulos, entidades, migrations, dependências, variáveis, testes) são contados por <span class="code-inline">tools/extrair-dados.mjs</span> a partir do repositório; rode <span class="code-inline">npm run dados</span> para regenerar.</li>
        <li>Os resultados da bateria de segurança e do LFW vêm dos <span class="code-inline">resultado.json</span> das rodadas, e o texto, dos capítulos do TCC; os 35 achados foram curados à mão a partir do relatório de segurança.</li>
        <li>Tokens de design, escala tipográfica e movimento são lidos do <span class="code-inline">styles.css</span> do software, e os componentes Spartan ("helm") foram copiados do projeto.</li>
        <li>Imagens de apresentação (pré-visualizações do PDF e dos slides) não foram reaproveitadas: os diagramas foram redesenhados com os tokens do tema.</li>
      </ul>
    </app-secao>
  `
})
export class ObservacoesPage {
  protected readonly ramo = 'dv-017-seguranca';

  private readonly testesNet = backend.testes.unidade + backend.testes.integracao + backend.testes.webapi;

  protected readonly tabelaSeguranca = {
    colunas: ['Indicador', 'Material do TCC (12/out)', 'Código (13/out)'],
    linhas: [
      ['Migrations', 11, backend.migrations.length],
      ['Achados de segurança', 23, ITENS_SEGURANCA.length],
      ['Achados corrigidos', 0, corrigidos],
      ['Verificações de ataque', 0, seguranca.rodada!.total]
    ]
  };

  protected readonly graficoSeguranca = (t: TemaGrafico) => this.pares(t, this.tabelaSeguranca.linhas as [string, number, number][]);

  protected readonly tabelaTestes = {
    colunas: ['Camada', 'Material do TCC (12/out)', 'Código (declarados hoje)'],
    linhas: [
      ['.NET (unidade + integração + Web API)', 75 + 78, this.testesNet],
      ['Angular', 384, frontend.total.testes],
      ['Python (pytest)', 99, ml.total.testes],
      ['Total', 636, visao.totalTestes]
    ]
  };

  protected readonly graficoTestes = (t: TemaGrafico) => this.pares(t, this.tabelaTestes.linhas as [string, number, number][]);

  private pares(t: TemaGrafico, linhas: [string, number, number][]) {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, linhas.map((l) => l[0]), { axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11, interval: 0, width: 90, overflow: 'break' } }),
      yAxis: eixoValor(t, { minInterval: 1 }),
      series: [
        { name: 'Material do TCC', type: 'bar', data: linhas.map((l) => l[1]), itemStyle: { color: t.textoSecundario, borderRadius: [4, 4, 0, 0] }, label: { show: true, position: 'top', color: t.texto, fontFamily: t.fonte, fontSize: 11 } },
        { name: 'Código', type: 'bar', data: linhas.map((l) => l[2]), itemStyle: { color: t.series[0], borderRadius: [4, 4, 0, 0] }, label: { show: true, position: 'top', color: t.texto, fontFamily: t.fonte, fontSize: 11 } }
      ]
    };
  }

  private readonly tomAdotado = (v: Celula): TomStatus => (String(v).startsWith('Código') ? 'success' : 'info');

  protected readonly conflitos: Linha[] = [
    { tema: 'Segurança', material: '23 achados (S1–S23), nenhum corrigido; S22 (senha em log) e S1 (biometria em arquivo) "muito urgentes" (cap. 7).', codigo: `35 achados; ${corrigidos} corrigidos, 4 parciais, 2 ignorados. S22 e S1 corrigidos; bateria de ataques com ${seguranca.rodada!.aprovadas} aprovadas.`, adotado: 'Código' },
    { tema: 'Reconhecimento facial', material: 'Landmarks do MediaPipe comparados por similaridade; amostras em faces.json; sem prova de vida (cap. 6 e 7).', codigo: 'Embedding SFace de 128 números (cosseno 0,363), amostras cifradas no banco, prova de vida MiniFASNet ligada, faces.json apagado.', adotado: 'Código' },
    { tema: 'Rotas do módulo facial', material: 'Rotas do ML que gravam e comparam rostos (enroll/verify).', codigo: 'Só /face/landmarks e /face/compare existem; as rotas antigas foram removidas (ataque E01e).', adotado: 'Código' },
    { tema: 'nginx', material: 'Encaminha /api/ e apenas =~/api/ml/chat ao ML (cap. 2 e 6).', codigo: 'Client/nginx.conf também encaminha /api/cameras/ e /stream/ ao ML (necessário ao monitoramento).', adotado: 'Código' },
    { tema: 'Validação de CPF/CNPJ', material: 'Dígito verificador só no front; o back confere só o formato (S13 aberto).', codigo: 'O servidor confere o dígito (ValidacaoDeDocumentos); CPF inválido é recusado (ataque C10).', adotado: 'Código' },
    { tema: 'Limites de uso', material: 'Rate limit só em /api/auth (10 por minuto por IP).', codigo: 'Limite global por usuário ou IP, política de registro (5 por hora), IPv6 por /64, limites nas rotas do ML e login por par conta + IP.', adotado: 'Código' },
    { tema: 'Migrations', material: 'Onze migrations (cap. 4).', codigo: `${backend.migrations.length} migrations: AmostrasFaciais, Auditoria e ConsentimentoERetencaoFacial vieram depois.`, adotado: 'Código' },
    { tema: 'Testes', material: '636 testes verdes: 75 + 78 + 99 + 384 (cap. 8).', codigo: `${visao.totalTestes} declarados: ${this.testesNet} em .NET (com projeto Tests.WebApi novo), ${frontend.total.testes} no Angular e ${ml.total.testes} no ML.`, adotado: 'Código' },
    { tema: 'Branch de referência', material: 'dv-016-ajuste-fino (12/out/2026).', codigo: 'dv-017-seguranca, topo c828583 (13/out/2026), derivada da dv-016.', adotado: 'Código' },
    { tema: 'Versão do Angular', material: 'SKILL.md cita "Angular 20" em Client/ e o README do Client foi gerado pela CLI 20.3.2.', codigo: 'package.json do Client declara Angular 21.2.', adotado: 'Código' },
    { tema: 'Recuperação de senha e 2FA', material: 'Trabalho futuro (S18, "sem prioridade").', codigo: 'Implementados: TOTP com códigos de recuperação e "esqueci minha senha" por e-mail, com telas.', adotado: 'Código' },
    { tema: 'Trilha de auditoria', material: 'Trabalho futuro (S14).', codigo: 'Implementada por empresa, com tela "Auditoria" restrita à Empresa.', adotado: 'Código' },
    { tema: 'Cobertura de código', material: 'Não consta no capítulo de métricas (pendência registrada).', codigo: 'Medida em 13/out/2026 (Angular 74,8 %, ML 71,3 %, .NET 32,2 %); registrada na página Testes e qualidade.', adotado: 'Código' }
  ];

  protected readonly colunasConflitos: ColunaTabela[] = [
    { id: 'tema', titulo: 'Tema', filtravel: true },
    { id: 'material', titulo: 'Material do TCC diz', larguraMin: '18rem' },
    { id: 'codigo', titulo: 'O código mostra', larguraMin: '18rem' },
    { id: 'adotado', titulo: 'Adotado', tipo: 'selo', tom: this.tomAdotado, secundaria: true }
  ];

  protected readonly atencao: Linha[] = [
    { onde: 'MachineLeaning/yolo_tesseract/config.py', ponto: 'A variável PORT (e HOST, com padrão 0.0.0.0) é declarada mas não usada: o main.py sobe fixo na porta 8000 e a escuta vale a de shared/settings.py (127.0.0.1).', gravidade: 'Baixa' },
    { onde: 'Server/web-api e Core.Aplicacao (.csproj)', ponto: 'Serilog, Serilog.Extensions.Logging e Serilog.Sinks.Console estão referenciados, mas nenhum código usa Serilog: o log é o padrão do ASP.NET.', gravidade: 'Baixa' },
    { onde: 'Server/LocadoraDeVeiculos.Tests.Integracao', ponto: 'Usa FluentValidation 12.0.0 e FluentResults 4.0.0 enquanto a produção usa 11.11.0 e 3.16.0.', gravidade: 'Baixa' },
    { onde: 'README.md (raiz) e Client/README.md', ponto: 'O README da raiz tem uma linha e o do Client é o texto gerado pela CLI; não há guia de instalação versionado (o material do TCC o prevê como entregável futuro).', gravidade: 'Média' },
    { onde: 'Docker, nginx e CI', ponto: 'Dockerfiles, compose, nginx.conf e ci.yml existem na pasta de trabalho, mas estão fora do git e nunca foram executados; foram deixados fora de escopo por decisão.', gravidade: 'Informativa' },
    { onde: 'Segurança (S2, S3, S6, S8)', ponto: 'Quatro achados parciais: token interno padrão nesta máquina, prova de vida sem medição com webcam, cadastro sem confirmação de e-mail e SPA sem CSP.', gravidade: 'Média' },
    { onde: 'Serialização por empresa (S34)', ponto: 'A trava dos comandos de aluguel e devolução é em memória: vale para uma única instância da API.', gravidade: 'Média' },
    { onde: 'Métricas', ponto: 'Lighthouse, Web Vitals, axe, SUS, tarefas cronometradas, E2E e tempo de leitura de placa com webcam seguem sem medição.', gravidade: 'Média' }
  ];

  protected readonly colunasAtencao: ColunaTabela[] = [
    { id: 'onde', titulo: 'Onde', larguraMin: '14rem' },
    { id: 'ponto', titulo: 'O que se observa', larguraMin: '24rem' },
    { id: 'gravidade', titulo: 'Gravidade', tipo: 'selo', filtravel: true, tom: (v) => (v === 'Média' ? 'warning' : v === 'Baixa' ? 'neutral' : 'info') }
  ];
}
