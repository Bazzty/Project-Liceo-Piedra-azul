import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cada test parte con el documento vacío.
afterEach(() => cleanup());
