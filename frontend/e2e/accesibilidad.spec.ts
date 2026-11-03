import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Revisión automática WCAG 2.1 AA de las pantallas públicas. No reemplaza probar con teclado
// y lector de pantalla, pero atrapa contraste, nombres faltantes, roles inválidos, etc.
for (const ruta of ['/', '/profesor/login', '/muestra']) {
  test(`${ruta} cumple WCAG 2.1 AA`, async ({ page }) => {
    await page.goto(ruta);
    await page.locator('#root').waitFor();
    // Espera a que terminen las entradas con fundido: a mitad de camino el contraste se mide mal.
    // Las animaciones infinitas (el oso que respira) no cuentan.
    await page.waitForFunction(() =>
      document.getAnimations().every((a) => a.effect?.getTiming().iterations === Infinity || a.playState === 'finished'),
    );

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}
