import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const executablePath = process.env.CHROME_EXECUTABLE_PATH;

export default defineConfig({
  ...base,
  retries: 0,
  projects: [
    {
      name: 'google-chrome',
      use: {
        channel: executablePath ? undefined : 'chrome',
        launchOptions: {
          executablePath,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader'],
        },
      },
    },
  ],
});
