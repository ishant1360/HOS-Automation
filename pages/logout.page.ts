import { expect, Locator, Page } from '@playwright/test';

export class LogoutPage {
  private readonly page: Page;
  private readonly menuButton: Locator;
  private readonly logoutLink: Locator;
  private readonly loginLink: Locator;
  private readonly cookieOkayButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menuButton = page.getByRole('button', { name: 'Menu', exact: true }).filter({ visible: true }).first();
    this.logoutLink = page.getByRole('link', { name: 'Logout', exact: true }).filter({ visible: true }).first();
    this.loginLink = page.getByRole('link', { name: 'Log in or sign up', exact: true }).filter({ visible: true }).first();
    this.cookieOkayButton = page.locator('button').filter({ hasText: /^Okay$/ });
  }

  async logoutIfLoggedIn(): Promise<void> {
    if (await this.cookieOkayButton.isVisible().catch(() => false)) {
      await this.cookieOkayButton.click({ force: true });
    }

    if (!(await this.logoutLink.isVisible().catch(() => false))) {
      if (!(await this.menuButton.isVisible().catch(() => false))) {
        return;
      }
      await this.menuButton.click();
    }

    if (!(await this.logoutLink.isVisible().catch(() => false))) {
      return;
    }

    await this.logoutLink.click();
    await expect(this.page).toHaveURL(/stagingdev\.houseofstudent\.com\/?$/i);
    await this.cookieOkayButton.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined);
    if (await this.cookieOkayButton.isVisible().catch(() => false)) {
      await this.cookieOkayButton.click({ force: true });
      await expect(this.cookieOkayButton).toBeHidden();
    }
    if (!(await this.loginLink.isVisible().catch(() => false))) {
      await this.menuButton.click();
    }
    await expect(this.loginLink).toBeVisible();
  }
}
