import { ChangeDetectionStrategy, Component } from '@angular/core';
import { COBERTURA_ML, META_COBERTURA } from '../dados/cobertura';
import { ITENS_SEGURANCA } from '../dados/seguranca-itens';
import metricas from '../dados/metricas.json';
import seguranca from '../dados/seguranca.json';
import { percentual } from '../core/formato';
import { KpiCardComponent } from '../shared/layout/kpi-card.component';
import { PaginaCabecalhoComponent } from '../shared/layout/pagina-cabecalho.component';
import { SecaoComponent } from '../shared/layout/secao.component';
import { TabelaDadosComponent, type ColunaTabela, type Linha } from '../shared/tabela/tabela-dados.component';

const lfw = seguranca.lfw!;
const zap = seguranca.zap!;
const cob = metricas.cobertura!;
const mut = metricas.mutacao!;
const ignorados = ITENS_SEGURANCA.filter((i) => i.estado === 'Ignorado').length;
const parciais = ITENS_SEGURANCA.filter((i) => i.estado === 'Parcial').length;
const cobertasTotal = cob.dotnet!.cobertas + cob.angular!.cobertas + COBERTURA_ML.cobertas;
const linhasTotal = cob.dotnet!.linhas + cob.angular!.linhas + COBERTURA_ML.linhas;

