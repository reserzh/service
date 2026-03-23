import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

const BACK_URL = 'http://localhost:3200';
const FRONT_URL = 'http://localhost:3201';

const VIEWPORT = { width: 1440, height: 900 };

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });

  // ═══════════════════════════════════════════════
  // PART 1: Customer Portal
  // We need to create a portal invite and accept it
  // First, let's capture the portal login page and public pages
  // ═══════════════════════════════════════════════

  // --- Portal Login Page ---
  const portalCtx = await browser.newContext({ viewport: VIEWPORT });
  const portalPage = await portalCtx.newPage();

  try {
    console.log('Capturing portal login page...');
    await portalPage.goto(`${FRONT_URL}/portal/login`, { waitUntil: 'networkidle', timeout: 15000 });
    await portalPage.waitForTimeout(1500);
    await portalPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'portal-01-login.png') });
    console.log('  ✓ portal-01-login.png');
  } catch (e) {
    console.log(`  ✗ Portal login failed: ${e.message}`);
  }

  // --- Portal Accept Invite Page ---
  try {
    console.log('Capturing portal accept-invite page...');
    await portalPage.goto(`${FRONT_URL}/portal/accept-invite?token=demo`, { waitUntil: 'networkidle', timeout: 15000 });
    await portalPage.waitForTimeout(1500);
    await portalPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'portal-02-accept-invite.png') });
    console.log('  ✓ portal-02-accept-invite.png');
  } catch (e) {
    console.log(`  ✗ Accept invite failed: ${e.message}`);
  }

  await portalCtx.close();

  // ═══════════════════════════════════════════════
  // PART 2: Admin - Invite a customer, then use portal
  // Log in as admin, invite a customer, get the invite link
  // ═══════════════════════════════════════════════

  const adminCtx = await browser.newContext({ viewport: VIEWPORT });
  const adminPage = await adminCtx.newPage();

  // Login as admin
  console.log('\nLogging in as admin...');
  await adminPage.goto(`${BACK_URL}/login`);
  await adminPage.waitForLoadState('networkidle');
  await adminPage.fill('input[type="email"]', 'admin@test.com');
  await adminPage.fill('input[type="password"]', 'password123');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL('**/dashboard', { timeout: 15000 });
  await adminPage.waitForLoadState('networkidle');
  console.log('  ✓ Logged in');

  // Navigate to a customer detail and try to invite to portal
  try {
    console.log('Navigating to first customer...');
    await adminPage.goto(`${BACK_URL}/customers`, { waitUntil: 'networkidle', timeout: 15000 });
    await adminPage.waitForTimeout(1000);

    // Click first customer
    const customerLink = await adminPage.$('a[href*="/customers/"]');
    if (customerLink) {
      await customerLink.click();
      await adminPage.waitForLoadState('networkidle');
      await adminPage.waitForTimeout(1500);
      await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'portal-03-customer-detail.png') });
      console.log('  ✓ portal-03-customer-detail.png');

      // Look for a portal invite button
      const portalBtn = await adminPage.$('button:has-text("Portal"), button:has-text("Invite"), button:has-text("portal")');
      if (portalBtn) {
        console.log('  Found portal invite button, clicking...');
        await portalBtn.click();
        await adminPage.waitForTimeout(2000);
        await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'portal-04-invite-dialog.png') });
        console.log('  ✓ portal-04-invite-dialog.png');
      }
    }
  } catch (e) {
    console.log(`  ✗ Customer detail failed: ${e.message}`);
  }

  // ═══════════════════════════════════════════════
  // PART 3: Tenant Website Pages
  // ═══════════════════════════════════════════════

  // Admin - Website builder pages
  const websitePages = [
    { route: '/website', name: 'website-01-overview' },
    { route: '/website/pages', name: 'website-02-pages' },
    { route: '/website/theme', name: 'website-03-theme' },
    { route: '/website/services', name: 'website-04-services' },
    { route: '/website/bookings', name: 'website-05-bookings' },
    { route: '/website/media', name: 'website-06-media' },
    { route: '/website/domains', name: 'website-07-domains' },
  ];

  for (const { route, name } of websitePages) {
    try {
      console.log(`Capturing ${name}...`);
      await adminPage.goto(`${BACK_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      await adminPage.waitForTimeout(1500);
      await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`) });
      console.log(`  ✓ ${name}.png`);
    } catch (e) {
      console.log(`  ✗ Failed: ${e.message}`);
    }
  }

  await adminCtx.close();

  // ═══════════════════════════════════════════════
  // PART 4: Public tenant website (front app)
  // ═══════════════════════════════════════════════
  const publicCtx = await browser.newContext({ viewport: VIEWPORT });
  const publicPage = await publicCtx.newPage();

  try {
    console.log('\nCapturing public tenant website homepage...');
    await publicPage.goto(FRONT_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await publicPage.waitForTimeout(2000);
    await publicPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'website-08-public-home.png') });
    console.log('  ✓ website-08-public-home.png');
  } catch (e) {
    console.log(`  ✗ Public homepage failed: ${e.message}`);
  }

  try {
    console.log('Capturing public booking page...');
    await publicPage.goto(`${FRONT_URL}/book`, { waitUntil: 'networkidle', timeout: 15000 });
    await publicPage.waitForTimeout(1500);
    await publicPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'website-09-booking.png') });
    console.log('  ✓ website-09-booking.png');
  } catch (e) {
    console.log(`  ✗ Booking page failed: ${e.message}`);
  }

  // Try comfort-pro slug
  try {
    console.log('Capturing tenant slug page...');
    await publicPage.goto(`${FRONT_URL}/comfort-pro`, { waitUntil: 'networkidle', timeout: 15000 });
    await publicPage.waitForTimeout(1500);
    await publicPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'website-10-tenant-page.png') });
    console.log('  ✓ website-10-tenant-page.png');
  } catch (e) {
    console.log(`  ✗ Tenant page failed: ${e.message}`);
  }

  await publicCtx.close();

  // ═══════════════════════════════════════════════
  // PART 5: Mobile viewport screenshots of portal
  // (simulate what portal looks like on mobile)
  // ═══════════════════════════════════════════════
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const mobilePage = await mobileCtx.newPage();

  try {
    console.log('\nCapturing mobile portal login...');
    await mobilePage.goto(`${FRONT_URL}/portal/login`, { waitUntil: 'networkidle', timeout: 15000 });
    await mobilePage.waitForTimeout(1500);
    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'portal-05-mobile-login.png') });
    console.log('  ✓ portal-05-mobile-login.png');
  } catch (e) {
    console.log(`  ✗ Mobile portal login failed: ${e.message}`);
  }

  await mobileCtx.close();
  await browser.close();
  console.log('\nDone! Additional screenshots saved to docs/screenshots/');
}

captureScreenshots().catch(console.error);
