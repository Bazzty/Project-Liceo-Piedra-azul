import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';

export const listarRegistros = () => db.registros.toArray();

export const useRegistros = () => useLiveQuery(() => listarRegistros(), []);
