const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('https://stagingdev.houseofstudent.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const info = {};
  // Cookie modal presence & role
  info.privacyDialogs = await page.locator('[role="dialog"]').count();
  info.privacyText = (await page.locator('body').innerText()).includes('We value your privacy');
  info.authModal = await page.locator('.u-auth-modal').count();
  // If cookie modal exists, show its html
  const cookieClose = page.getByRole('button', { name: 'Close cookie policy modal', exact: true });
  if (await cookieClose.count()) {
    info.cookieContainer = await cookieClose.locator('xpath=ancestor::div[contains(@class,"modal") or contains(@role,"dialog")][1]').evaluate(
      (el) => ({ tag: el.tagName, cls: el.className, role: el.getAttribute('role'), aria: el.getAttribute('aria-hidden') })
    ).catch(() => null);
  }
  // Search raw html for the cookie modal heading container
  const html = await page.content();
  const idx = html.indexOf('We value your privacy');
  if (idx >= 0) {
    const slice = html.slice(Math.max(0, idx - 800), idx + 100);
    const opens = [...slice.matchAll(/<(div|section)\b[^>]*>/g)].reverse();
    info.cookieModalOpenTag = opens[0] ? opens[0][0] : null;
    info.cookieModalContext = slice.replace(/\s+/g, ' ').slice(-600);
  }
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});