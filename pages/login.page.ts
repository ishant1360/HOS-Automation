import { expect, Locator, Page } from '@playwright/test';

export class LoginPage {
  private readonly page: Page;
  private readonly loginLink;
  private readonly cookieOkayButton;
  private readonly cookieCloseButton;
  private readonly privacyHeading;
  private readonly menuButton;
  private readonly loginDialog;

  constructor(page: Page) {
    this.page = page;
    this.loginLink = page.getByRole('link', { name: 'Log in or sign up', exact: true }).filter({ visible: true });
    this.cookieOkayButton = page.locator('button').filter({ hasText: /^Okay$/ }).filter({ visible: true }).first();
    this.cookieCloseButton = page.locator('button[aria-label="Close cookie policy modal"]').filter({ visible: true }).first();
    this.privacyHeading = page.locator('h1').filter({ hasText: /^We value your privacy$/ });
    this.menuButton = page.getByRole('button', { name: 'Menu', exact: true }).first();
    this.loginDialog = page.getByRole('dialog');
  }

  async open(): Promise<void> {
    await this.page.goto('/');

    await this.privacyHeading.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined);
    await this.dismissCookieNotices();

    const loginLink = this.page.locator('a').filter({ hasText: 'Log in or sign up' }).first();
    if (await loginLink.isVisible().catch(() => false)) {
      await loginLink.click({ force: true });
    } else {
      await this.page.evaluate(() => {
        const target = [...document.querySelectorAll('a')].find((el) => el.textContent?.includes('Log in or sign up'));
        target?.click();
      });
    }

    await expect(this.loginDialog).toBeVisible({ timeout: 30_000 });
  }

  async expectLoginScreenOpen(): Promise<void> {
    await expect(this.loginDialog).toBeVisible();
    await expect(this.loginDialog.getByText('Log in with email address', { exact: true })).toBeVisible();
    await expect(this.loginDialog.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(this.loginDialog.getByRole('button', { name: 'Send Verification Code' })).toBeVisible();
  }

  async loginWithEmailVerification(email: string): Promise<void> {
    await this.loginDialog.getByRole('textbox', { name: 'Email' }).fill(email);
    const letterOpenerPage = await this.page.context().newPage();
    const messagePage = await this.page.context().newPage();
    try {
      await letterOpenerPage.goto('https://stagingdev.houseofstudent.com/letter_opener');
      const messageLinks = letterOpenerPage.locator('a[href*="/rich"]');
      await expect(letterOpenerPage.getByRole('link', { name: 'Refresh', exact: true })).toBeVisible();
      await letterOpenerPage.getByRole('link', { name: 'Refresh', exact: true }).click();
      await expect(messageLinks.first()).toBeVisible({ timeout: 30_000 });
      const existingMessagePaths = new Set(
        (await messageLinks.evaluateAll((links) =>
          links.map((link) => link.getAttribute('href')).filter((href): href is string => Boolean(href)),
        )),
      );
      const checkedMessagePaths = new Set<string>();
      await this.clickWithoutCookieOverlay(
        this.loginDialog.getByRole('button', { name: 'Send Verification Code' }),
      );

      let otp: string | undefined;
      await expect.poll(async () => {
        await letterOpenerPage.getByRole('link', { name: 'Refresh', exact: true }).click();
        await expect(messageLinks.first()).toBeVisible({ timeout: 15_000 });
        const recentMessagePaths = await messageLinks.evaluateAll((links) =>
          links.map((link) => link.getAttribute('href')).filter((href): href is string => Boolean(href)),
        );

        const newMessagePaths = recentMessagePaths.filter((path) =>
          !existingMessagePaths.has(path) && !checkedMessagePaths.has(path),
        );
        for (const messagePath of newMessagePaths) {
          checkedMessagePaths.add(messagePath);
          await messagePage.goto(new URL(messagePath, 'https://stagingdev.houseofstudent.com').toString());
          const plainTextLink = messagePage.getByRole('link', { name: 'View plain text version', exact: true });
          if (await plainTextLink.isVisible().catch(() => false)) {
            await plainTextLink.click();
          }
          const letterText = await messagePage.locator('body').innerText();
          if (!letterText.toLowerCase().includes(email.toLowerCase())) {
            continue;
          }
          otp = letterText.match(/(?:secret code|otp|verification code)[^0-9]{0,40}(\d{4,8})/i)?.[1];
          if (otp) {
            return true;
          }
        }
        return false;
      }, { timeout: 120_000, intervals: [500, 1_000, 2_000, 3_000] }).toBeTruthy();

      await this.page.bringToFront();
      const verificationInput = this.loginDialog.getByPlaceholder('Enter OTP', { exact: true });
      if (!otp) {
        throw new Error('No labeled OTP was found in the recent verification emails.');
      }
      await verificationInput.fill(otp);
      await this.clickWithoutCookieOverlay(
        this.loginDialog.getByRole('button', { name: 'Log in', exact: true }),
      );
    } finally {
      await messagePage.close();
      await letterOpenerPage.close();
    }
  }

  async expectLoggedIn(): Promise<void> {
    await expect(this.loginDialog).toBeHidden();
    await expect(this.page).toHaveURL(/stagingdev\.houseofstudent\.com\/?$/);
    const logoutLink = this.page.getByRole('link', { name: 'Logout', exact: true }).filter({ visible: true });
    if (!(await logoutLink.isVisible().catch(() => false))) {
      await this.menuButton.click();
      await expect(logoutLink).toBeVisible();
    }
  }

  private async dismissCookieNotices(): Promise<void> {
    if (await this.cookieOkayButton.isVisible().catch(() => false)) {
      // The consent prompt can overlap the auth modal and intercept its button clicks.
      await this.cookieOkayButton.click({ force: true });
    } else if (await this.cookieCloseButton.isVisible().catch(() => false)) {
      await this.cookieCloseButton.click({ force: true });
    }
  }

  private async clickWithoutCookieOverlay(button: Locator): Promise<void> {
    await this.dismissCookieNotices();
    try {
      await button.click({ timeout: 10_000 });
    } catch (error) {
      if (!(await this.loginDialog.isVisible().catch(() => false))) {
        return;
      }
      if (
        !(await this.cookieOkayButton.isVisible().catch(() => false)) &&
        !(await this.cookieCloseButton.isVisible().catch(() => false))
      ) {
        throw error;
      }
      await this.dismissCookieNotices();
      if (!(await this.loginDialog.isVisible().catch(() => false))) {
        return;
      }
      await button.click({ timeout: 10_000 });
    }
  }

}