import { useState } from 'react';
import { MAXIMO_DE_CARACTERES, vozDePalabra, vozDeTecla } from '@/features/tablero/teclado';
import { decirSecuencia } from '@/shared/audio/decirSecuencia';
import { sonarLleno } from '@/shared/audio/sonidos';
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

  /** La frase está llena. */
  const llena = frase.length >= maximo;
  /** Con la frase llena y nada escrito no se puede empezar otra palabra: no cabría. */
  const bloqueada = llena && !escribiendo;

  const escribir = (tecla: string) => {
    if (bloqueada) return sonarLleno();
    if (escribiendo.length >= MAXIMO_DE_CARACTERES) return;
    setEscribiendo((e) => e + tecla);
    decir(vozDeTecla(tecla));
  };

  /**
   * Pasa la palabra que se estaba escribiendo a la frase y devuelve la frase resultante.
   * Con la frase llena la palabra NO se pierde: sigue en pantalla y, salvo que se pida lo contrario, suena un aviso sin texto.
   */
  const cerrarPalabra = ({ avisar = true }: { avisar?: boolean } = {}): PalabraDeFrase[] => {
    if (!escribiendo) return frase;
    if (llena) {
      if (avisar) sonarLleno();
      return frase;
    }
    const nueva = [...frase, palabraEscrita(escribiendo)];
    setFrase(nueva);
    setEscribiendo('');
    return nueva;
  };

  const espacio = () => {
    if (!escribiendo) return;
    const palabra = escribiendo;
    const antes = frase.length;
    if (cerrarPalabra().length === antes) return; // frase llena: ya sonó el aviso, la palabra sigue ahí
    decir(vozDePalabra(palabra));
  };

  /** Borra la última letra; si no hay letras, la última palabra de la frase. */
  const borrar = () => {
    cortar();
    if (escribiendo) setEscribiendo((e) => e.slice(0, -1));
    else setFrase((f) => f.slice(0, -1));
  };

  return { escribiendo, llena, bloqueada, escribir, espacio, borrar, cerrarPalabra, limpiar: () => setEscribiendo('') };
}