@Component({
  selector: 'app-decisoes',
  imports: [KpiCardComponent, PaginaCabecalhoComponent, SecaoComponent, TabelaDadosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-pagina-cabecalho />

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <app-kpi-card rotulo="Decisões registradas" [valor]="decisoes.length" apoio="com motivo e consequência" icone="lucideScale" />
      <app-kpi-card rotulo="Limites conhecidos" [valor]="limites.length" apoio="o que ainda não está coberto" icone="lucideTriangleAlert" />
      <app-kpi-card rotulo="Achados parciais" [valor]="parciais" [apoio]="ignorados + ' ignorado por decisão'" icone="lucideShield" />
      <app-kpi-card rotulo="Cobertura de linhas" [valor]="percentual(cobertasTotal / linhasTotal)" [apoio]="'meta de ' + meta + ' % em cada camada'" icone="lucideTarget" />
    </div>

    <app-secao titulo="Decisões de projeto" descricao="Cada escolha com o motivo e o que ela custa. Filtre pela área." id="decisoes">
      <app-tabela-dados [colunas]="colunasDecisoes" [linhas]="decisoes" legenda="decisões de projeto" arquivo="decisoes" [tamanhoInicial]="20" />
    </app-secao>

    <app-secao titulo="Limites conhecidos" descricao="O que o sistema e as medições ainda não cobrem, para quem for evoluí-lo." id="limites">
      <app-tabela-dados [colunas]="colunasLimites" [linhas]="limites" legenda="limites conhecidos" arquivo="limites-conhecidos" [tamanhoInicial]="15" />
    </app-secao>

    <app-secao titulo="Observações sobre o código" descricao="Inconsistências pequenas encontradas na leitura do repositório; nenhuma afeta o funcionamento." id="codigo">
      <app-tabela-dados [colunas]="colunasCodigo" [linhas]="codigo" legenda="observações sobre o código" arquivo="observacoes-sobre-o-codigo" [tamanhoInicial]="10" />
    </app-secao>
  `
})
export class DecisoesPage {
  protected readonly parciais = parciais;
  protected readonly ignorados = ignorados;
  protected readonly meta = META_COBERTURA;
  protected readonly cobertasTotal = cobertasTotal;
  protected readonly linhasTotal = linhasTotal;
  protected readonly percentual = percentual;

  protected readonly decisoes: Linha[] = [
    { area: 'Dados', decisao: 'Cada empresa enxerga só os próprios dados, e o filtro vive no servidor.', motivo: 'Impedir que um erro de tela exponha dados de outra empresa.', consequencia: 'Toda consulta passa pelo filtro; a bateria de ataques tenta ler dados de outra empresa.' },
    { area: 'Dados', decisao: 'CPF e CNPJ de cliente são únicos por empresa, não no banco inteiro.', motivo: 'Duas locadoras podem atender a mesma pessoa sem se enxergar.', consequencia: 'O índice único é por empresa, e a violação vira resposta 409, não erro 500.' },
    { area: 'Concorrência', decisao: 'Comandos de aluguel e devolução entram numa fila por empresa, com trava no banco e índices únicos como última barreira.', motivo: 'Dez pedidos para o mesmo carro e período devem criar no máximo um aluguel, mesmo com mais de uma instância da API.', consequencia: 'Empresas diferentes não esperam umas pelas outras; a prova está na página Concorrência.' },
    { area: 'Concorrência', decisao: 'Fila, trava e índices únicos no lugar de controle de versão da linha.', motivo: 'O controle de versão não protege inserções concorrentes.', consequencia: 'Os casos reais foram cobertos e provados pela bateria.' },
    { area: 'Segurança', decisao: 'Reconhecimento facial por embedding de 128 números, com limiar de similaridade 0,363.', motivo: `No protocolo LFW esse limiar dá FAR de ${percentual(lfw.limiares[3].FAR, 3)} e FRR de ${percentual(lfw.limiares[3].FRR, 1)}: recusar quem é da conta custa menos do que aceitar quem não é.`, consequencia: 'Uma pessoa certa pode ser recusada e precisar tentar de novo.' },
    { area: 'Segurança', decisao: 'Amostras faciais cifradas no banco, com consentimento versionado e retenção de 12 meses sem uso.', motivo: 'Dado biométrico não pode ficar em arquivo solto nem sem aceite.', consequencia: 'O serviço de ML não guarda nada; encerrar a conta apaga as amostras.' },
    { area: 'Segurança', decisao: 'O servidor confere o dígito verificador de CPF e CNPJ.', motivo: 'Uma validação só no navegador se contorna com uma chamada direta à API.', consequencia: 'A tela e o servidor repetem a regra, e a bateria tenta cadastrar CPF inválido.' },
    { area: 'Segurança', decisao: 'Limite de uso global por usuário ou IP, mais limites próprios no login, no cadastro e no serviço de ML.', motivo: 'Frear força bruta e abuso sem atrapalhar o uso normal.', consequencia: 'Em IPv6 o limite vale por bloco /64.' },
    { area: 'Segurança', decisao: 'Fora de desenvolvimento, a API e o ML recusam o segredo padrão e exigem um próprio, de 32 caracteres ou mais.', motivo: 'Um segredo público de exemplo não pode chegar à produção.', consequencia: 'Em desenvolvimento o padrão continua aceito de propósito (S2 corrigido).' },
    { area: 'Segurança', decisao: `O OWASP ZAP roda ativo e autenticado; ${zap.aprovadas} de ${zap.aprovadas + zap.reprovadas} verificações passam.`, motivo: 'Complementar a bateria própria com uma ferramenta que não conhece o sistema.', consequencia: 'Dois alertas de gravidade alta foram investigados e provados falsos positivos, e cada prova virou verificação da bateria.' },
    { area: 'Segurança', decisao: 'A exposição do banco e do ML em desenvolvimento (S7) é ignorada.', motivo: 'A camada de entrega não está no escopo desta etapa.', consequencia: 'Em produção o banco não deve ser acessível de fora e a API deve usar um usuário de menor privilégio.' },
    { area: 'Qualidade', decisao: `A meta de cobertura de linhas é ${META_COBERTURA} %, medida por camada.`, motivo: 'Uma meta só do total esconde a camada mais fraca.', consequencia: `Medido: .NET ${percentual(cob.dotnet!.pct / 100, 1)}, Angular ${percentual(cob.angular!.pct / 100, 1)} e ML ${percentual(COBERTURA_ML.pct / 100, 1)}.` },
    { area: 'Qualidade', decisao: 'Testes por reflexão varrem os endpoints e os comandos de aluguel e devolução.', motivo: 'Um endpoint novo sem autorização ou sem limite deve falhar no teste sem ninguém lembrar de escrevê-lo.', consequencia: 'A página Reflexão em C# lista o que é conferido.' },
    { area: 'Qualidade', decisao: 'As medidas de desempenho são locais e servem como linha de base.', motivo: 'Sem rede real, com poucos dados e sem câmera de produção, o número absoluto não se transfere.', consequencia: 'O que não foi medido aparece como "não medido" ou "coleta pendente".' },
    { area: 'Interface', decisao: 'O Angular Material 3 entra como tema e em componentes interativos; estrutura e botões são Spartan.', motivo: 'Manter uma só linguagem visual sem duplicar componentes.', consequencia: 'Os tokens --mat-sys-* são ligados aos tokens do sistema, então trocar o tema muda os dois.' },
    { area: 'Entrega', decisao: 'Docker, nginx e integração contínua ficam fora do escopo desta etapa.', motivo: 'O foco foi o comportamento do sistema e a verificação dele.', consequencia: 'O reforço da camada de entrega (S8) segue parcial até esse trabalho entrar.' }
  ];

  protected readonly colunasDecisoes: ColunaTabela[] = [
    { id: 'area', titulo: 'Área', filtravel: true },
    { id: 'decisao', titulo: 'Decisão', larguraMin: '18rem' },
    { id: 'motivo', titulo: 'Motivo', larguraMin: '16rem', secundaria: true },
    { id: 'consequencia', titulo: 'Consequência', larguraMin: '16rem', secundaria: true }
  ];

  protected readonly limites: Linha[] = [
    { onde: 'Reconhecimento facial (S3)', limite: 'A prova de vida e o limiar foram verificados em teste e no protocolo LFW, não com a câmera real em condições de uso.', peso: 'Média' },
    { onde: 'Leitura de placa', limite: 'Só o custo do OCR foi medido, em placas sintéticas; o acerto e o tempo de ponta a ponta dependem da câmera real.', peso: 'Média' },
    { onde: 'Usabilidade', limite: 'Questionário SUS, tarefas cronometradas com pessoas e avaliação heurística independente seguem sem coleta.', peso: 'Média' },
    { onde: 'Cadastro (S6)', limite: 'O reforço da verificação no cadastro depende de e-mail transacional configurado.', peso: 'Média' },
    { onde: 'Cabeçalhos e TLS (S8)', limite: 'A API envia os cabeçalhos de segurança; o reforço na camada de entrega do front-end faz parte da implantação.', peso: 'Média' },
    { onde: 'Código 2FA e login com várias instâncias', limite: 'O anti-replay do código do autenticador e o limitador de login por conta são por processo: com duas instâncias da API, um código já usado vale uma vez em cada. Fechar isso exige um cache compartilhado.', peso: 'Média' },
    { onde: 'Mutação', limite: `O escore é ${mut.pct} %: ${mut.sobreviveram} mutantes sobreviveram e ${mut.semCobertura} não têm cobertura, concentrados nos handlers de edição e de listagem.`, peso: 'Baixa' },
    { onde: 'Web Vitals no celular', limite: 'O LCP do celular simulado fica acima da meta de 2,5 s, e o INP só pode ser medido em campo.', peso: 'Baixa' },
    { onde: 'Banco e ML em desenvolvimento (S7)', limite: 'A exposição na rede local foi ignorada por decisão; vale revisar antes de qualquer implantação.', peso: 'Informativa' }
  ];

  protected readonly colunasLimites: ColunaTabela[] = [
    { id: 'onde', titulo: 'Onde', larguraMin: '14rem' },
    { id: 'limite', titulo: 'O que ainda não está coberto', larguraMin: '26rem' },
    { id: 'peso', titulo: 'Peso', tipo: 'selo', filtravel: true, tom: (v) => (v === 'Média' ? 'warning' : v === 'Baixa' ? 'neutral' : 'info') }
  ];

  protected readonly codigo: Linha[] = [
    { onde: 'MachineLeaning/yolo_tesseract/config.py', ponto: 'A variável PORT (e HOST, com padrão 0.0.0.0) é lida mas não usada: o main.py sobe fixo na porta 8000 e a escuta vale a de shared/settings.py (127.0.0.1).' },
    { onde: 'Web API e Core.Aplicacao (.csproj)', ponto: 'Serilog, Serilog.Extensions.Logging e Serilog.Sinks.Console estão referenciados, mas nenhum código usa Serilog: o log é o padrão do ASP.NET.' },
    { onde: 'Tests.Integracao (.csproj)', ponto: 'Usa FluentValidation 12.0.0 e FluentResults 4.0.0, enquanto a produção usa 11.11.0 e 3.16.0.' },
    { onde: 'README.md da raiz', ponto: 'Tem uma linha só; o guia de instalação e execução está no README do Client.' }
  ];

  protected readonly colunasCodigo: ColunaTabela[] = [
    { id: 'onde', titulo: 'Onde', larguraMin: '14rem' },
    { id: 'ponto', titulo: 'O que se observa', larguraMin: '28rem' }
  ];
}
