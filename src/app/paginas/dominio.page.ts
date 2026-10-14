import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { NgIcon } from '@ng-icons/core';
import backend from '../dados/backend.json';
import endpoints from '../dados/endpoints.json';
import { inteiro } from '../core/formato';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const papeisDoModulo = (modulo: string): string => {
  const papeis = new Set(endpoints.dotnet.filter((e) => e.modulo === modulo).map((e) => e.papel));
  if (papeis.has('Público') || papeis.has('Autenticado')) return 'Público e autenticado';
  if (papeis.has('Empresa') && papeis.has('Empresa e Funcionário')) return 'Misto: leitura para ambos, escrita só da Empresa';
  return papeis.has('Empresa') ? 'Somente Empresa' : 'Empresa e Funcionário';
};

@Component({
  selector: 'app-dominio',
  imports: [MatExpansionModule, NgIcon, GraficoComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Módulos" [valor]="backend.modulos.length" apoio="cada um com controller e handlers" icone="lucideBriefcase" />
      <app-kpi-card rotulo="Commands e queries" [valor]="totalComandos + totalConsultas" [apoio]="totalComandos + ' commands · ' + totalConsultas + ' queries'" icone="lucideWorkflow" />
      <app-kpi-card rotulo="Validadores" [valor]="totalValidadores" apoio="FluentValidation, um por entrada" icone="lucideCircleCheck" />
      <app-kpi-card rotulo="Migrations" [valor]="backend.migrations.length" apoio="do primeiro esquema à auditoria e ao consentimento facial" icone="lucideDatabase" />
    </div>

    <app-secao titulo="Módulos de negócio" descricao="Quantidades extraídas de Core.Aplicacao e dos controllers. O papel vem do [Authorize] real de cada endpoint." id="modulos">
      <app-tabela-dados [colunas]="colunasModulos" [linhas]="modulos" legenda="módulos de negócio" arquivo="modulos" [tamanhoInicial]="10" />
      <app-grafico
        titulo="Commands, queries e validadores por módulo"
        subtitulo="Cada barra é um módulo; Autenticação concentra login, rosto, 2FA e recuperação de senha"
        [configurar]="graficoOperacoes"
        [altura]="360"
        [tabela]="tabelaOperacoes"
        resumo="Barras empilhadas com a quantidade de commands e queries por módulo, mais uma linha com os validadores."
      />
    </app-secao>

    <app-secao titulo="Quem acessa o quê" descricao="A matriz oficial fica em core/permissoes.ts no front e é conferida por um spec de rotas; a autoridade é sempre a API." id="papeis">
      <div class="grid gap-6 md:grid-cols-2">
        @for (p of papeis; track p.nome) {
          <article class="border-border bg-card flex flex-col gap-3 rounded-xl border p-6">
            <h3 class="text-title-m text-foreground flex items-center gap-2">
              <ng-icon [name]="p.icone" class="text-lg" aria-hidden="true" /> {{ p.nome }}
            </h3>
            <p class="text-body-m text-muted-foreground">{{ p.resumo }}</p>
            <ul class="text-body-m text-foreground list-disc pl-5">
              @for (i of p.itens; track i) {
                <li>{{ i }}</li>
              }
            </ul>
          </article>
        }
      </div>
      <app-nota tom="info">Não existe super-administrador: nenhum papel enxerga dados de outra empresa. O Funcionário herda o identificador da empresa que o cadastrou.</app-nota>
    </app-secao>

    <app-secao titulo="Entidades do domínio" descricao="Todas herdam de EntidadeBase&lt;T&gt; (Id, CriadoEmUtc, Excluido, EmpresaId), exceto as de autenticação e auditoria." id="entidades">
      <app-tabela-dados [colunas]="colunasEntidades" [linhas]="entidades" legenda="entidades do domínio" arquivo="entidades" [tamanhoInicial]="10" />
      <app-grafico titulo="Propriedades por entidade" subtitulo="Aluguel e Cliente são as mais largas" [configurar]="graficoEntidades" [altura]="420" [tabela]="tabelaEntidades" resumo="Barras horizontais com o número de propriedades públicas de cada entidade do domínio." />
    </app-secao>

    <app-secao titulo="Regras que o servidor impõe" descricao="Cada regra está no domínio ou em um handler — nunca no navegador." id="regras">
      <mat-accordion multi>
        @for (r of regras; track r.titulo) {
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title class="gap-2"><ng-icon [name]="r.icone" aria-hidden="true" /> {{ r.titulo }}</mat-panel-title>
              <mat-panel-description class="max-md:hidden">{{ r.resumo }}</mat-panel-description>
            </mat-expansion-panel-header>
            <div class="text-body-m text-foreground prose-doc flex flex-col gap-2">
              @for (p of r.paragrafos; track p) {
                <p>{{ p }}</p>
              }
            </div>
          </mat-expansion-panel>
        }
      </mat-accordion>
    </app-secao>
  `
})
export class DominioPage {
  protected readonly backend = backend;
  protected readonly totalComandos = backend.modulos.reduce((a, m) => a + m.comandos, 0);
  protected readonly totalConsultas = backend.modulos.reduce((a, m) => a + m.consultas, 0);
  protected readonly totalValidadores = backend.modulos.reduce((a, m) => a + m.validadores, 0);

  protected readonly modulos: Linha[] = backend.modulos.map((m) => ({
    modulo: m.nome, papel: papeisDoModulo(m.nome), endpoints: m.endpoints, comandos: m.comandos, consultas: m.consultas, validadores: m.validadores
  }));

  protected readonly colunasModulos: ColunaTabela[] = [
    { id: 'modulo', titulo: 'Módulo' },
    { id: 'papel', titulo: 'Papel', filtravel: true, larguraMin: '12rem' },
    { id: 'endpoints', titulo: 'Endpoints', tipo: 'numero' },
    { id: 'comandos', titulo: 'Commands', tipo: 'numero', secundaria: true },
    { id: 'consultas', titulo: 'Queries', tipo: 'numero', secundaria: true },
    { id: 'validadores', titulo: 'Validadores', tipo: 'numero', secundaria: true }
  ];

  protected readonly papeis = [
    {
      nome: 'Empresa', icone: 'lucideBuilding2', resumo: 'Administra a locadora.',
      itens: ['Funcionários, grupos de veículo, planos de cobrança e parceiros', 'Cupons, desafios, taxas e serviços (criar, editar e excluir)', 'Configurações (caução padrão e preço do combustível) e trilha de auditoria', 'Cadastro e edição de veículos; encerrar a conta da empresa']
    },
    {
      nome: 'Funcionário', icone: 'lucideUsers', resumo: 'Opera o balcão.',
      itens: ['Clientes (pessoa física e jurídica) e condutores', 'Aluguéis e devoluções, inclusive a simulação de valor', 'Leitura de veículos e de taxas, para montar o aluguel', 'Monitoramento de câmeras e verificação facial']
    }
  ];

  private readonly operacoes = [...backend.modulos].sort((a, b) => b.comandos + b.consultas - (a.comandos + a.consultas));

  protected readonly tabelaOperacoes = {
    colunas: ['Módulo', 'Commands', 'Queries', 'Validadores'],
    linhas: this.operacoes.map((m) => [m.nome, m.comandos, m.consultas, m.validadores])
  };

  protected readonly graficoOperacoes = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 8, top: 44, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoCategoria(t, this.operacoes.map((m) => m.nome), { axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11, interval: 0, rotate: 35 } }),
      yAxis: eixoValor(t, { minInterval: 1 }),
      series: [
        { name: 'Commands', type: 'bar', stack: 'ops', data: this.operacoes.map((m) => m.comandos), itemStyle: { color: t.series[0] } },
        { name: 'Queries', type: 'bar', stack: 'ops', data: this.operacoes.map((m) => m.consultas), itemStyle: { color: t.series[2] } },
        { name: 'Validadores', type: 'line', data: this.operacoes.map((m) => m.validadores), symbol: 'diamond', symbolSize: 9, lineStyle: { color: t.texto, type: 'dashed', width: 2 }, itemStyle: { color: t.texto } }
      ]
    };
  };

  private readonly listaEntidades = backend.entidades.filter((e) => e.tipo === 'entidade' && e.propriedades > 0).sort((a, b) => b.propriedades - a.propriedades);

  protected readonly entidades: Linha[] = this.listaEntidades.map((e) => ({ entidade: e.nome, modulo: e.modulo, propriedades: e.propriedades, metodos: e.metodos }));

  protected readonly colunasEntidades: ColunaTabela[] = [
    { id: 'entidade', titulo: 'Entidade', tipo: 'codigo' },
    { id: 'modulo', titulo: 'Módulo', filtravel: true },
    { id: 'propriedades', titulo: 'Propriedades', tipo: 'numero' },
    { id: 'metodos', titulo: 'Métodos de regra', tipo: 'numero', secundaria: true }
  ];

  protected readonly tabelaEntidades = {
    colunas: ['Entidade', 'Propriedades'],
    linhas: this.listaEntidades.map((e) => [e.nome, e.propriedades])
  };

  protected readonly graficoEntidades = (t: TemaGrafico) => ({
    ...baseDoGrafico(t),
    grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
    tooltip: { ...baseDoGrafico(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: eixoValor(t, { minInterval: 1 }),
    yAxis: eixoCategoria(t, this.listaEntidades.map((e) => e.nome), { inverse: true }),
    series: [
      {
        type: 'bar', barWidth: 14,
        data: this.listaEntidades.map((e) => ({ value: e.propriedades, itemStyle: { color: t.series[0], borderRadius: [0, 6, 6, 0] } })),
        label: { show: true, position: 'right', color: t.texto, fontFamily: t.fonte }
      }
    ]
  });

  protected readonly regras = [
    {
      icone: 'lucideCalendarCheck', titulo: 'Cálculo do aluguel', resumo: 'O servidor recalcula; o navegador só mostra.',
      paragrafos: [
        'CalculoAluguelService obtém o valor previsto a partir do plano de cobrança do grupo do veículo e de cada taxa (TaxaServico.CalcularValor(dias): valor fixo ou preço × dias).',
        'POST /api/alugueis/simular devolve o mesmo cálculo para o "Resumo do valor" do formulário, então o usuário vê o que o servidor vai gravar. O campo valorPrevisto enviado no cadastro é ignorado.',
        'A caução é copiada de Configuracao.ValorGarantia no momento da contratação: mudar a configuração depois não altera os aluguéis já feitos.'
      ]
    },
    {
      icone: 'lucideRefreshCw', titulo: 'Ciclo de vida do aluguel', resumo: 'Reservado → Em andamento → Concluído ou Cancelado.',
      paragrafos: [
        'Só um aluguel Reservado pode ser iniciado; Concluído e Cancelado não podem mais ser editados; Concluído e Em andamento não podem ser excluídos (PodeSerEditado e PodeSerExcluido).',
        'Comandos de aluguel e devolução passam por SerializarPorEmpresaBehavior: dois pedidos simultâneos da mesma empresa nunca correm em paralelo, o que impede reserva dupla e iniciar o mesmo aluguel várias vezes.',
        'Cliente, veículo e condutor precisam ser da empresa; o período máximo é de 365 dias; taxas inexistentes são recusadas em vez de ignoradas.'
      ]
    },
    {
      icone: 'lucideCar', titulo: 'Disponibilidade do veículo', resumo: 'Atrasado continua bloqueado até a devolução.',
      paragrafos: [
        'Um veículo não pode ser alugado em período que cruze outro aluguel ativo. Um aluguel Em andamento com retorno previsto vencido continua bloqueando o veículo até a devolução.',
        'A lista de disponíveis, o cadastro, o dashboard e o assistente usam a mesma regra, para que as quatro visões concordem.'
      ]
    },
    {
      icone: 'lucideFuel', titulo: 'Devolução, multa e combustível', resumo: '10 % da diária por dia de atraso.',
      paragrafos: [
        'Devolucao.CalcularValores calcula a multa proporcional: diária × 10 % × dias de atraso (arredondados para cima); sem atraso, multa zero.',
        'O adicional de combustível cobra os litros que faltam para a capacidade do tanque, ao preço da configuração, quando o nível devolvido está abaixo do nível acordado.',
        'O valor total é o previsto do aluguel + multa + combustível. A exclusão de registros é bloqueada com 422 quando há vínculo ativo (cliente com aluguel, veículo com aluguel, grupo com veículos).'
      ]
    },
    {
      icone: 'lucideTag', titulo: 'Cupons e desafios', resumo: 'Validade, limite de uso e desconto nunca maior que o valor.',
      paragrafos: [
        'Cupom.EstaValido exige cupom ativo, dentro da validade e com usos restantes; CalcularDesconto aceita percentual ou valor fixo e nunca passa do valor-base.',
        'O uso do cupom é registrado na contratação e, por causa da serialização por empresa, um cupom de uso único não vale duas vezes em pedidos simultâneos.',
        'Um desafio de cupom é uma meta (N aluguéis em um período) que libera um cupom de recompensa para o cliente.'
      ]
    },
    {
      icone: 'lucideReceipt', titulo: 'Validação de entrada', resumo: 'Cada command tem um validador.',
      paragrafos: [
        'FluentValidation valida cada command e query. CPF e CNPJ têm o dígito verificador conferido também no servidor (achado S13, corrigido), além do front-end.',
        'A senha tem de 8 a 128 caracteres com número, maiúscula e minúscula, a mesma regra no front e no back; a foto do veículo só aceita https ou imagem pequena.'
      ]
    }
  ];

  protected readonly inteiro = inteiro;
}
