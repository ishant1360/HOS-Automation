import { expect, Locator, Page } from '@playwright/test';

export class UniversityAccommodationPage {
  private readonly page: Page;
  private readonly universitiesMenu: Locator;
  private readonly universitiesMenuButton: Locator;
  private readonly mobileMenuButton: Locator;
  private readonly universitiesDropdownHeading: Locator;
  private readonly nottinghamUniversityLink: Locator;
  private readonly universityHeading: Locator;
  private readonly universitySummary: Locator;
  private readonly campusSummary: Locator;
  private readonly propertyCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.universitiesMenu = page.locator('a[title="Universities"]').filter({ visible: true }).first();
    this.universitiesMenuButton = page.getByRole('button', { name: 'Universities', exact: true }).filter({ visible: true }).first();
    this.mobileMenuButton = page.getByRole('button', { name: 'Menu', exact: true }).filter({ visible: true }).first();
    this.universitiesDropdownHeading = page.getByText('Popular universities', { exact: true }).filter({ visible: true }).first();
    this.nottinghamUniversityLink = page.getByRole('link', { name: 'University Of Nottingham', exact: true }).filter({ visible: true }).first();
    this.universityHeading = page.getByRole('heading', { name: 'University Of Nottingham Accommodation', exact: true }).first();
    this.universitySummary = page.getByText(/\d+\s+properties\s*·\s*From £\d+\/week\s*·\s*\d+\s+campus/i);
    this.campusSummary = page.getByText('This university has 4 campus location.', { exact: true });
    this.propertyCards = page.locator('[data-property-card="true"]');
  }

  async openHomePage(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page).toHaveURL(/stagingdev\.houseofstudent\.com\/?$/);
  }

  async openUniversitiesMenu(): Promise<void> {
    if (await this.universitiesMenu.isVisible().catch(() => false)) {
      await this.universitiesMenu.click();
    } else {
      await expect(this.mobileMenuButton).toBeVisible();
      if (!(await this.universitiesMenuButton.isVisible().catch(() => false))) {
        await this.mobileMenuButton.click();
      }
      await expect(this.universitiesMenuButton).toBeVisible();
      await this.universitiesMenuButton.click();
      await expect(this.universitiesMenuButton).toHaveAttribute('aria-expanded', 'true');
    }

    await expect(this.universitiesDropdownHeading).toBeVisible();
    await expect(this.nottinghamUniversityLink).toBeVisible();
  }

  async selectUniversityOfNottingham(): Promise<void> {
    await this.nottinghamUniversityLink.click();
    await this.page.waitForURL(/\/uk\/student-accommodation\/university-of-nottingham$/);
    await expect(this.universityHeading).toBeVisible();
  }

  async verifyUniversityDetailsAndAccommodations(): Promise<void> {
    await expect(this.page).toHaveURL(/\/uk\/student-accommodation\/university-of-nottingham$/);
    await expect(this.universityHeading).toBeVisible();
    await expect(this.universitySummary).toBeVisible();
    await expect(this.campusSummary).toBeVisible();
    await expect.poll(() => this.propertyCards.count(), { timeout: 60_000 }).toBeGreaterThan(0);
    await expect(this.propertyCards.first()).toBeVisible();
  }
}
