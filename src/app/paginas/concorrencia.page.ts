import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import seguranca from '../dados/seguranca.json';
import { GraficoComponent } from '../shared/charts/grafico.component';
import { baseDoGrafico, eixoCategoria, eixoValor, type TemaGrafico } from '../shared/charts/tema-grafico';
import { ConceitosComponent, type Conceito } from '../shared/layout/conceitos.component';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { NotaComponent } from '../shared/layout/nota.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import type { TomStatus } from '../shared/layout/status-badge.component';
import { TabelaDadosComponent, type Celula, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const rodada = seguranca.rodada!;
const destaque = (categoria: string, id: string): string =>
  (rodada.destaques[`${categoria}|${id}` as keyof typeof rodada.destaques] ?? '').replace(/(\d)\.(\d)/g, '$1,$2');

/** Cenários de "muitos pedidos iguais ao mesmo tempo": id, categoria e nome curto para o gráfico. */
const CENARIOS: [string, string, string][] = [
  ['Corridas', 'J01', 'CPF de cliente'],
  ['Corridas', 'J02', 'CNPJ de empresa-cliente'],
  ['Corridas', 'J03', 'CPF de condutor'],
  ['Corridas', 'J04', 'CNH de condutor'],
  ['Corridas', 'J05', 'Placa de automóvel'],
  ['Corridas', 'J06', 'Nome de grupo'],
  ['Corridas', 'J07', 'Código de cupom'],
  ['Corridas', 'J08', 'Nome de taxa'],
  ['Corridas', 'J09', 'CNPJ de parceiro'],
  ['Corridas', 'J10', 'CPF de funcionário'],
  ['Corridas', 'J11', 'E-mail de funcionário'],
  ['Corridas', 'J13', 'Devolução do mesmo aluguel'],
  ['Duas instâncias', 'N02', 'Cupom de 1 uso (2 instâncias)'],
  ['Duas instâncias', 'N03', 'Devolução (2 instâncias)'],
  ['Duas instâncias', 'N04', 'CPF de funcionário (2 instâncias)']
];

function lerPedidos(texto: string): { aceitos: number; total: number } | null {
  const m = texto.match(/^(\d+) aceit\w+;\s*(?:status )?\[([^\]]*)\]/);
  if (!m) return null;
  return { aceitos: Number(m[1]), total: m[2].split(',').length };
}

