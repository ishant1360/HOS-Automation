import { expect, Locator, Page } from '@playwright/test';

export class CountryCityBookingPage {
  private readonly page: Page;
  private readonly menuButton: Locator;
  private readonly countriesMenu: Locator;
  private readonly countriesDropdownHeading: Locator;
  private readonly unitedKingdomLink: Locator;
  private readonly cookieOkayButton: Locator;
  private readonly cookieCloseButton: Locator;
  private readonly propertyCards: Locator;
  private readonly roomCards: Locator;
  private readonly viewRoomsButton: Locator;
  private readonly viewAndBookButton: Locator;
  private readonly selectTenureButton: Locator;
  private readonly tenureOptions: Locator;
  private readonly bookNowButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menuButton = page.getByRole('button', { name: 'Menu', exact: true }).first();
    this.countriesMenu = page.locator('a[title="Countries"]')
      .or(page.getByRole('button', { name: 'Countries', exact: true }))
      .filter({ visible: true })
      .first();
    this.countriesDropdownHeading = page.getByText('Popular countries', { exact: true }).filter({ visible: true }).first();
    this.unitedKingdomLink = page.getByRole('link', { name: 'United Kingdom', exact: true }).filter({ visible: true }).first();
    this.cookieOkayButton = page.getByRole('button', { name: 'Okay', exact: true }).first();
    this.cookieCloseButton = page.getByRole('button', { name: 'Close cookie policy modal', exact: true }).first();
    this.propertyCards = page.locator('[data-property-card="true"]');
    this.viewRoomsButton = page.getByRole('button', { name: 'View rooms', exact: true }).first();
    this.roomCards = page.getByRole('button', { name: 'View and book', exact: true });
    this.viewAndBookButton = this.roomCards.first();
    this.selectTenureButton = page.getByRole('button', { name: /Select tenure|Select tenancy/i }).first();
    this.tenureOptions = page.getByRole('button').filter({ hasText: /^\d+\s+weeks(?:\s*\(\d+\))?$/i });
    this.bookNowButton = page.locator('button[data-tenancy-id]').filter({ hasText: /^Book now$/i, visible: true }).first();
  }

  async openHomePage(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page).toHaveURL(/stagingdev\.houseofstudent\.com\/?$/);
  }

  async openCountriesMenu(): Promise<void> {
    if (await this.cookieOkayButton.isVisible().catch(() => false)) {
      await this.cookieOkayButton.click({ force: true });
    } else if (await this.cookieCloseButton.isVisible().catch(() => false)) {
      await this.cookieCloseButton.click({ force: true });
    }

    if (!(await this.countriesMenu.isVisible().catch(() => false))) {
      await expect(this.menuButton).toBeVisible();
      await this.menuButton.click();
    }

    await expect(this.countriesMenu).toBeVisible();
    if (
      !(await this.countriesDropdownHeading.isVisible().catch(() => false)) &&
      !(await this.unitedKingdomLink.isVisible().catch(() => false))
    ) {
      await this.countriesMenu.click();
    }
    await expect.poll(async () =>
      await this.countriesDropdownHeading.isVisible().catch(() => false)
      || await this.unitedKingdomLink.isVisible().catch(() => false),
    ).toBeTruthy();
    await expect(this.unitedKingdomLink).toBeVisible();
  }

  async verifyCountriesDropdownVisible(): Promise<void> {
    await expect.poll(async () =>
      await this.countriesDropdownHeading.isVisible().catch(() => false)
      || await this.unitedKingdomLink.isVisible().catch(() => false),
    ).toBeTruthy();
    await expect(this.unitedKingdomLink).toBeVisible();
  }

  async selectCountry(country: string): Promise<void> {
    const escapedCountry = country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const countryLink = this.page.locator('a').filter({
      hasText: new RegExp(`^${escapedCountry}(?:\\s+\\d+\\+?\\s+properties)?$`, 'i'),
      visible: true,
    }).first();
    await expect(countryLink).toBeVisible();
    await countryLink.click();
  }

  async verifyCountryPageOpened(country: string): Promise<void> {
    await expect(this.page).toHaveURL(/\/uk(?:\/|$)/i);
    await expect(this.page.getByRole('heading', { name: new RegExp(country, 'i') })).toBeVisible();
  }

  async openNottinghamAccommodationPage(): Promise<void> {
    await this.page.goto('/uk/nottingham/student-accommodation');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifyNottinghamAccommodationPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/uk\/nottingham\/student-accommodation$/);
    await expect(this.page.getByRole('heading', { name: /Student Accommodation Nottingham/i })).toBeVisible();
  }

  async selectFirstAvailableProperty(): Promise<void> {
    const instantBookingProperty = this.propertyCards.filter({ hasText: /Instant Booking/i }).first();
    const property = await instantBookingProperty.count() ? instantBookingProperty : this.propertyCards.first();
    await expect(property).toBeVisible();
    await property.locator('h2').locator('xpath=..').click();
  }

  async openPropertyDetailsPage(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'View rooms', exact: true })).toBeVisible();
  }

  async selectRoomAndOpenBookingModal(): Promise<void> {
    if (await this.viewRoomsButton.isVisible().catch(() => false)) {
      await this.viewRoomsButton.click({ force: true });
    }

    await expect(this.roomCards.first()).toBeVisible();
    await this.viewAndBookButton.scrollIntoViewIfNeeded();
    await this.viewAndBookButton.click({ force: true });
    await expect.poll(async () => {
      return (await this.selectTenureButton.isVisible().catch(() => false))
        || (await this.tenureOptions.first().isVisible().catch(() => false))
        || (await this.bookNowButton.isVisible().catch(() => false));
    }, { timeout: 30_000 }).toBeTruthy();
  }

  async chooseTenure(tenureText?: string): Promise<void> {
    if (await this.selectTenureButton.isVisible().catch(() => false)) {
      await this.selectTenureButton.click({ force: true });
    }

    const tenureOption = tenureText
      ? this.page.getByRole('button').filter({
        hasText: new RegExp(`^${tenureText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      }).first()
      : this.tenureOptions.first();
    await expect(tenureOption).toBeVisible({ timeout: 30_000 });
    await tenureOption.click({ force: true });
  }

  async clickBookNow(): Promise<void> {
    if (await this.cookieOkayButton.isVisible().catch(() => false)) {
      await this.cookieOkayButton.click({ force: true });
    } else if (await this.cookieCloseButton.isVisible().catch(() => false)) {
      await this.cookieCloseButton.click({ force: true });
    }

    await expect(this.bookNowButton).toBeVisible({ timeout: 30_000 });
    await this.bookNowButton.click({ force: true });
    await expect.poll(async () => {
      return /\/booking\b|\/checkout\b|\/reservation\b|tenancy_id=/i.test(this.page.url())
        || await this.page.getByRole('heading', { name: /Personal Details|Review and proceed|Start your booking/i }).isVisible().catch(() => false)
        || await this.page.getByPlaceholder('Enter your full name', { exact: true }).isVisible().catch(() => false);
    }, { timeout: 60_000 }).toBeTruthy();
  }
}
