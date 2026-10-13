/** 10 -> "10%", 7.5 -> "7,5%" */
export function formatPercentual(valor: number): string {
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}