@Component({
  selector: 'app-concorrencia',
  imports: [NgIcon, GraficoComponent, ConceitosComponent, KpiCardComponent, NotaComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Cenários de corrida" [valor]="cenarios.length" apoio="pedidos iguais e simultâneos: sempre um aceito" icone="lucideWorkflow" />
      <app-kpi-card rotulo="Reservas simultâneas" valor="12 de 12" apoio="rodadas sem reserva dupla com duas instâncias da API" icone="lucideCar" />
      <app-kpi-card rotulo="Escritas sob carga mista" [valor]="escritas" apoio="clientes e aluguéis criados com leitura ao mesmo tempo" icone="lucideDatabase" />
      <app-kpi-card rotulo="Perdidos ou repetidos" valor="0" apoio="conferido no banco depois da carga" icone="lucideCircleCheck" />
    </div>

    <app-secao titulo="O problema" descricao="Quando dois pedidos da mesma empresa chegam juntos, os dois podem ler o mesmo estado antes de qualquer um gravar. O resultado é duas reservas do mesmo carro, um cupom de uso único usado duas vezes ou um cadastro duplicado." id="problema">
      <app-conceitos [itens]="conceitos" />
    </app-secao>

    <app-secao titulo="As camadas de proteção" descricao="Nenhuma camada sozinha basta; cada uma cobre o que a anterior não alcança." id="camadas">
      <ol class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        @for (c of camadas; track c.titulo; let i = $index) {
          <li class="border-border bg-card flex h-full flex-col gap-3 rounded-xl border p-6">
            <span class="bg-primary text-primary-foreground text-label-m tabular flex size-8 items-center justify-center rounded-full">{{ i + 1 }}</span>
            <h3 class="text-title-m text-foreground">{{ c.titulo }}</h3>
            <p class="text-body-m text-muted-foreground">{{ c.texto }}</p>
            <p class="text-label-m text-muted-foreground mt-auto"><span class="code-inline">{{ c.onde }}</span></p>
          </li>
        }
      </ol>
    </app-secao>

    <app-secao titulo="A prova: muitos pedidos iguais ao mesmo tempo" descricao="Cada cenário dispara 6 a 12 pedidos idênticos em paralelo e confere o resultado no banco, não só o código de resposta. O esperado é sempre um aceito e os demais recusados, sem erro 5xx." id="prova">
      <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <app-grafico titulo="Pedidos aceitos × recusados por cenário" subtitulo="Em todos, um único pedido vence" [configurar]="graficoPedidos" [altura]="460" [tabela]="tabelaPedidos" resumo="Barras horizontais empilhadas com um pedido aceito e os demais recusados em cada cenário de corrida, de cadastros duplicados a devoluções repetidas, inclusive com duas instâncias da API." />
        <div class="flex flex-col gap-6">
          <app-nota tom="sucesso" titulo="Duas instâncias da API no mesmo banco">
            Reserva do mesmo carro em 12 rodadas, cupom de uso único, devolução repetida e funcionário com o mesmo CPF: nunca mais de um aceito, com metade dos pedidos em cada instância.
          </app-nota>
          <app-nota tom="info" titulo="Outro estado final válido">
            Iniciar e cancelar o mesmo aluguel ao mesmo tempo termina em um só estado (hoje, Em andamento), sem erro 5xx, dentro de uma instância e entre duas.
          </app-nota>
        </div>
      </div>
      <app-tabela-dados [colunas]="colunasProvas" [linhas]="provas" legenda="verificações de corrida e de duas instâncias" arquivo="verificacoes-de-concorrencia" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Carga mista de leitura e escrita" descricao="20 usuários por 15 segundos lendo e escrevendo juntos, com os invariantes conferidos no banco depois." id="carga">
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        @for (c of cargaMista; track c.titulo) {
          <article class="border-border bg-card flex h-full flex-col gap-3 rounded-xl border p-6">
            <span class="bg-secondary text-secondary-foreground flex size-11 items-center justify-center rounded-full">
              <ng-icon [name]="c.icone" class="text-xl" aria-hidden="true" />
            </span>
            <h3 class="text-title-s text-foreground">{{ c.titulo }}</h3>
            <p class="text-body-m text-muted-foreground">{{ c.valor }}</p>
          </article>
        }
      </div>
    </app-secao>

    <app-secao titulo="Defeitos que a bateria achou e foram corrigidos" descricao="Cada correção tem um teste que falha sem ela." id="defeitos">
      <app-tabela-dados [colunas]="colunasDefeitos" [linhas]="defeitos" legenda="defeitos de concorrência achados e corrigidos" arquivo="defeitos-de-concorrencia" [tamanhoInicial]="10" />
    </app-secao>

    <app-secao titulo="Decisões e limites" id="decisoes">
      <div class="grid gap-6 md:grid-cols-3">
        @for (d of decisoes; track d.titulo) {
          <article class="border-border bg-card flex h-full flex-col gap-3 rounded-xl border p-6">
            <h3 class="text-title-m text-foreground">{{ d.titulo }}</h3>
            <p class="text-body-m text-muted-foreground">{{ d.texto }}</p>
          </article>
        }
      </div>
    </app-secao>
  `
})
export class ConcorrenciaPage {
  protected readonly cenarios = CENARIOS;
  protected readonly escritas = Number(destaque('Carga', 'L09').match(/em (\d+) escritas/)?.[1] ?? 0).toLocaleString('pt-BR');

  protected readonly conceitos: Conceito[] = [
    { termo: 'Condição de corrida', definicao: 'O resultado depende de qual pedido chega primeiro. Em sistema de reserva, "verificar se está livre" e "gravar a reserva" precisam acontecer sem ninguém entrar no meio.', noSistema: 'Dez pedidos para o mesmo carro e período criam, no máximo, um aluguel.' },
    { termo: 'Fila por empresa', definicao: 'Os comandos que mudam estado de uma empresa passam um de cada vez; empresas diferentes não esperam umas pelas outras. É exclusão mútua por tenant.', noSistema: 'SerializarPorEmpresaBehavior envolve todo pedido do MediatR marcado com ISerializadoPorEmpresa.' },
    { termo: 'Trava de banco', definicao: 'A fila em memória só vale dentro de um processo. Com duas instâncias da API no mesmo banco, a exclusão mútua precisa estar no banco.', noSistema: 'sp_getapplock por empresa, adquirido depois do semáforo local.' },
    { termo: 'Índice único como última barreira', definicao: 'Mesmo com fila e trava, o banco recusa o registro repetido. Quem perde a corrida recebe uma resposta limpa, não um erro interno.', noSistema: 'Erros 2601 e 2627 do SQL Server viram 409 (ViolacaoDeUnicidade) em vez de 500.' }
  ];

  protected readonly camadas = [
    { titulo: 'Fila por empresa', texto: 'Um semáforo por EmpresaId, compartilhado por todos os comandos de escrita marcados, não um por tipo de comando.', onde: 'TravasPorEmpresa' },
    { titulo: 'Trava no banco', texto: 'Mesma exclusão por empresa, agora entre instâncias da API, pelo próprio SQL Server.', onde: 'TravaNoBanco (sp_getapplock)' },
    { titulo: 'Unicidade por empresa', texto: 'CPF, CNPJ, CNH, placa, nome e código são únicos dentro da empresa, não no banco inteiro; duas empresas podem cadastrar o mesmo valor.', onde: 'Índices únicos por (EmpresaId, valor)' },
    { titulo: 'Resposta limpa', texto: 'A violação de unicidade responde 409. O pedido perdedor nunca vira erro 500 nem deixa registro pela metade.', onde: 'ViolacaoDeUnicidade' }
  ];

  private readonly pedidos = CENARIOS.map(([categoria, id, nome]) => ({ id, nome, ...(lerPedidos(destaque(categoria, id)) ?? { aceitos: 1, total: 0 }) })).filter((p) => p.total > 0);
  protected readonly tabelaPedidos = { colunas: ['Cenário', 'Aceitos', 'Recusados'], linhas: this.pedidos.map((p) => [p.nome, p.aceitos, p.total - p.aceitos]) };
  protected readonly graficoPedidos = (t: TemaGrafico) => {
    const base = baseDoGrafico(t);
    return {
      ...base,
      grid: { left: 8, right: 24, top: 36, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { ...base.legend, top: 0 },
      xAxis: eixoValor(t, { minInterval: 1 }),
      yAxis: eixoCategoria(t, this.pedidos.map((p) => p.nome), { inverse: true, axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 11 } }),
      series: [
        { name: 'Aceitos', type: 'bar', stack: 'p', data: this.pedidos.map((p) => p.aceitos), itemStyle: { color: t.sucesso }, barWidth: 14 },
        { name: 'Recusados', type: 'bar', stack: 'p', data: this.pedidos.map((p) => p.total - p.aceitos), itemStyle: { color: t.series[0], borderRadius: [0, 6, 6, 0] } }
      ]
    };
  };

  private readonly tomResultado = (v: Celula): TomStatus => (v === 'Aprovada' ? 'success' : v === 'Reprovada' ? 'error' : 'warning');
  protected readonly provas: Linha[] = rodada.verificacoes
    .filter((v) => v.categoria === 'Corridas' || v.categoria === 'Duas instâncias' || v.categoria === 'Isolamento')
    .map((v) => ({ id: v.id, categoria: v.categoria, titulo: v.titulo, resultado: v.resultado }));
  protected readonly colunasProvas: ColunaTabela[] = [
    { id: 'id', titulo: 'ID', tipo: 'codigo' },
    { id: 'categoria', titulo: 'Categoria', filtravel: true, secundaria: true },
    { id: 'titulo', titulo: 'Verificação', larguraMin: '24rem' },
    { id: 'resultado', titulo: 'Resultado', tipo: 'selo', filtravel: true, tom: this.tomResultado }
  ];

  protected readonly cargaMista = [
    { icone: 'lucideCircleCheck', titulo: 'Sem erro 5xx nem conexão derrubada', valor: destaque('Carga', 'L06').replace('5xx=', 'erros 5xx: ').replace('conexões=', 'conexões derrubadas: ') },
    { icone: 'lucideUsers', titulo: 'Nenhum cliente perdido ou repetido', valor: destaque('Carga', 'L07') },
    { icone: 'lucideCar', titulo: 'Nenhum carro com dois aluguéis ativos sobrepostos', valor: destaque('Carga', 'L08') },
    { icone: 'lucideTimer', titulo: 'Escrita rápida mesmo com a fila', valor: destaque('Carga', 'L09').replace(' ms em ', ' ms (p95) em ') }
  ];

  protected readonly defeitos: Linha[] = [
    { defeito: 'A fila por empresa não era uma só', antes: 'O semáforo ficava num campo estático de uma classe genérica: um por tipo de comando, e iniciar e cancelar passavam juntos.', depois: 'TravasPorEmpresa, não genérica, compartilhada por todos os comandos marcados.' },
    { defeito: 'Cadastro duplicado simultâneo dava 500', antes: 'O índice único estourava em cliente, empresa-cliente, condutor, carro, grupo, cupom, taxa, parceiro e conta.', depois: 'Violação de unicidade responde 409.' },
    { defeito: 'Funcionário com o mesmo CPF aceito 10 vezes', antes: 'A unicidade existia só no handler.', depois: 'Comandos de funcionário na fila e índice único filtrado (EmpresaId, Cpf).' },
    { defeito: 'Aluguel para cliente excluído', antes: 'Excluir o cliente e criar um aluguel dele ao mesmo tempo podia deixar aluguel órfão.', depois: 'Exclusões de cliente, condutor, carro e taxa entram na fila.' },
    { defeito: 'Reserva dupla entre instâncias', antes: 'Com duas instâncias no mesmo banco, o mesmo carro foi reservado duas vezes em 12 de 12 rodadas.', depois: 'Trava de banco por empresa (sp_getapplock) depois do semáforo local.' },
    { defeito: 'Cadastro de funcionário que falha na gravação virava 500', antes: 'Ao desfazer o usuário criado, a linha pendente era regravada.', depois: 'O rastreamento do EF é limpo antes da compensação.' },
    { defeito: 'Unicidade no banco inteiro', antes: 'CPF e CNPJ de cliente eram únicos entre todas as empresas, o que revelava cadastros de outras empresas.', depois: 'Únicos por empresa; a segunda empresa nunca recebe 409 por dado da primeira.' }
  ];
  protected readonly colunasDefeitos: ColunaTabela[] = [
    { id: 'defeito', titulo: 'Defeito', larguraMin: '14rem' },
    { id: 'antes', titulo: 'Como aparecia', larguraMin: '18rem' },
    { id: 'depois', titulo: 'Como ficou', larguraMin: '16rem' }
  ];

  protected readonly decisoes = [
    { titulo: 'Fila e trava em vez de rowversion', texto: 'A trava de banco e os índices únicos cobrem os casos reais e foram provados pela bateria. O controle de versão da linha não protege inserções concorrentes, então não foi adotado.' },
    { titulo: 'Anti-replay do código 2FA em memória', texto: 'Entre instâncias, um código do autenticador já usado ainda vale uma vez em cada uma, e o limitador de login por conta também é por processo. Fechar isso exige um cache compartilhado.' },
    { titulo: 'Uma empresa, várias sessões', texto: 'Uma conta pode ter sessões simultâneas, mas sair, trocar a senha ou reusar um refresh token encerra todas elas: nenhuma sessão fica viva sem o dono.' }
  ];
}
