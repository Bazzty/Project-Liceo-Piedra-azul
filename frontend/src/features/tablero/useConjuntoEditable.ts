import { useLiveQuery } from 'dexie-react-hooks';
import { cargarConjunto, type ConjuntoEditable, type Destino } from '@/features/tablero/gestionTableros';

const clave = (d: Destino) => (d.tipo === 'plantilla' ? `plantilla:${d.id}` : `alumno:${d.alumnoId}`);

/** Lo que se está editando, siempre al día: cada cambio guardado vuelve a dibujar la pantalla. */
export const useConjuntoEditable = (destino: Destino): ConjuntoEditable | undefined =>
  useLiveQuery(() => cargarConjunto(destino), [clave(destino)]);
