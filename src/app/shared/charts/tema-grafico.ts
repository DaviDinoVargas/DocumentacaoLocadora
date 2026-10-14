/** Cores e tipografia dos gráficos, lidas dos tokens CSS (nenhum hex dentro da configuração do gráfico). */
export interface TemaGrafico {
  series: string[];
  texto: string;
  textoSecundario: string;
  grade: string;
  fundoDica: string;
  textoDica: string;
  sucesso: string;
  aviso: string;
  erro: string;
  fonte: string;
}

function token(nome: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

/** Lê as cores atuais (claro ou escuro). Chamar de novo quando o tema mudar. */
export function lerTemaGrafico(): TemaGrafico {
  return {
    series: ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'].map(token),
    texto: token('--foreground'),
    textoSecundario: token('--muted-foreground'),
    grade: token('--border'),
    fundoDica: token('--popover'),
    textoDica: token('--popover-foreground'),
    sucesso: token('--success'),
    aviso: token('--warning'),
    erro: token('--md-error'),
    fonte: getComputedStyle(document.body).fontFamily
  };
}

/** Eixos, grade e dica no padrão do tema; as páginas só acrescentam séries. */
export function baseDoGrafico(t: TemaGrafico) {
  return {
    textStyle: { fontFamily: t.fonte, color: t.textoSecundario },
    color: t.series,
    tooltip: {
      backgroundColor: t.fundoDica,
      borderColor: t.grade,
      textStyle: { color: t.textoDica, fontFamily: t.fonte, fontSize: 12 },
      confine: true
    },
    legend: { textStyle: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 12 }, itemGap: 16, icon: 'roundRect' },
    aria: { enabled: true }
  };
}

export function eixoCategoria(t: TemaGrafico, dados?: (string | number)[], extra: Record<string, unknown> = {}) {
  return {
    type: 'category' as const,
    data: dados,
    axisLine: { lineStyle: { color: t.grade } },
    axisTick: { show: false },
    axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 12 },
    ...extra
  };
}

export function eixoValor(t: TemaGrafico, extra: Record<string, unknown> = {}) {
  return {
    type: 'value' as const,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: t.textoSecundario, fontFamily: t.fonte, fontSize: 12 },
    splitLine: { lineStyle: { color: t.grade, type: 'dashed' as const } },
    ...extra
  };
}
