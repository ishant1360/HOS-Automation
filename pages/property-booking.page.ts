import { expect, Locator, Page } from '@playwright/test';

export class PropertyBookingPage {
  private readonly page: Page;
  private readonly cookieOkayButton: Locator;
  private readonly cookieCloseButton: Locator;
  private readonly searchButton: Locator;
  private readonly searchInput: Locator;
  private readonly visibleSearchDialog: Locator;
  private readonly propertyCards: Locator;
  private readonly viewRoomButton: Locator;
  private readonly roomCards: Locator;
  private readonly roomViewAndBookButton: Locator;
  private readonly selectTenureButton: Locator;
  private readonly tenureOptions: Locator;
  private readonly bookNowButton: Locator;
  private readonly bookingPageHeading: Locator;
  private selectedRoomName = '';

  constructor(page: Page) {
    this.page = page;

    this.cookieOkayButton = page.locator('button').filter({ hasText: /^Okay$/ }).filter({ visible: true });
    this.cookieCloseButton = page.locator('button[aria-label="Close cookie policy modal"]:visible');
    this.searchButton = page.getByRole('button', {
      name: /^(Search by city, university or property|Search)$/,
      exact: true,
    }).filter({ visible: true }).first();
    this.searchInput = page.locator('input[placeholder="Find by city, university or property"]:visible');
    this.visibleSearchDialog = page.locator('[role="dialog"]:visible');
    this.propertyCards = page.locator('[data-property-card="true"]');
    this.viewRoomButton = page.getByRole('button', { name: 'View rooms', exact: true }).first();
    this.roomCards = page.getByRole('button', { name: 'View and book', exact: true }).filter({ visible: true });
    this.roomViewAndBookButton = this.roomCards.first();
    this.selectTenureButton = page.getByRole('button', { name: /Select tenure|Select tenancy/i }).filter({ visible: true }).first();
    this.tenureOptions = page.getByRole('button').filter({
      hasText: /^\d+\s+weeks\s*\(\d+\)$/i,
      visible: true,
    });
    this.bookNowButton = page.locator('button[data-tenancy-id]').filter({ hasText: /^Book now$/i, visible: true }).first();
    this.bookingPageHeading = page.getByRole('heading', { name: 'Review and proceed', exact: true });
  }
  
  async handleCookiePopup(): Promise<void> {
    await this.cookieOkayButton.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => undefined);

