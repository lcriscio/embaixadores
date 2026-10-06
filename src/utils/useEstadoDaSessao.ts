import { useEffect, useState } from 'react';

/**
 * useState que sobrevive ao recarregar a página: guarda o valor no sessionStorage (por aba).
 * `valido` descarta valores salvos que não servem mais (ex.: uma aba que deixou de existir).
 */
export function useEstadoDaSessao<T>(chave: string, inicial: T, valido: (valor: unknown) => boolean) {
  const [estado, setEstado] = useState<T>(() => {
    try {
      const salvo = sessionStorage.getItem(chave);
      if (salvo !== null) {
        const valor = JSON.parse(salvo);
        if (valido(valor)) return valor as T;
      }
    } catch {
      // sessionStorage indisponível ou valor corrompido: usa o inicial
    }
    return inicial;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(chave, JSON.stringify(estado));
    } catch {
      // sem sessionStorage, o estado só não é lembrado
    }
  }, [chave, estado]);

  return [estado, setEstado] as const;
}
