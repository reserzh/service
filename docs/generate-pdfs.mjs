import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pages = [
  { file: 'sales-pitch.html', pdf: 'FieldService-Pro-Overview.pdf' },
  { file: 'sales-portal-websites.html', pdf: 'FieldService-Pro-Portal-Websites.pdf' },
  { file: 'sales-mobile-app.html', pdf: 'FieldService-Pro-Mobile-App.pdf' },
  { file: 'internal-dev-guide.html', pdf: 'FieldService-Pro-Internal-Dev-Guide.pdf' },
];

async function generatePDFs() {
  const browser = await chromium.launch({ headless: true });

  for (const { file, pdf } of pages) {
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();

      const filePath = path.join(__dirname, file);
      console.log(`Converting ${file}...`);

      await page.goto(`file://${filePath}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);

      await page.pdf({
        path: path.join(__dirname, pdf),
        format: 'A4',
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      });

      console.log(`  ✓ ${pdf}`);
      await context.close();
    } catch (e) {
      console.log(`  ✗ ${file} failed: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\nDone! PDFs saved to docs/');
}

generatePDFs().catch(console.error);
