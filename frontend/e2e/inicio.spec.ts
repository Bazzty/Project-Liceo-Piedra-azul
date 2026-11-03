import { expect, test } from '@playwright/test';

test('la portada carga sin errores', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (error) => errores.push(error.message));

  await page.goto('/');

  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errores).toEqual([]);
});
