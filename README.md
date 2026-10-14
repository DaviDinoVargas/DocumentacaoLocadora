# DocumentacaoLocadora

Documentação técnica do software do TCC **Locadora de Veículos** (Academia do Programador), publicada no GitHub Pages:

**https://davidinovargas.github.io/DocumentacaoLocadora/**

São 16 páginas — arquitetura, domínio, back-end .NET, referência da API, front-end, design system, serviço de ML, segurança, bateria de ataques, testes, métricas, dependências, configuração, observações e encerramento —, cada uma com gráficos e tabelas feitos **só com números extraídos do código-fonte e do material do TCC**. Um cubo mágico em 3D, fixo no canto direito, monta uma peça a cada página lida e se resolve na última.

## Stack

| Camada | Escolha |
|---|---|
| Framework | Angular 21, componentes standalone, signals, `OnPush` |
| Estilo | Tailwind CSS v4 com tokens Material 3 (`--md-*`) mapeados para as variáveis do shadcn/Spartan |
| Componentes | Spartan UI (`@spartan-ng/brain` + código "helm" copiado de `src/app/shared/ui`) |
| Material 3 | `@angular/material`: tema (`--mat-sys-*` ligados aos mesmos tokens) e componentes interativos (abas, acordeão, alternadores, dica) |
| Gráficos | ECharts (`echarts` + `ngx-echarts`), módulos individuais, cores lidas dos tokens |
| Cubo | Three.js empacotado pelo npm (sem CDN), carregado sob demanda |
| Ícones e fonte | Lucide (`@ng-icons/lucide`) e Inter variável servida de `public/fonts` |
| Testes | Vitest (via `ng test`) |

O visual — paleta, tipografia, espaçamentos, raios, elevação tonal, movimento, tema claro/escuro e padrões de componente (barra lateral, KPIs, selos de status, tabela com busca/filtros/ordenação/CSV, gráfico com "Ver como tabela") — reproduz o do software documentado, a partir do `SKILL.md` e do `styles.css` dele.

## Como rodar

Requisitos: Node.js 20.19+, 22.12+ ou 24+.

```bash
npm ci                # instala as dependências
npm start             # http://localhost:4200
npm test              # testes (máquina de estados do cubo, física, giros de camada, registro de páginas)
npm run build         # build de produção em dist/documentacao-locadora/browser
```

### Regenerar os dados

Os números das páginas ficam em `src/app/dados/*.json`, gerados por `tools/extrair-dados.mjs` a partir do repositório do software e do material do TCC. Os JSON gerados **estão versionados**, então o build não depende dessas pastas; para atualizá-los:

```bash
# padrões: A:/TCC/LocadoraDeVeiculos (código) e A:/TCC (material complementar)
LOCADORA_FONTE=/caminho/LocadoraDeVeiculos LOCADORA_TCC=/caminho/TCC npm run dados
```

O script conta linhas por camada e módulo, lê os endpoints dos controllers (.NET) e dos roteadores (FastAPI), as rotas do Angular, as entidades e migrations, as dependências (npm, NuGet, pip), as variáveis de ambiente, os tokens de design do `styles.css`, os resultados da última rodada de ataques e as medições do LFW. Os 35 achados de segurança (`src/app/dados/seguranca-itens.ts`) e a cobertura (`cobertura.ts`) são curados à mão a partir do relatório de segurança e do histórico do projeto, com a fonte indicada no próprio arquivo.

## Build e deploy no GitHub Pages

O site é publicado em `https://<usuario>.github.io/DocumentacaoLocadora/`, um subcaminho, então o build precisa do `--base-href` e de um `404.html` igual ao `index.html` (assim as rotas da SPA abrem mesmo quando o endereço é digitado direto).

```bash
# build para o Pages (base /DocumentacaoLocadora/) + 404.html + .nojekyll
npm run build:pages

# equivalente manual:
ng build --base-href /DocumentacaoLocadora/
node tools/pos-build.mjs      # copia index.html para 404.html e cria .nojekyll

# conferir localmente como o Pages serve (subcaminho e 404.html com status 404)
npm run serve:pages           # http://localhost:4400/DocumentacaoLocadora/
```

