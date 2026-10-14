import { ChangeDetectionStrategy, Component } from '@angular/core';
import dependencias from '../dados/dependencias.json';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

/** Papel de cada pacote conhecido; os demais aparecem com "—". */
const PAPEL: Record<string, string> = {
  '@angular/core': 'Framework: componentes standalone, signals, injeção',
  '@angular/common': 'Diretivas, pipes e utilitários comuns',
  '@angular/compiler': 'Compilador de templates',
  '@angular/forms': 'Formulários reativos tipados',
  '@angular/platform-browser': 'Execução no navegador',
  '@angular/router': 'Rotas com carregamento sob demanda',
  '@angular/cdk': 'Primitivos de acessibilidade, overlay e layout',
  '@fontsource-variable/inter': 'Fonte Inter variável (única família)',
  '@ng-icons/core': 'Componente de ícones',
  '@ng-icons/lucide': 'Conjunto Lucide (único conjunto de ícones)',
  '@spartan-ng/brain': 'Primitivos headless do Spartan UI',
  '@spartan-ng/cli': 'CLI que copia os componentes "helm"',
  '@tailwindcss/postcss': 'Tailwind v4 via PostCSS',
  '@tanstack/angular-table': 'Motor de tabela (ordenação, filtro, paginação)',
  'class-variance-authority': 'Variantes tipadas dos componentes',
  clsx: 'Composição de classes condicionais',
  echarts: 'Gráficos (biblioteca única)',
  'ngx-echarts': 'Integração do ECharts com Angular',
  jspdf: 'Geração do PDF de relatório e recibo',
  'jspdf-autotable': 'Tabelas dentro do PDF',
  luxon: 'Datas e fuso horário',
  'ngx-sonner': 'Toasts',
  postcss: 'Processamento de CSS',
  rxjs: 'Fluxos assíncronos e HTTP',
  'tailwind-merge': 'Resolve conflitos de classes Tailwind',
  tailwindcss: 'Utilitários de estilo, só com tokens',
  tslib: 'Helpers do TypeScript',
  'tw-animate-css': 'Animações do Spartan',
  'zone.js': 'Detecção de mudanças',
  '@angular/build': 'Builder (esbuild/Vite)',
  '@angular/cli': 'Linha de comando do Angular',
  '@angular/compiler-cli': 'Compilador AOT',
  typescript: 'Linguagem',
  'jasmine-core': 'Framework de testes dos specs',
  karma: 'Executor dos specs no navegador',
  'karma-chrome-launcher': 'Abre o navegador dos testes (aqui, o Edge)',
  'karma-coverage': 'Relatório de cobertura',
  'karma-jasmine': 'Ponte Karma ↔ Jasmine',
  'karma-jasmine-html-reporter': 'Relatório HTML dos testes',
  '@types/jasmine': 'Tipos do Jasmine',
  FluentResults: 'Resultado tipado dos handlers',
  FluentValidation: 'Validadores por command',
  'FluentValidation.DependencyInjectionExtensions': 'Registro dos validadores na injeção',
  MediatR: 'CQRS: commands, queries e behaviors',
  'Microsoft.AspNetCore.Authentication.JwtBearer': 'Autenticação por JWT',
  'Microsoft.EntityFrameworkCore': 'ORM',
  'Microsoft.EntityFrameworkCore.SqlServer': 'Provedor do SQL Server',
  'Microsoft.EntityFrameworkCore.Tools': 'Migrations',
  'Microsoft.AspNetCore.Identity.EntityFrameworkCore': 'ASP.NET Identity sobre o EF Core',
  Serilog: 'Registro de logs estruturado',
  'Swashbuckle.AspNetCore': 'Swagger (só em desenvolvimento)',
  'System.IdentityModel.Tokens.Jwt': 'Geração do JWT',
  MSTest: 'Framework de testes do .NET',
  Moq: 'Dublês nos testes de unidade',
  NBuilder: 'Construção de dados de teste',
  'Microsoft.EntityFrameworkCore.InMemory': 'Banco em memória para integração',
  'Microsoft.AspNetCore.Mvc.Testing': 'WebApplicationFactory: sobe a Web API nos testes',
  fastapi: 'Servidor HTTP do serviço de ML',
  uvicorn: 'Servidor ASGI',
  pydantic: 'Modelos e validação de entrada',
  'python-multipart': 'Formulários e uploads',
  'opencv-python': 'Captura de webcam e processamento de imagem',
  numpy: 'Matrizes numéricas',
  ultralytics: 'YOLOv8',
  pytesseract: 'Ponte para o OCR Tesseract',
  mediapipe: 'FaceMesh: landmarks do rosto',
  Pillow: 'Imagens',
  httpx: 'Cliente HTTP do chatbot',
  pytest: 'Testes do ML'
};

