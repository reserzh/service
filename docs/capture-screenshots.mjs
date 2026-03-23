import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

const BASE_URL = 'http://localhost:3200';
const PORTAL_URL = 'http://localhost:3201';

const VIEWPORT = { width: 1440, height: 900 };

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  // --- Login to admin dashboard ---
  console.log('Logging in...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // Screenshot list - route, filename, optional extra wait
  const adminPages = [
    { route: '/dashboard', name: '01-dashboard', wait: 2000 },
    { route: '/jobs', name: '02-jobs', wait: 1500 },
    { route: '/dispatch', name: '03-dispatch', wait: 1500 },
    { route: '/schedule', name: '04-schedule', wait: 1500 },
    { route: '/customers', name: '05-customers', wait: 1500 },
    { route: '/estimates', name: '06-estimates', wait: 1500 },
    { route: '/invoices', name: '07-invoices', wait: 1500 },
    { route: '/agreements', name: '08-agreements', wait: 1500 },
    { route: '/reports', name: '09-reports', wait: 1500 },
    { route: '/settings', name: '10-settings', wait: 1500 },
    { route: '/settings/pricebook', name: '11-pricebook', wait: 1500 },
    { route: '/website', name: '12-website', wait: 1500 },
  ];

  for (const { route, name, wait } of adminPages) {
    try {
      console.log(`Capturing ${name} (${route})...`);
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      if (wait) await page.waitForTimeout(wait);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: false });
      console.log(`  ✓ ${name}.png`);
    } catch (e) {
      console.log(`  ✗ Failed: ${e.message}`);
    }
  }

  // Try to capture a job detail page
  try {
    console.log('Capturing job detail...');
    await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    const firstJobLink = await page.$('table tbody tr a, [data-testid] a, a[href*="/jobs/"]');
    if (firstJobLink) {
      await firstJobLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-job-detail.png'), fullPage: false });
      console.log('  ✓ 13-job-detail.png');
    } else {
      console.log('  ✗ No job link found');
    }
  } catch (e) {
    console.log(`  ✗ Job detail failed: ${e.message}`);
  }

  // Try to capture an estimate detail page
  try {
    console.log('Capturing estimate detail...');
    await page.goto(`${BASE_URL}/estimates`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    const firstEstLink = await page.$('a[href*="/estimates/"]');
    if (firstEstLink) {
      await firstEstLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-estimate-detail.png'), fullPage: false });
      console.log('  ✓ 14-estimate-detail.png');
    } else {
      console.log('  ✗ No estimate link found');
    }
  } catch (e) {
    console.log(`  ✗ Estimate detail failed: ${e.message}`);
  }

  // Try to capture an invoice detail page
  try {
    console.log('Capturing invoice detail...');
    await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    const firstInvLink = await page.$('a[href*="/invoices/"]');
    if (firstInvLink) {
      await firstInvLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15-invoice-detail.png'), fullPage: false });
      console.log('  ✓ 15-invoice-detail.png');
    } else {
      console.log('  ✗ No invoice link found');
    }
  } catch (e) {
    console.log(`  ✗ Invoice detail failed: ${e.message}`);
  }

  // Revenue report
  try {
    console.log('Capturing revenue report...');
    await page.goto(`${BASE_URL}/reports/revenue`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16-revenue-report.png'), fullPage: false });
    console.log('  ✓ 16-revenue-report.png');
  } catch (e) {
    console.log(`  ✗ Revenue report failed: ${e.message}`);
  }

  // Team settings
  try {
    console.log('Capturing team settings...');
    await page.goto(`${BASE_URL}/settings/team`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '17-team.png'), fullPage: false });
    console.log('  ✓ 17-team.png');
  } catch (e) {
    console.log(`  ✗ Team settings failed: ${e.message}`);
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to docs/screenshots/');
}

captureScreenshots().catch(console.error);
