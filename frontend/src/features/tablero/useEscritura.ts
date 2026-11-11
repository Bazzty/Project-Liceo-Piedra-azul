import { useState } from 'react';
import { MAXIMO_DE_CARACTERES, vozDePalabra, vozDeTecla } from '@/features/tablero/teclado';
import { decirSecuencia } from '@/shared/audio/decirSecuencia';
import type { PalabraDeFrase } from '@/shared/store/useTableroStore';

let contador = 0;

/** Una palabra escrita con el teclado: va en la frase como texto, sin dibujo. */
const palabraEscrita = (texto: string): PalabraDeFrase => ({
  id: `texto-${(contador += 1)}`,
  palabra: texto,
  categoria: 'texto',
  imagenUrl: '',
  esFotoReal: false,
  esTexto: true,
});

interface Opciones {
  frase: PalabraDeFrase[];
  setFrase: (frase: PalabraDeFrase[] | ((anterior: PalabraDeFrase[]) => PalabraDeFrase[])) => void;
  maximo: number;
  /** Corta lo que el osito estuviera diciendo: el niño tocó otra cosa. */
  cortar: () => void;
}

/**
 * Lo que el niño escribe con el teclado. Cada letra suena al tocarla; con el espacio la palabra pasa a la frase
 * (mezclada con los dibujos) y suena entera. Lo que escribe no se guarda: solo vive en la pantalla.
 */
export function useEscritura({ frase, setFrase, maximo, cortar }: Opciones) {
  const [escribiendo, setEscribiendo] = useState('');

  const decir = (elemento: ReturnType<typeof vozDeTecla>) => {
    cortar();
    void decirSecuencia([elemento]);
  };

  const escribir = (tecla: string) => {
    if (escribiendo.length >= MAXIMO_DE_CARACTERES) return;
    setEscribiendo((e) => e + tecla);
    decir(vozDeTecla(tecla));
  };

  /** Pasa la palabra que se estaba escribiendo a la frase y devuelve la frase resultante. */
  const cerrarPalabra = (): PalabraDeFrase[] => {
    if (!escribiendo) return frase;
    const nueva = frase.length < maximo ? [...frase, palabraEscrita(escribiendo)] : frase;
    setFrase(nueva);
    setEscribiendo('');
    return nueva;
  };

  const espacio = () => {
    if (!escribiendo) return;
    const palabra = escribiendo;
    cerrarPalabra();
    decir(vozDePalabra(palabra));
  };

  /** Borra la última letra; si no hay letras, la última palabra de la frase. */
  const borrar = () => {
    cortar();
    if (escribiendo) setEscribiendo((e) => e.slice(0, -1));
    else setFrase((f) => f.slice(0, -1));
  };

  return { escribiendo, escribir, espacio, borrar, cerrarPalabra, limpiar: () => setEscribiendo('') };
}
