import { expect, Locator, Page } from '@playwright/test';

export class WishlistPage {
  private readonly page: Page;
  private readonly cookieOkayButton: Locator;
  private readonly cookieCloseButton: Locator;
  private readonly menuButton: Locator;
  private readonly wishlistLink: Locator;
  private readonly wishlistPropertyLink: Locator;
  private readonly viewRoomsButton: Locator;
  private readonly viewAndBookButton: Locator;
  private readonly selectTenureButton: Locator;
  private readonly bookNowButton: Locator;
  private readonly personalDetailsHeading: Locator;
  private readonly reviewHeading: Locator;
  private selectedRoomName = '';

  constructor(page: Page) {
    this.page = page;
    this.cookieOkayButton = page.getByRole('button', { name: 'Okay', exact: true }).filter({ visible: true }).first();
    this.cookieCloseButton = page.getByRole('button', { name: 'Close cookie policy modal', exact: true }).filter({ visible: true }).first();
    this.menuButton = page.getByRole('button', { name: 'Menu', exact: true }).filter({ visible: true }).first();
    this.wishlistLink = page.getByRole('link', { name: /Wishlist/i }).filter({ visible: true }).first();
    this.wishlistPropertyLink = page.getByRole('link', {
      name: /Free cancellation No visa.*No pay.*Bills incl\..*1 month.*From €1,627\/month.*Entire/i,
    }).first();
    this.viewRoomsButton = page.getByRole('button', { name: 'View rooms', exact: true }).filter({ visible: true }).first();
    this.viewAndBookButton = page.getByRole('button', { name: 'View and book', exact: true }).filter({ visible: true }).first();
    this.selectTenureButton = page.getByRole('button', { name: /Select tenure|Select tenancy/i }).filter({ visible: true }).first();
    this.bookNowButton = page.locator('button[data-tenancy-id]').filter({ hasText: /^Book now$/i, visible: true }).first();
    this.personalDetailsHeading = page.getByRole('heading', { name: 'Personal Details', exact: true });
    this.reviewHeading = page.getByRole('heading', { name: 'Review and proceed', exact: true });
  }

  async handleCookiePopup(): Promise<void> {
    if (await this.cookieOkayButton.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await this.cookieOkayButton.click({ force: true });
      await this.page.waitForTimeout(1_000);
      return;
    }

    if (await this.cookieCloseButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await this.cookieCloseButton.click({ force: true });
      await this.page.waitForTimeout(1_000);
    }
  }

  async openWishlist(): Promise<void> {
    await this.handleCookiePopup();
    if (!(await this.wishlistLink.isVisible().catch(() => false))) {
      await this.menuButton.click();
    }
    await expect(this.wishlistLink).toBeVisible();
    await this.wishlistLink.click({ force: true });
    await expect(this.wishlistPropertyLink).toBeVisible();
  }

  async openWishlistProperty(): Promise<void> {
    await this.wishlistPropertyLink.click({ force: true });
    await expect(this.viewRoomsButton).toBeVisible();
  }

  async openFirstRoom(): Promise<void> {
    await this.viewRoomsButton.click();
    await expect(this.viewAndBookButton).toBeVisible();
    this.selectedRoomName = (await this.viewAndBookButton.locator('xpath=..').innerText())
      .replace(/\s+/g, ' ')
      .trim();
    await this.viewAndBookButton.scrollIntoViewIfNeeded();
    await this.viewAndBookButton.click();
    await this.handleCookiePopup();
    await expect(this.selectTenureButton).toBeVisible();
  }

  async getSelectedRoomDetails(): Promise<{ propertyName: string; roomName: string }> {
    const propertyName = await this.page.locator('h1, h2').filter({ hasText: /,/ }).first().innerText();

    return { propertyName, roomName: this.selectedRoomName };
  }

  async bookRoom(): Promise<void> {
    await this.selectTenureButton.click({ force: true });
    await this.bookNowButton.click({ force: true });
    await expect(this.personalDetailsHeading.or(this.reviewHeading)).toBeVisible();
  }
}
