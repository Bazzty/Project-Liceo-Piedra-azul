import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom no reproduce audio: play() devuelve undefined en vez de una promesa. Casi todas las
// pantallas hablan, así que se simula una vez aquí (los tests que miran el audio usan su propio falso).
vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});

// Cada test parte con el documento vacío.
afterEach(() => cleanup());
