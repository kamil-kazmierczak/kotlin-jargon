import fs from 'node:fs';
import { chromium } from 'playwright';
import { preview } from 'vite';

export async function withCurriculumPreview(port, run) {
  const server = await preview({
    mode: 'curriculum-preview',
    preview: { host: '127.0.0.1', port, strictPort: true, open: false }
  });
  let browser;
  try {
    const launchOptions = { headless: true };
    if (fs.existsSync('/usr/bin/chromium')) launchOptions.executablePath = '/usr/bin/chromium';
    browser = await chromium.launch(launchOptions);
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await run({ page, errors, baseUrl: `http://127.0.0.1:${port}/` });
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.httpServer.close(resolve));
  }
}
