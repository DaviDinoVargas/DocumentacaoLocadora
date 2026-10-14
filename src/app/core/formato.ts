/** Formatação pt-BR dos números exibidos nas páginas (milhar com ponto, vírgula decimal). */
export const inteiro = (n: number): string => n.toLocaleString('pt-BR');

export const decimal = (n: number, casas = 1): string =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export const percentual = (fracao: number, casas = 1): string => `${decimal(fracao * 100, casas)} %`;

/** "1,2 mil" para valores grandes em rótulos de gráfico. */
export const compacto = (n: number): string =>
  n >= 1000 ? `${decimal(n / 1000, 1)} mil` : inteiro(n);