> No Git Bash do Windows, `/DocumentacaoLocadora/` é reescrito como caminho do Windows; rode com `MSYS_NO_PATHCONV=1 npm run build:pages` ou use PowerShell/CMD.

### Publicação automática

`.github/workflows/deploy.yml` roda a cada push na `main`: instala (`npm ci`), testa, constrói com `--base-href`, gera o `404.html` e publica com `actions/upload-pages-artifact` + `actions/deploy-pages`. **Uma vez só**, no repositório: *Settings → Pages → Build and deployment → Source: GitHub Actions*.

Assets (fontes, ícone) ficam em `public/` com caminhos relativos ao `<base href>`; não há Git LFS nem CDN.

## O cubo mágico

Com N páginas o cubo tem **P = N − 2 peças** (hoje N = 16, P = 14); a penúltima página fecha o cubo e a última o resolve. Peças montadas = índice da página − 1, limitado a P.

| Navegação | O que acontece |
|---|---|
| Página 1 | Nenhuma peça no cubo; todas caídas na base |
| Avançar | Uma peça volta ao cubo, com arco e encaixe |
| Pular de a para b | Voltam \|b − a\| peças em sequência, com pequeno atraso entre elas |
| Voltar | Saem tantas peças quanto as páginas de diferença, e caem (a última a entrar é a primeira a sair) |
| Voltar à principal | Todas saem e caem |
| Penúltima | Todas montadas, com o cubo girando enquanto monta |
| Última | O cubo gira as camadas e as cores de cada face se alinham |
| Última → primeira | Explosão: as peças são lançadas e caem na base |

Como é feito (`src/app/cubo/`):

- `plano-cubo.ts`: máquina de estados pura; guarda quantas peças estão montadas, calcula o delta de cada navegação e entrega **lotes de ações** a uma **fila de animações** (cliques rápidos nunca sobrepõem animações e, se a fila cresce, ela acelera). Testada com um executor falso.
- `movimentos.ts`: giros de camada com aritmética inteira; o embaralhamento é uma sequência fixa e reversível, e "resolver" é aplicar a inversa.
- `fisica.ts`: gravidade, quique leve e atrito; a velocidade de lançamento é calculada para a peça assentar no lugar reservado da base.
- `cena-cubo.ts`: cena Three.js (26 peças agrupadas em P peças lógicas), laço de renderização pausado quando a aba está oculta ou o cubo fora da tela, e liberação de geometrias, materiais, observadores e do contexto WebGL em `destruir()`.
- As cores das faces são lidas dos tokens do tema (`--md-primary`, `--success`, `--warning`, `--md-error`…) e relidas quando o tema muda.
- `prefers-reduced-motion`: sem animações, o estado final aparece de uma vez. Abaixo de 768 px o cubo não é criado (ficam só as setas); entre 768 px e 1280 px ele é menor.
- Alt + ← / → também navegam entre páginas.

## Estrutura

```
src/app/
  core/            registro de páginas, navegação, tema, ícones, formatação
  cubo/            máquina de estados, física, giros, cena Three.js e o componente do cubo
  dados/           JSON extraídos do código + achados de segurança e cobertura curados
  paginas/         as 16 páginas (carregadas sob demanda)
  shared/          layout (barra lateral, KPIs, notas), gráfico, tabela de dados, helm do Spartan
tools/             extrair-dados, pos-build (404.html) e servir-pages
public/            favicon e fontes
```

## O que foi documentado e suposições

Resumo, suposições e a lista de divergências entre o material do TCC e o código estão nas páginas **Encerramento** e **Observações**. Em poucas linhas:

- O software foi apenas lido (estado de 13/out/2026); nada foi alterado nele.
- O código vence o texto do TCC; conflitos (segurança, reconhecimento facial, nginx, migrations, testes, validação de CPF/CNPJ…) estão registrados em *Observações*.
- Docker, nginx e CI do software ficam fora de escopo, como decidido pelo autor.
- Latência, pacote do front-end e cobertura vêm das medições registradas no material, não foram refeitas.
- As imagens de pré-visualização do PDF e dos slides não foram reaproveitadas; os diagramas foram redesenhados com os tokens do tema.

## Licença

MIT — ver [LICENSE](LICENSE).
