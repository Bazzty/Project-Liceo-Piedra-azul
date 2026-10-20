export interface ThemeConfig {
  id: string;
  nombre: string;
  colorPreviewHex: string; // Para mostrar una burbuja de color en el selector
}

export const THEMES_CONFIG: ThemeConfig[] = [
  { id: 'calma-azul', nombre: 'Calma Azul', colorPreviewHex: '#0284c7' },
  { id: 'alto-contraste', nombre: 'Alto Contraste', colorPreviewHex: '#ffff00' },
  { id: 'verde-bosque', nombre: 'Verde Bosque', colorPreviewHex: '#16a34a' },

  // Agregar temas a futuro
];