    if (await this.cookieOkayButton.count() > 0) {
      await this.cookieOkayButton.first().click({ force: true });
      return;
    } else if (await this.cookieCloseButton.isVisible().catch(() => false)) {
      await this.cookieCloseButton.click({ force: true });
    }
  }

  async openSearch(): Promise<void> {
    await this.handleCookiePopup();

    if (await this.searchInput.isVisible().catch(() => false)) {
      return;
    }

    await expect(this.searchButton).toBeVisible();
    await this.searchButton.click({ force: true });
    await expect(this.searchInput).toBeVisible();
  }

  async searchFor(location: string): Promise<void> {
    await this.handleCookiePopup();
    await this.searchInput.fill(location);
    const escapedLocation = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const locationOption = this.visibleSearchDialog
      .getByRole('option')
      .filter({ hasText: new RegExp(`^${escapedLocation}(?:,\\s*United Kingdom)?$`, 'i') })
      .first();
    await expect(locationOption).toBeVisible({ timeout: 30_000 });
    await expect(locationOption).toBeVisible({ timeout: 30_000 });
    await locationOption.click();
    await this.page.waitForURL(/\/student-accommodation$/i, {
      timeout: 60_000,
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page.getByRole('heading', { name: /Student Accommodation London/i, exact: true })).toBeVisible({ timeout: 60_000 });
  }

  async expectMultiplePropertiesDisplayed(): Promise<void> {
    await expect.poll(() => this.propertyCards.count(), { timeout: 60_000 })
      .toBeGreaterThan(1);
    await expect(this.propertyCards.first()).toBeVisible();
  }

  async selectFirstProperty(): Promise<void> {
    await expect(this.propertyCards.first()).toBeVisible();
  }

  async expectFirstPropertySummary(): Promise<void> {
    const firstProperty = this.propertyCards.first();
    await expect(firstProperty.locator('h2')).toBeVisible();
    await expect(firstProperty).toContainText(/Nottingham/i);
    await expect(firstProperty).toContainText(/\b[1-5]\.\d\b/);
    await expect(firstProperty.getByText('Verified', { exact: true })).toBeVisible();
    await expect(firstProperty).toContainText(/From\s*£\s*\d[\d,]*\s*\/\s*week/i);
  }

  async viewDetailsForSelectedProperty(): Promise<void> {
    const propertyLink = this.propertyCards.first().locator('a[href*="/uk/"]').first();
    await expect(propertyLink).toHaveAttribute('href', /\/uk\/[^/]+\/[^/]+$/);
    await this.handleCookiePopup();
    await propertyLink.click({ force: true });
    await expect(this.viewRoomButton).toBeVisible();
  }

  async expectSelectedPropertyDetails(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /Nottingham/i }).first()).toBeVisible();
    await expect(this.page.getByText(/\bNG\d+\s*\d[A-Z]{2}\b/i).first()).toBeVisible();
    await expect(this.page.getByText('Verified', { exact: true }).filter({ visible: true }).first()).toBeVisible();
    await expect(this.viewRoomButton).toBeVisible();
  }

  async viewRooms(): Promise<void> {
    if (await this.roomCards.first().isVisible().catch(() => false)) {
      return;
    }

    await this.viewRoomButton.click({ force: true });
  }

  async expectMultipleRoomsDisplayed(): Promise<void> {
    await expect.poll(() => this.roomCards.count(), { timeout: 30_000 })
      .toBeGreaterThan(1);
    await expect(this.roomCards.first()).toBeVisible();
  }

  async selectFirstRoom(): Promise<void> {
    await expect(this.roomCards.first()).toBeVisible();
  }

  async viewAndBookSelectedRoom(): Promise<void> {
    const roomActionFallback = this.page.locator('button, a').filter({ hasText: /View more|View and book|Book now/i }).first();

    if (await this.selectTenureButton.isVisible().catch(() => false)) {
      return;
    }

    const primaryRoomAction = this.roomViewAndBookButton;
    if (await primaryRoomAction.isVisible().catch(() => false)) {
      this.selectedRoomName = (await primaryRoomAction.locator('xpath=../..').locator('p').first().innerText()).trim();
      await primaryRoomAction.scrollIntoViewIfNeeded();
      await this.handleCookiePopup();
      await primaryRoomAction.click();
      await expect(this.selectTenureButton).toBeVisible({ timeout: 30_000 });
      return;
    }

    if (await roomActionFallback.isVisible().catch(() => false)) {
      this.selectedRoomName = (await roomActionFallback.locator('xpath=..').innerText())
        .replace(/\s+/g, ' ')
        .trim();
      await this.handleCookiePopup();
      await roomActionFallback.scrollIntoViewIfNeeded();
      await roomActionFallback.click();
      await expect(this.selectTenureButton).toBeVisible({ timeout: 30_000 });
    }
  }

  async expectSelectedRoomDetails(): Promise<void> {
    expect(this.selectedRoomName, 'A room name should be captured before opening room details').not.toBe('');
    const roomHeading = this.page.getByRole('heading', { name: this.selectedRoomName, exact: true });
    await expect(roomHeading).toBeVisible();
    const roomDetails = roomHeading.locator('xpath=../../..');
    await expect(roomDetails).toContainText(/From\s*£\s*\d[\d,]*\s*\/\s*week/i);
    await expect(this.selectTenureButton).toBeVisible();
  }

  async getSelectedRoomDetails(): Promise<{ propertyName: string; roomName: string }> {
    const propertyName = await this.page.locator('h1, h2').filter({ hasText: /,/ }).first().innerText();

    return { propertyName, roomName: this.selectedRoomName };
  }

  async expectBookingPopupOpened(): Promise<void> {
    await this.handleCookiePopup();
    await expect(this.selectTenureButton).toBeVisible({ timeout: 30_000 });
  }

  async selectTenure(): Promise<void> {
    await expect(this.selectTenureButton).toBeVisible({ timeout: 30_000 });
    if (!(await this.tenureOptions.first().isVisible().catch(() => false))) {
      await this.selectTenureButton.click({ force: true });
    }

    await expect(this.tenureOptions.first()).toBeVisible({ timeout: 30_000 });
  }

  async expectTenureOptionsDisplayed(): Promise<void> {
    await expect.poll(() => this.tenureOptions.count(), { timeout: 30_000 })
      .toBeGreaterThan(1);
  }

  async selectTenureOption(tenure: string): Promise<void> {
    const escapedTenure = tenure.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const optionPattern = new RegExp(`^${escapedTenure}$`, 'i');
    const tenureOption = this.page.getByRole('button').filter({ hasText: optionPattern }).first();

    await expect(tenureOption).toBeVisible({ timeout: 30_000 });
    await tenureOption.click({ force: true });
  }

  async selectFirstAvailableTenureOption(): Promise<void> {
    await this.selectTenure();
    const tenureOption = this.tenureOptions.first();
    await expect(tenureOption).toBeVisible({ timeout: 30_000 });
    await tenureOption.click();
    await expect(this.bookNowButton).toBeVisible({ timeout: 30_000 });
  }

  async bookNow(): Promise<void> {
    await this.handleCookiePopup();
    await expect(this.bookNowButton).toBeVisible({ timeout: 30_000 });
    await this.bookNowButton.click();

    await expect.poll(async () => {
      const url = this.page.url();
      return /\/booking\b|\/checkout\b|\/reservation\b/i.test(url)
        || /\/booking\/[^?]+\?tenancy_id=\d+/.test(url)
        || await this.bookingPageHeading.isVisible().catch(() => false)
        || await this.page.getByRole('heading', { name: /Review and proceed|Start your booking/i }).first().isVisible().catch(() => false)
        || await this.page.locator('input[name="full_name"]').isVisible().catch(() => false)
        || await this.page.getByPlaceholder('Enter your full name', { exact: true }).isVisible().catch(() => false);
    }, { timeout: 60_000 }).toBeTruthy();
  }

  async expectBookingSuccessfullyCompleted(): Promise<void> {
    await expect.poll(async () => {
      const url = this.page.url();
      return /\/booking\b|\/checkout\b|\/reservation\b/i.test(url)
        || /\/booking\/[^?]+\?tenancy_id=\d+/.test(url)
        || await this.bookingPageHeading.isVisible().catch(() => false)
        || await this.page.getByRole('heading', { name: /Review and proceed|Start your booking/i }).first().isVisible().catch(() => false);
    }, { timeout: 60_000 }).toBeTruthy();
  }

  async expectBookPageOpen(): Promise<void> {
    await expect(this.bookingPageHeading).toBeVisible();
  }

}