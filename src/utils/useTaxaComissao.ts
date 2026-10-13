import { useEffect, useState } from 'react';
import { buscarTaxaComissaoVigente, taxaComissaoLembrada, TAXA_COMISSAO_RESERVA } from '../services/comissaoService';

/**
 * Percentual de comissão do embaixador em vigor (ex.: 10 para 10%), vindo do CRM.
 * Fica null enquanto o CRM não responde, para a tela não mostrar um percentual antigo. Se o CRM
 * falhar, usa o último valor recebido neste navegador.
 */
export function useTaxaComissao(): number | null {
  const [taxa, setTaxa] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;
    buscarTaxaComissaoVigente()
      .then((vigente) => {
        if (ativo) setTaxa(vigente);
      })
      .catch((e) => {
        console.error('Erro ao buscar o percentual de comissão:', e);
        if (ativo) setTaxa(taxaComissaoLembrada() ?? TAXA_COMISSAO_RESERVA);
      });
    return () => {
      ativo = false;
    };
  }, []);

  return taxa;
}
