import { chromium } from '@playwright/test';
import fs from 'fs';

async function run() {
  console.log('Starting browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 } // iPad landscape size
  });
  const page = await context.newPage();
  
  const baseUrl = 'http://localhost:5173';
  const outDir = './screenshots';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }

  const routes = [
    { url: '/', name: 'gateway' },
    { url: '/#/phonics/map', name: 'phonics-map' },
    { url: '/#/phonics/challenge', name: 'phonics-challenge' },
    { url: '/#/math/map', name: 'math-map' },
  ];

  for (const route of routes) {
    console.log(`Navigating to ${route.url}...`);
    await page.goto(`${baseUrl}${route.url}`, { waitUntil: 'networkidle' });
    
    // Wait for animations
    await page.waitForTimeout(1000);
    
    const path = `${outDir}/${route.name}.png`;
    await page.screenshot({ path });
    console.log(`Saved ${path}`);
  }

  await browser.close();
  console.log('Done.');
}

run().catch(console.error);
