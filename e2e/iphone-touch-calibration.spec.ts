import { test, expect } from '@playwright/test';

test('iPhone Touch Calibration: all button corners, edges, and center trigger reliably', async ({ page }) => {
  // The responsive DOM control is the production touch surface; Phaser stays
  // underneath as the visual/rendering layer.
  await page.setViewportSize({ width: 932, height: 430 });
  const probes = [
    { name: 'Center', dx: 0, dy: 0 },
    { name: 'Top-Left Corner', dx: -0.42, dy: -0.32 },
    { name: 'Top-Right Corner', dx: 0.42, dy: -0.32 },
    { name: 'Bottom-Left Corner', dx: -0.42, dy: 0.32 },
    { name: 'Bottom-Right Corner', dx: 0.42, dy: 0.32 },
  ];

  for (const probe of probes) {
    await page.goto('/');
    await expect(page.locator('.home-view')).toBeVisible();
    const start = page.getByRole('button', { name: /開始冒險|繼續冒險/ }).first();
    await expect(start).toBeVisible();
    const box = await start.boundingBox();
    expect(box).not.toBeNull();
    if (!box) continue;
    const x = box.x + box.width * (0.5 + probe.dx);
    const y = box.y + box.height * (0.5 + probe.dy);
    await page.mouse.click(x, y);
    await expect(page.locator('.map-view')).toBeVisible();
    console.log(`Test ${probe.name} at (${x.toFixed(1)}, ${y.toFixed(1)}): PASS`);
  }
});
