/** Link de indicação do embaixador: landing page pública em queroconhecer.cancandles.com.br */
export const LINK_INDICACAO_BASE = 'https://queroconhecer.cancandles.com.br';

export function linkIndicacao(afiliadoId: string): string {
  return `${LINK_INDICACAO_BASE}/${afiliadoId}`;
}
