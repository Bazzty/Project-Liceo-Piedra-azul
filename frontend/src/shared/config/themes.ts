export interface ThemeConfig {
  id: string;
  nombre: string;
  colorPreviewHex: string; // Para mostrar una burbuja de color en el selector
}

export const THEMES_CONFIG: ThemeConfig[] = [
  { id: 'suave', nombre: 'Suave', colorPreviewHex: '#2f6f8f' },
  { id: 'alto-contraste', nombre: 'Alto contraste', colorPreviewHex: '#ffff00' },
  { id: 'calida', nombre: 'Cálida', colorPreviewHex: '#a84b19' },
  { id: 'monocromatica', nombre: 'Monocromática', colorPreviewHex: '#333333' },
];