@Component({
  selector: 'app-dependencias',
  imports: [GraficoComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Pacotes npm" [valor]="totalNpm" [apoio]="dependencias.npm.producao.length + ' de produção · ' + dependencias.npm.desenvolvimento.length + ' de desenvolvimento'" icone="lucidePackage" />
      <app-kpi-card rotulo="Pacotes NuGet distintos" [valor]="nugetDistintos" [apoio]="'em ' + dependencias.nuget.length + ' projetos .NET'" icone="lucideBox" />
      <app-kpi-card rotulo="Pacotes pip diretos" [valor]="dependencias.pip.length + dependencias.pipDev.length" [apoio]="dependencias.pipTravados + ' com hash no lock'" icone="lucideTerminal" />
      <app-kpi-card rotulo="Vulnerabilidades conhecidas" valor="0" apoio="dotnet, npm (--omit=dev) e pip-audit, em 13/out/2026" icone="lucideShieldCheck" />
    </div>

    <app-secao titulo="Visão por ecossistema" id="visao">
      <div class="grid gap-4 lg:grid-cols-2">
        <app-grafico titulo="Pacotes diretos por ecossistema" subtitulo="Produção e desenvolvimento/teste" [configurar]="graficoEcossistemas" [altura]="300" [tabela]="tabelaEcossistemas" resumo="Barras empilhadas com os pacotes diretos de produção e de desenvolvimento ou teste em npm, NuGet e pip." />
        <app-grafico titulo="Pacotes NuGet por projeto" subtitulo="Dependências diretas declaradas em cada .csproj" [configurar]="graficoNuget" [altura]="300" [tabela]="tabelaNuget" resumo="Barras horizontais com a quantidade de pacotes NuGet diretos de cada projeto da solução." />
      </div>
    </app-secao>

    <app-secao titulo="Todos os pacotes" descricao="Pacotes diretos declarados em package.json, nos .csproj e em requirements.txt. Filtre por ecossistema e tipo." id="pacotes">
      <app-tabela-dados [colunas]="colunas" [linhas]="pacotes" legenda="pacotes diretos do sistema" arquivo="dependencias" [tamanhoInicial]="25" />
    </app-secao>

    <app-secao titulo="Cadeia de suprimentos" id="suprimentos">
      <div class="grid gap-3 md:grid-cols-2">
        @for (c of cuidados; track c.titulo) {
          <article class="border-border bg-card flex flex-col gap-1 rounded-xl border p-4">
            <p class="text-title-s text-foreground">{{ c.titulo }}</p>
            <p class="text-body-m text-muted-foreground">{{ c.texto }}</p>
          </article>
        }
      </div>
      <app-nota tom="info" titulo="Versões divergentes nos testes">
        O projeto Tests.Integracao referencia FluentValidation 12.0.0 e FluentResults 4.0.0, enquanto a produção usa 11.11.0 e 3.16.0; a solução compila e os testes passam, mas as versões
        deveriam ser alinhadas.
      </app-nota>
    </app-secao>
  `
})
export class DependenciasPage {
  protected readonly dependencias = dependencias;

  protected readonly totalNpm = dependencias.npm.producao.length + dependencias.npm.desenvolvimento.length;
  protected readonly nugetDistintos = new Set(dependencias.nuget.flatMap((p) => p.pacotes.map((x) => x.nome))).size;

  protected readonly pacotes: Linha[] = [
    ...dependencias.npm.producao.map((p) => ({ ecossistema: 'npm', tipo: 'Produção', pacote: p.nome, versao: p.versao, projeto: 'Client', papel: PAPEL[p.nome] ?? '—' })),
    ...dependencias.npm.desenvolvimento.map((p) => ({ ecossistema: 'npm', tipo: 'Desenvolvimento', pacote: p.nome, versao: p.versao, projeto: 'Client', papel: PAPEL[p.nome] ?? '—' })),
    ...dependencias.nuget.flatMap((proj) =>
      proj.pacotes.map((p) => ({ ecossistema: 'NuGet', tipo: /Test/.test(proj.projeto) ? 'Teste' : 'Produção', pacote: p.nome, versao: p.versao, projeto: proj.projeto, papel: PAPEL[p.nome] ?? '—' }))
    ),
    ...dependencias.pip.map((p) => ({ ecossistema: 'pip', tipo: 'Produção', pacote: p.nome, versao: p.versao, projeto: 'MachineLeaning', papel: PAPEL[p.nome] ?? '—' })),
    ...dependencias.pipDev.map((p) => ({ ecossistema: 'pip', tipo: 'Desenvolvimento', pacote: p.nome, versao: p.versao, projeto: 'MachineLeaning', papel: PAPEL[p.nome] ?? '—' }))
  ];

  protected readonly colunas: ColunaTabela[] = [
    { id: 'ecossistema', titulo: 'Ecossistema', filtravel: true },
    { id: 'tipo', titulo: 'Tipo', filtravel: true, secundaria: true },
    { id: 'pacote', titulo: 'Pacote', tipo: 'codigo', larguraMin: '14rem' },
    { id: 'versao', titulo: 'Versão', tipo: 'codigo' },
    { id: 'projeto', titulo: 'Projeto', filtravel: true, secundaria: true },
    { id: 'papel', titulo: 'Papel', larguraMin: '16rem', secundaria: true }
  ];

  private readonly ecossistemas = [
    ['npm', dependencias.npm.producao.length, dependencias.npm.desenvolvimento.length],
    ['NuGet', dependencias.nuget.filter((p) => !/Test/.test(p.projeto)).reduce((a, p) => a + p.pacotes.length, 0), dependencias.nuget.filter((p) => /Test/.test(p.projeto)).reduce((a, p) => a + p.pacotes.length, 0)],
    ['pip', dependencias.pip.length, dependencias.pipDev.length]
  ] as const;

  protected readonly tabelaEcossistemas = { colunas: ['Ecossistema', 'Produção', 'Desenvolvimento/teste'], linhas: this.ecossistemas.map(([n, a, b]) => [n, a, b]) };
  protected readonly graficoEcossistemas = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.ecossistemas.map(([n]) => n)),
      yAxis: eixoValor(t, { minInterval: 1 }),
      series: [
        { name: 'Produção', type: 'bar', stack: 'p', data: this.ecossistemas.map(([, a]) => a), itemStyle: { color: t.series[0] }, barWidth: 44 },
        { name: 'Desenvolvimento/teste', type: 'bar', stack: 'p', data: this.ecossistemas.map(([, , b]) => b), itemStyle: { color: t.series[2], borderRadius: [6, 6, 0, 0] } }
      ]
    };
  };

  protected readonly tabelaNuget = { colunas: ['Projeto', 'Pacotes'], linhas: dependencias.nuget.map((p) => [p.projeto, p.pacotes.length]) };
  protected readonly graficoNuget = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: eixoValor(t, { minInterval: 1 }),
    yAxis: eixoCategoria(t, dependencias.nuget.map((p) => p.projeto), { inverse: true, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11 } }),
    series: [{
      type: 'bar', barWidth: 16,
      data: dependencias.nuget.map((p) => ({ value: p.pacotes.length, itemStyle: { color: /Test/.test(p.projeto) ? t.series[2] : t.series[0], borderRadius: [0, 6, 6, 0] } })),
      label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte }
    }]
  });

  protected readonly cuidados = [
    { titulo: 'Auditoria periódica', texto: 'dotnet list package --vulnerable --include-transitive (limpo nos 7 projetos), npm audit --omit=dev (0) e pip-audit nas dependências diretas (nenhuma vulnerabilidade conhecida).' },
    { titulo: 'ML com versões e hashes travados', texto: `requirements.lock.txt (${dependencias.pipTravados} pacotes) e requirements-dev.lock.txt com SHA-256, instalados com pip install --require-hashes --no-deps; um teste impede o lock de ficar defasado.` },
    { titulo: 'Modelos e pesos', texto: 'YOLO, SFace e MiniFASNet têm origem em commit fixo e SHA-256 conferido; arquivos .pt, .pth e .onnx não vão para o git.' },
    { titulo: 'Pacotes sem uso removidos', texto: 'Hangfire e NewRelic (referenciados e nunca usados) saíram da solução, junto de código morto com IgnoreQueryFilters.' }
  ];
}
