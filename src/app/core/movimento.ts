/** `prefers-reduced-motion: reduce` (consulta a cada chamada: o usuário pode mudar com a página aberta). */
export function movimentoReduzido(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
