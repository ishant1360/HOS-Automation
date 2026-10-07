import { expect, Locator, Page } from '@playwright/test';

export type BookingSummary = {
  bookingId: string;
  propertyName: string;
};

export class BookingPage {
  private readonly page: Page;
  private readonly menuButton: Locator;
  private readonly bookingsMenuLink: Locator;
  private readonly cookieOkayButton: Locator;
  private readonly cookieCloseButton: Locator;
  private readonly bookingHeading: Locator;
  private readonly viewBookingLinks: Locator;
  private readonly paymentLedgerLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menuButton = page.getByRole('button', { name: 'Menu', exact: true }).filter({ visible: true }).first();
    this.bookingsMenuLink = page.getByRole('link', { name: /^Bookings(?:\s+\d+)?$/i }).filter({ visible: true }).first();
    this.cookieOkayButton = page.getByRole('button', { name: 'Okay', exact: true }).filter({ visible: true }).first();
    this.cookieCloseButton = page.getByRole('button', { name: 'Close cookie policy modal', exact: true }).filter({ visible: true }).first();
    this.bookingHeading = page.getByRole('heading', { name: 'Bookings', exact: true });
    this.viewBookingLinks = page.getByRole('link', { name: 'View Booking', exact: true });
    this.paymentLedgerLinks = page.getByRole('link', { name: 'Payment Ledger', exact: true });
  }

  async openFromSidebar(): Promise<void> {
    await this.dismissCookieNotice();
    await expect(this.menuButton).toBeVisible();
    if (!(await this.bookingsMenuLink.isVisible().catch(() => false))) {
      await this.menuButton.click();
    }

    await expect(this.bookingsMenuLink).toBeVisible();
    await this.bookingsMenuLink.click();
    await expect(this.page).toHaveURL(/\/mybookings\/?$/i);
    await this.expectBookingPageDisplayed();
  }

  async expectBookingPageDisplayed(): Promise<void> {
    await expect(this.page).toHaveURL(/\/mybookings\/?$/i);
    await expect(this.bookingHeading).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'Book your perfect place', exact: true })).toBeVisible();
    await expect.poll(() => this.viewBookingLinks.count(), { timeout: 60_000 }).toBeGreaterThan(0);
  }

  async expectBookingRecordDetails(index = 0): Promise<void> {
    const card = this.cardForAction(this.viewBookingLinks.nth(index));
    await expect(card).toContainText(/Booking ID\s*:/i);
    await expect(card).toContainText(/Status\s*:\s*\S+/i);
    await expect(card).toContainText(/Updated On\s*:\s*\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4}/i);
    await expect(card.locator('h2').first()).toBeVisible();
    await expect(card).toContainText(/Tenancy\s*:/i);
    await expect(card).toContainText(/Move-in/i);
    await expect(card.getByRole('link', { name: 'View Booking', exact: true })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
  }

  async expectBookingActionsDisplayed(index = 0): Promise<void> {
    const card = this.cardForAction(this.viewBookingLinks.nth(index));
    await expect(card.getByRole('link', { name: 'View Booking', exact: true })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
    const optionalActions = card.getByRole('link', { name: /^(Payment Ledger|Complete\s*Payment)$/i });
    const actionCount = await optionalActions.count();
    for (let actionIndex = 0; actionIndex < actionCount; actionIndex += 1) {
      await expect(optionalActions.nth(actionIndex)).toBeVisible();
    }
  }

  async viewBooking(index = 0): Promise<BookingSummary> {
    const action = this.viewBookingLinks.nth(index);
    const card = this.cardForAction(action);
    const bookingId = await this.readBookingId(card);
    const propertyName = (await card.locator('h2').first().innerText()).trim();

    await action.click();
    await expect(this.page).toHaveURL(/\/bookings\/view\/[^/]+\/booking-details\/?$/i);

    return { bookingId, propertyName };
  }

  async expectBookingDetails(summary: BookingSummary): Promise<void> {
    await expect(this.page.getByRole('heading', { name: summary.propertyName, exact: true }).first()).toBeVisible();
    await expect(this.page.getByText('Room Details', { exact: true })).toBeVisible();
    const bookingDetailsHeading = this.page.getByText('Booking Details:', { exact: true });
    await expect(bookingDetailsHeading).toBeVisible();
    const bookingDetails = bookingDetailsHeading.locator('xpath=..');
    await expect(bookingDetails).toContainText(summary.bookingId);
    await expect(bookingDetails).toContainText(/Status\s*:\s*\S+/i);
    await expect(bookingDetails).toContainText(/Updated On\s*:\s*\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4}/i);

    const roomDetails = this.page.getByRole('table');
    await expect(roomDetails).toBeVisible();
    await expect(roomDetails.getByRole('row').first()).toContainText(/Price/i);
    await expect(roomDetails.getByRole('row').first()).toContainText(/Duration/i);
    await expect(roomDetails.getByRole('row').first()).toContainText(/Move in/i);
    await expect(roomDetails.getByRole('row').first()).toContainText(/Move out/i);
    await expect(roomDetails.getByRole('row').nth(1)).toContainText(/£\s*[\d,]+\s*\/\s*Week/i);
    await expect(roomDetails.getByRole('row').nth(1)).toContainText(/\d+\s+Weeks/i);
    await expect(roomDetails.getByRole('row').nth(1)).toContainText(/\d{1,2}\s+\w{3}\s+\d{4}/i);

    await expect(this.page.getByRole('link', { name: 'Booking Details', exact: true })).toBeVisible();
    await expect(this.page.getByRole('link', { name: 'Payment Details', exact: true })).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
  }

  async openPaymentLedger(): Promise<BookingSummary> {
    await expect(this.paymentLedgerLinks.first()).toBeVisible();
    const action = this.paymentLedgerLinks.first();
    const card = this.cardForAction(action);
    const bookingId = await this.readBookingId(card);
    const propertyName = (await card.locator('h2').first().innerText()).trim();

    await action.click();
    await expect(this.page).toHaveURL(/\/bookings\/view\/[^/]+\/booking-payments\/?$/i);
    return { bookingId, propertyName };
  }

  async expectPaymentLedger(summary: BookingSummary): Promise<void> {
    await expect(this.page.getByText(summary.propertyName, { exact: true }).first()).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'Payment Transactions:', exact: true })).toBeVisible();
    await expect(this.page.getByRole('link', { name: 'Booking Details', exact: true })).toBeVisible();
    await expect(this.page.getByRole('link', { name: 'Payment Details', exact: true })).toBeVisible();
    await expect.poll(async () =>
      await this.page.getByText(/No Payments Transactions available yet/i).isVisible().catch(() => false)
      || await this.page.getByRole('table').isVisible().catch(() => false),
    { timeout: 30_000 }).toBeTruthy();
  }

  async openSandboxBooking(bookingId: string): Promise<void> {
    const matchingCard = await this.findBookingCard(bookingId);
    await expect(matchingCard).toBeVisible();
    await expect(matchingCard).toContainText(bookingId);
  }

  async cancelSandboxBooking(bookingId: string): Promise<void> {
    const card = await this.findBookingCard(bookingId);
    await expect(card).toContainText(/Status\s*:\s*(?:In Process|Pending|Confirmed)/i);
    const cancelButton = card.getByRole('button', { name: 'Cancel', exact: true });
    await expect(cancelButton).toBeVisible();

    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await cancelButton.click();

    const confirmation = this.page.getByRole('dialog');
    if (await confirmation.isVisible().catch(() => false)) {
      await expect(confirmation).toContainText(/cancel/i);
      const confirmButton = confirmation.getByRole('button', { name: /^(yes|confirm|confirm cancellation|cancel booking)$/i });
      await expect(confirmButton).toBeVisible();
      await confirmButton.click();
    }

    await expect(await this.findBookingCard(bookingId)).toContainText(/Status\s*:\s*(?:Cancelled|Canceled)/i, {
      timeout: 60_000,
    });
  }

  async openCompletePayment(bookingId: string): Promise<void> {
    const card = await this.findBookingCard(bookingId);
    const action = card.getByRole('link', { name: /^Complete\s*Payment$/i });
    await expect(action).toBeVisible();
    await action.click();
    await expect(this.page).toHaveURL(/\/bookings\/[^/]+\/pending-payments\/[^/]+\/?$/i);
  }

  async expectPaymentPageReadyWithoutSubmitting(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Continue Booking', exact: true })).toBeVisible();
    await expect(this.page.getByText('Pay by Card', { exact: true })).toBeVisible();
    const paymentMethod = this.page.getByRole('radio');
    await expect(paymentMethod).toBeVisible();
    await expect(paymentMethod).toBeChecked();
    await expect(this.page.locator('input[autocomplete="cc-number"], input[name*="card" i]')).toHaveCount(0);
  }

  async getBookingCount(): Promise<number> {
    return this.viewBookingLinks.count();
  }

  async goBackFromBookings(): Promise<void> {
    await this.page.goBack();
    await expect(this.page).toHaveURL(/stagingdev\.houseofstudent\.com\/?$/i);
  }

  private async dismissCookieNotice(): Promise<void> {
    if (await this.cookieOkayButton.isVisible().catch(() => false)) {
      await this.cookieOkayButton.click({ force: true });
    } else if (await this.cookieCloseButton.isVisible().catch(() => false)) {
      await this.cookieCloseButton.click({ force: true });
    }
  }

  private cardForAction(action: Locator): Locator {
    return action.locator('xpath=ancestor::div[.//span[normalize-space()="Booking ID :"]][1]');
  }

  private async findBookingCard(bookingId: string): Promise<Locator> {
    const linkCount = await this.viewBookingLinks.count();
    for (let index = 0; index < linkCount; index += 1) {
      const card = this.cardForAction(this.viewBookingLinks.nth(index));
      if ((await card.innerText()).includes(bookingId)) {
        return card;
      }
    }
    throw new Error(`Booking record ${bookingId} was not found on the Booking page.`);
  }

  private async readBookingId(card: Locator): Promise<string> {
    const text = (await card.innerText()).replace(/\s+/g, ' ');
    const bookingId = text.match(/Booking ID\s*:\s*([A-Z]?\d+)/i)?.[1];
    if (!bookingId) {
      throw new Error('Could not read a booking ID from the selected booking record.');
    }
    return bookingId;
  }
}
