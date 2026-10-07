import { expect, Locator, Page } from '@playwright/test';

export class SkyPlazaBookingPage {
  private readonly page: Page;
  private readonly cookieOkayButton: Locator;
  private readonly cookieCloseButton: Locator;
  private readonly propertyName: Locator;
  private readonly propertyAddress: Locator;
  private readonly propertyRating: Locator;
  private readonly verifiedStatus: Locator;
  private readonly viewRoomsButton: Locator;
  private readonly roomTypeHeading: Locator;
  private readonly roomActions: Locator;
  private readonly selectTenureButton: Locator;
  private readonly availableTenureOptions: Locator;
  private readonly bookNowButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cookieOkayButton = page.getByRole('button', { name: 'Okay', exact: true }).filter({ visible: true }).first();
    this.cookieCloseButton = page.getByRole('button', { name: 'Close cookie policy modal', exact: true }).filter({ visible: true }).first();
    this.propertyName = page.locator('h1').filter({ hasText: /^Sky Plaza,\s*leeds$/i });
    this.propertyAddress = page.getByText(/Clay Pit Lane,\s*LS2 8AR/i).first();
    this.propertyRating = page.getByText(/★\s*\d+(?:\.\d+)?/).filter({ visible: true }).first();
    this.verifiedStatus = page.getByText('Verified', { exact: true }).filter({ visible: true }).first();
    this.viewRoomsButton = page.getByRole('button', { name: 'View rooms', exact: true }).filter({ visible: true }).first();
    this.roomTypeHeading = page.getByRole('heading', { name: 'Room types', exact: true });
    this.roomActions = page.getByRole('button', { name: 'View and book', exact: true }).filter({ visible: true });
    this.selectTenureButton = page.getByRole('button', { name: 'Select tenure', exact: true }).filter({ visible: true }).first();
    this.availableTenureOptions = page.getByRole('button').filter({
      hasText: /^\d+\s+weeks\s*\(\d+\)$/i,
      visible: true,
    });
    this.bookNowButton = page.getByRole('button', { name: 'Book now', exact: true }).filter({ visible: true }).first();
  }

  async openPropertyPage(): Promise<void> {
    await this.page.goto('/uk/leeds/sky-plaza');
    await this.dismissCookieNotice();
    await expect(this.page).toHaveURL(/\/uk\/leeds\/sky-plaza\/?$/i);
  }

  async verifyPropertyDetails(): Promise<void> {
    await expect(this.propertyName).toBeVisible();
    await expect(this.propertyAddress).toBeVisible();
    await expect(this.propertyRating).toBeVisible();
    await expect(this.verifiedStatus).toBeVisible();
    await expect(this.viewRoomsButton).toBeVisible();
  }

  async viewAvailableRooms(): Promise<void> {
    await this.viewRoomsButton.click();
    await expect(this.roomTypeHeading).toBeVisible();
    await expect.poll(() => this.roomActions.count(), { timeout: 30_000 }).toBeGreaterThan(0);
  }

  async selectAvailableRoom(): Promise<void> {
    const firstRoomAction = this.roomActions.first();
    const roomCard = firstRoomAction.locator('xpath=..');

    await expect(firstRoomAction).toBeVisible();
    await expect(roomCard).toContainText(/£\s*\d+\s*\/week/i);
    await firstRoomAction.scrollIntoViewIfNeeded();
    await firstRoomAction.click({ force: true });
    await expect(this.selectTenureButton).toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByText(/1 Double bed|Studio|Entire Place/i).first()).toBeVisible();
    await expect(this.page.getByText(/£\s*\d+\s*\/week/i).filter({ visible: true }).first()).toBeVisible();
  }

  async selectFirstAvailableTenure(): Promise<void> {
    await expect(this.availableTenureOptions.first()).toBeVisible();
    await this.availableTenureOptions.first().click({ force: true });
  }

  async startBooking(): Promise<void> {
    await this.dismissCookieNotice();
    await expect(this.bookNowButton).toBeVisible();
    await this.bookNowButton.click({ force: true });
  }

  private async dismissCookieNotice(): Promise<void> {
    if (await this.cookieOkayButton.isVisible().catch(() => false)) {
      await this.cookieOkayButton.click({ force: true });
    } else if (await this.cookieCloseButton.isVisible().catch(() => false)) {
      await this.cookieCloseButton.click({ force: true });
    }
  }
}
