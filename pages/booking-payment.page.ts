import { expect, Locator, Page } from '@playwright/test';

export class BookingPaymentPage {
  private readonly page: Page;
  private readonly nationalitySelect: Locator;
  private readonly nationalitySearch: Locator;
  private readonly nationalityRequiredError: Locator;
  private readonly cityInput: Locator;
  private readonly postcodeInput: Locator;
  private readonly addressInput: Locator;
  private readonly countrySelect: Locator;
  private readonly countrySearch: Locator;
  private readonly dateOfBirthSelect: Locator;
  private readonly genderSelect: Locator;
  private readonly continueButton: Locator;
  private readonly courseNameInput: Locator;
  private readonly studyYearSelect: Locator;
  private readonly moveInDateSelect: Locator;
  private readonly courseEndDateSelect: Locator;
  private readonly payButton: Locator;
  private readonly emergencyDetailsHeading: Locator;
  private readonly personalDetailsHeading: Locator;
  private readonly completeBookingHeading: Locator;
  private readonly startBookingHeading: Locator;
  private readonly fullNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly phoneInput: Locator;
  private readonly countryCodeSelect: Locator;
  private readonly nextButton: Locator;
  private readonly reviewHeading: Locator;
  private readonly reviewAndPayHeading: Locator;
  private readonly reviewAndProceedHeading: Locator;
  private readonly savedCardOption: Locator;
  private readonly addCardButton: Locator;
  private readonly bookingsHeading: Locator;
  private readonly bookingId: Locator;
  private readonly bookingTermsCheckbox: Locator;
  private readonly confirmBookingButton: Locator;
  private bookingCompletedFromBookingsPage = false;

  constructor(page: Page) {
    this.page = page;
    this.nationalitySelect = page.getByText(/Select nationality/i).filter({ visible: true }).last();
    this.nationalitySearch = page.getByRole('textbox', { name: 'Search nationality' });
    this.nationalityRequiredError = page.getByText('Nationality is required', { exact: true }).filter({ visible: true });
    this.cityInput = page.locator('input[name="contact_city"]');
    this.postcodeInput = page.locator('input[name="contact_postcode"]');
    this.addressInput = page.locator('textarea[name="contact_address"]');
    this.countrySelect = page.getByText(/Select country/i).filter({ visible: true }).last();
    this.countrySearch = page.getByRole('textbox', { name: 'Search country' });
    this.dateOfBirthSelect = page.getByText('Select date', { exact: true }).filter({ visible: true }).first();
    this.genderSelect = page.getByText('Select', { exact: true }).filter({ visible: true }).last();
    this.continueButton = page.getByRole('button', { name: 'Continue', exact: true });
    this.courseNameInput = page.locator('input[name="course_name"]');
    this.studyYearSelect = page.locator('div').filter({ hasText: /^Select$/ }).nth(1);
    this.moveInDateSelect = page.getByText(/Course Start Date.*Select date/i).filter({ visible: true }).last();
    this.courseEndDateSelect = page.getByText(/Course End Date.*Select date/i).filter({ visible: true }).last();
    this.payButton = page.getByRole('button', { name: /^Pay £/ });
    this.emergencyDetailsHeading = page.getByRole('heading', { name: 'Emergency Details', exact: true });
    this.personalDetailsHeading = page.getByRole('heading', { name: 'Personal Details', exact: true });
    this.completeBookingHeading = page.getByRole('heading', { name: 'Complete your booking', exact: true });
    this.startBookingHeading = page.getByRole('heading', { name: 'Start your booking', exact: true });
    this.fullNameInput = page.getByPlaceholder('Enter your full name', { exact: true });
    this.emailInput = page.getByPlaceholder('Enter your email address', { exact: true });
    this.phoneInput = page.getByPlaceholder('Number without country code', { exact: true });
    this.countryCodeSelect = page.getByText('Country code', { exact: true }).first();
    this.nextButton = page.getByRole('button', { name: /^(Next|Save and continue)$/, exact: true });
    this.reviewHeading = page.getByRole('heading', { name: /Review and confirm your booking|Review and proceed|Review and pay/i });
    this.reviewAndPayHeading = page.getByRole('heading', { name: /^Review and pay$/i });
    this.reviewAndProceedHeading = page.getByRole('heading', { name: 'Review and proceed', exact: true });
    this.savedCardOption = page.getByRole('checkbox', { name: /Card\s*:/i }).first();
    this.addCardButton = page.getByRole('button', { name: 'Add Card', exact: true });
    this.bookingsHeading = page.getByRole('heading', { name: 'Bookings', exact: true });
    this.bookingId = page.getByText(/^B\d+$/).filter({ visible: true }).first();
    this.bookingTermsCheckbox = page.getByRole('checkbox', {
      name: /I accept the cancellation policy and terms of booking/i,
    });
    this.confirmBookingButton = page.getByRole('button', { name: 'Confirm your booking', exact: true });
  }

  async expectBookingDetailsPageOpen(): Promise<boolean> {
    await expect.poll(async () =>
      await this.startBookingHeading.isVisible().catch(() => false)
      || await this.reviewHeading.isVisible().catch(() => false)
      || await this.fullNameInput.isVisible().catch(() => false)
      || await this.completeBookingHeading.isVisible().catch(() => false)
      || await this.personalDetailsHeading.isVisible().catch(() => false)
      || await this.nationalitySelect.isVisible().catch(() => false)
      || await this.payButton.isVisible().catch(() => false)
      || await this.bookingsHeading.isVisible().catch(() => false),
    { timeout: 60_000 }).toBeTruthy();

    if (await this.bookingsHeading.isVisible().catch(() => false)) {
      await expect(this.page).toHaveURL(/\/mybookings\/?$/i);
      await expect(this.bookingId).toBeVisible();
      this.bookingCompletedFromBookingsPage = true;
      return true;
    }

    if (await this.reviewAndProceedHeading.isVisible().catch(() => false)) {
      const nextButton = this.page.getByRole('button', { name: 'Next', exact: true });
      if (!(await this.isPersonalDetailsStep())
        && !(await this.bookingsHeading.isVisible().catch(() => false))
        && await nextButton.isVisible().catch(() => false)) {
        try {
          await nextButton.click({ timeout: 10_000 });
        } catch (error) {
          const pageAdvanced = await this.isPersonalDetailsStep()
            || await this.bookingsHeading.isVisible().catch(() => false);
          if (!pageAdvanced) {
            throw error;
          }
        }
        await expect.poll(async () =>
          await this.fullNameInput.isVisible().catch(() => false)
          || await this.completeBookingHeading.isVisible().catch(() => false)
          || await this.personalDetailsHeading.isVisible().catch(() => false)
          || await this.nationalitySelect.isVisible().catch(() => false)
          || await this.bookingsHeading.isVisible().catch(() => false),
        { timeout: 60_000 }).toBeTruthy();
        if (await this.bookingsHeading.isVisible().catch(() => false)) {
          await expect(this.page).toHaveURL(/\/mybookings\/?$/i);
          await expect(this.bookingId).toBeVisible();
          this.bookingCompletedFromBookingsPage = true;
          return true;
        }
      }
    }
    return false;
  }

  async expectPropertyBookingListed(propertyName: string): Promise<void> {
    await expect(this.bookingsHeading).toBeVisible();
    await expect(this.page.getByRole('heading', { name: propertyName, exact: true }).first()).toBeVisible();
    await expect(this.bookingId).toBeVisible();
  }

  async completeStartBookingDetails(): Promise<void> {
    await this.syncBookingCompletionState();
    if (this.bookingCompletedFromBookingsPage || await this.isPersonalDetailsStep()) {
      return;
    }

    await expect.poll(async () =>
      await this.fullNameInput.isVisible().catch(() => false)
      || await this.isPersonalDetailsStep()
      || await this.bookingsHeading.isVisible().catch(() => false),
    { timeout: 60_000 }).toBeTruthy();
    await this.syncBookingCompletionState();
    if (this.bookingCompletedFromBookingsPage || await this.isPersonalDetailsStep()) {
      return;
    }

    await expect(this.fullNameInput).toBeVisible({ timeout: 30_000 });
    if (!(await this.fullNameInput.inputValue()).trim()) {
      await this.fullNameInput.fill('Test Student');
    }
    if (!(await this.emailInput.inputValue()).trim()) {
      await this.emailInput.fill('bhbirla@bestpeers.com');
    }
    if (!(await this.phoneInput.inputValue()).trim()) {
      await this.countryCodeSelect.click();
      await this.countrySearch.fill('India');
      await this.page.getByText('India', { exact: true }).last().click();
      await this.phoneInput.fill('9876543210');
    }
    const emailCommunication = this.page.getByRole('button', { name: 'Email', exact: true }).filter({ visible: true }).last();
    if (await emailCommunication.isVisible().catch(() => false)) {
      await emailCommunication.click();
    }
    await this.nextButton.click();
    await expect.poll(async () =>
      await this.nationalitySelect.isVisible().catch(() => false)
      || await this.continueButton.first().isVisible().catch(() => false)
      || await this.bookingsHeading.isVisible().catch(() => false),
    { timeout: 30_000 }).toBeTruthy();
    await this.syncBookingCompletionState();
  }

  async completePersonalDetails(): Promise<void> {
    await this.syncBookingCompletionState();
    if (this.bookingCompletedFromBookingsPage) {
      return;
    }

    await expect(this.continueButton.first()).toBeVisible({ timeout: 30_000 });

    if (await this.dateOfBirthSelect.isVisible().catch(() => false)) {
      await this.dateOfBirthSelect.click();
      const monthHeader = this.page.getByText(/^[A-Z][a-z]+ \d{4}$/).filter({ visible: true }).last();
      const currentMonth = await monthHeader.innerText();
      const [month, year] = currentMonth.split(' ');
      const previousMonthButton = monthHeader.locator('..').getByRole('button').first();

      for (let index = 0; index < 240; index += 1) {
        await previousMonthButton.click();
      }

      await expect(monthHeader).toHaveText(`${month} ${Number(year) - 20}`);
      await this.page.getByRole('button', { name: '15', exact: true }).filter({ visible: true }).last().click();
    }

    if (await this.nationalitySelect.isVisible().catch(() => false)) {
      await this.selectIndianNationality();
    }

    if (await this.genderSelect.isVisible().catch(() => false)) {
      await this.genderSelect.click();
      await this.page.getByText('Male', { exact: true }).last().click();
    }

    await this.syncBookingCompletionState();
    if (this.bookingCompletedFromBookingsPage) {
      return;
    }

    await expect(this.cityInput).toBeVisible();
    if (!(await this.cityInput.inputValue()).trim()) {
      await this.cityInput.fill('Indore');
    }

    await expect(this.postcodeInput).toBeVisible();
    if (!(await this.postcodeInput.inputValue()).trim()) {
      await this.postcodeInput.fill('452001');
    }

    await expect(this.addressInput).toBeVisible();
    if (!(await this.addressInput.inputValue()).trim()) {
      await this.addressInput.fill('123 Test Street');
    }

    if (await this.countrySelect.isVisible().catch(() => false)) {
      await this.countrySelect.click();
      await this.countrySearch.fill('India');
      await this.page.getByText('India', { exact: true }).last().click();
    }

    await expect(this.cityInput).not.toHaveValue('');
    await expect(this.postcodeInput).not.toHaveValue('');
    await expect(this.addressInput).not.toHaveValue('');
    await expect(this.page.getByText('India', { exact: true }).filter({ visible: true }).last()).toBeVisible();

    await this.continueButton.first().click();
    await expect.poll(async () =>
      await this.courseNameInput.isVisible().catch(() => false)
      || await this.nationalityRequiredError.isVisible().catch(() => false)
      || await this.bookingsHeading.isVisible().catch(() => false),
    { timeout: 30_000 }).toBeTruthy();
    await this.syncBookingCompletionState();
    if (this.bookingCompletedFromBookingsPage) {
      return;
    }

    if (await this.nationalityRequiredError.isVisible().catch(() => false)) {
      await this.selectIndianNationality();
      await this.continueButton.first().click();
    }

    await expect(this.courseNameInput).toBeVisible({ timeout: 30_000 });
  }

  private async selectIndianNationality(): Promise<void> {
    await this.nationalitySelect.click();
    await expect(this.nationalitySearch).toBeVisible();
    await this.nationalitySearch.fill('Indian');
    const indianOption = this.page.getByText('Indian', { exact: true }).filter({ visible: true }).last();
    await expect(indianOption).toBeVisible();
    await indianOption.click();
    await expect(this.nationalitySelect).toBeHidden();
  }

  private async isPersonalDetailsStep(): Promise<boolean> {
    return await this.personalDetailsHeading.isVisible().catch(() => false)
      || await this.completeBookingHeading.isVisible().catch(() => false)
      || await this.nationalitySelect.isVisible().catch(() => false);
  }

  async completeCourseDetails(): Promise<void> {
    await this.syncBookingCompletionState();
    if (this.bookingCompletedFromBookingsPage) {
      return;
    }

    if (await this.courseNameInput.isVisible().catch(() => false)
      && !(await this.courseNameInput.inputValue()).trim()) {
      await this.courseNameInput.fill('world');
    }

    if (await this.studyYearSelect.isVisible().catch(() => false)) {
      await this.studyYearSelect.click();
      await this.page.getByText('4th', { exact: true }).click();
    }

    await this.page.evaluate(() => {
      document.querySelectorAll('iframe').forEach((frame) => {
        if (frame.id.includes('chat-widget')) {
          frame.remove();
        }
      });
    });

    if (await this.moveInDateSelect.getByText('Select date', { exact: true }).isVisible().catch(() => false)) {
      await this.moveInDateSelect.click({ force: true });
      await this.page.getByRole('button', { name: '22', exact: true }).click({ force: true });
    }

    if (await this.courseEndDateSelect.getByText('Select date', { exact: true }).isVisible().catch(() => false)) {
      await this.courseEndDateSelect.click({ force: true });
      await this.page.getByRole('button', { name: '30', exact: true }).click({ force: true });
    }

    await this.continueButton.last().click({ force: true });
    await expect.poll(async () =>
      await this.reviewHeading.isVisible().catch(() => false)
      || await this.payButton.isVisible().catch(() => false)
      || await this.emergencyDetailsHeading.isVisible().catch(() => false)
      || await this.bookingsHeading.isVisible().catch(() => false),
    { timeout: 60_000 }).toBeTruthy();
    await this.syncBookingCompletionState();
  }

  async completeEmergencyDetails(): Promise<void> {
    if (!(await this.emergencyDetailsHeading.isVisible().catch(() => false))) {
      return;
    }

    const emergencyName = this.page.getByText('Emergency Name*', { exact: true }).locator('..').getByRole('textbox');
    const emergencyEmail = this.page.getByText('Emergency Email Address*', { exact: true }).locator('..').getByRole('textbox');
    const emergencyPhone = this.page.getByPlaceholder('Number without country code').filter({ visible: true }).last();
    const emergencyRelationship = this.page.getByText('Emergency Relationship*', { exact: true }).locator('..').getByRole('textbox');
    const emergencyAddress = this.page.getByText('Emergency Address*', { exact: true }).locator('..').getByRole('textbox');
    const emergencyCity = this.page.getByText('Emergency City*', { exact: true }).locator('..').getByRole('textbox');
    const emergencyPostcode = this.page.getByText('Emergency Post Code*', { exact: true }).locator('..').getByRole('textbox');

    await expect(emergencyName).toBeVisible();
    if (!(await emergencyName.inputValue()).trim()) {
      await emergencyName.fill('Test Emergency Contact');
    }
    if (!(await emergencyEmail.inputValue()).trim()) {
      await emergencyEmail.fill('emergency@example.com');
    }
    if (!(await emergencyPhone.inputValue()).trim()) {
      const emergencyCountryCode = this.page.getByText('Country code', { exact: true }).filter({ visible: true }).last();
      if (await emergencyCountryCode.isVisible().catch(() => false)) {
        await emergencyCountryCode.click();
        await this.countrySearch.fill('India');
        await this.page.getByText('India', { exact: true }).last().click();
      }
      await emergencyPhone.fill('9876501234');
    }

    const emergencyDob = this.page.getByText('Select date', { exact: true }).filter({ visible: true }).last();
    if (await emergencyDob.isVisible().catch(() => false)) {
      await emergencyDob.click();
      const monthHeader = this.page.getByText(/^[A-Z][a-z]+ \d{4}$/).filter({ visible: true }).last();
      const currentMonth = await monthHeader.innerText();
      const [month, year] = currentMonth.split(' ');
      const previousMonthButton = monthHeader.locator('..').getByRole('button').first();
      for (let index = 0; index < 240; index += 1) {
        await previousMonthButton.click();
      }
      await expect(monthHeader).toHaveText(`${month} ${Number(year) - 20}`);
      await this.page.getByRole('button', { name: '15', exact: true }).filter({ visible: true }).last().click();
    }

    const emergencyCountry = this.page.getByText('Select country', { exact: true }).filter({ visible: true }).last();
    if (await emergencyCountry.isVisible().catch(() => false)) {
      await emergencyCountry.click();
      await this.countrySearch.fill('India');
      await this.page.getByText('India', { exact: true }).last().click();
    }

    if (!(await emergencyAddress.inputValue()).trim()) {
      await emergencyAddress.fill('456 Emergency Road');
    }
    if (!(await emergencyCity.inputValue()).trim()) {
      await emergencyCity.fill('Bhopal');
    }
    if (!(await emergencyPostcode.inputValue()).trim()) {
      await emergencyPostcode.fill('462001');
    }
    if (!(await emergencyRelationship.inputValue()).trim()) {
      await emergencyRelationship.fill('Parent');
    }

    await expect(this.continueButton.last()).toBeEnabled();
    await this.continueButton.last().click();
    await expect.poll(async () =>
      await this.isPaymentReady()
      || await this.bookingTermsCheckbox.isVisible().catch(() => false)
      || await this.confirmBookingButton.isVisible().catch(() => false)
      || await this.bookingsHeading.isVisible().catch(() => false),
    { timeout: 60_000 }).toBeTruthy();
    await this.syncBookingCompletionState();
  }

  async pay(): Promise<void> {
    await expect(this.payButton).toBeVisible();
    await expect(this.payButton).toBeEnabled();
    await this.payButton.click();
  }

  async expectPaymentReady(): Promise<void> {
    await expect(this.reviewAndPayHeading).toBeVisible({ timeout: 60_000 });
    await expect(this.payButton).toBeVisible();
    await expect(this.page.getByText('Amount payable now', { exact: true }).filter({ visible: true }).first()).toBeVisible();

    if (await this.savedCardOption.isVisible().catch(() => false)) {
      await this.savedCardOption.check();
      await expect(this.savedCardOption).toBeChecked();
    } else {
      await expect(this.addCardButton).toBeVisible();
    }
  }

  async isPaymentReady(): Promise<boolean> {
    return await this.reviewAndPayHeading.isVisible().catch(() => false)
      || await this.payButton.isVisible().catch(() => false);
  }

  async waitForPaymentOrBookingConfirmation(): Promise<'payment' | 'confirmation' | 'completed'> {
    await expect.poll(async () =>
      await this.isPaymentReady()
      || await this.bookingTermsCheckbox.isVisible().catch(() => false)
      || await this.bookingsHeading.isVisible().catch(() => false),
    { timeout: 60_000 }).toBeTruthy();

    await this.syncBookingCompletionState();
    if (this.bookingCompletedFromBookingsPage) {
      return 'completed';
    }
    return await this.isPaymentReady() ? 'payment' : 'confirmation';
  }

  private async syncBookingCompletionState(): Promise<void> {
    if (!this.bookingCompletedFromBookingsPage && await this.bookingsHeading.isVisible().catch(() => false)) {
      await expect(this.page).toHaveURL(/\/mybookings\/?$/i);
      await expect(this.bookingId).toBeVisible();
      this.bookingCompletedFromBookingsPage = true;
    }
  }

  async submitBooking(): Promise<void> {
    if (this.bookingCompletedFromBookingsPage) {
      return;
    }

    await expect(this.reviewHeading).toBeVisible({ timeout: 60_000 });
    await expect(this.bookingTermsCheckbox).toBeVisible();
    await this.bookingTermsCheckbox.check();
    await expect(this.confirmBookingButton).toBeEnabled();
    await this.confirmBookingButton.click();
  }

  async expectBookingSubmitted(): Promise<void> {
    if (this.bookingCompletedFromBookingsPage) {
      await expect(this.bookingsHeading).toBeVisible();
      await expect(this.bookingId).toBeVisible();
      return;
    }

    await expect.poll(async () =>
      await this.page.getByRole('heading', { name: /all set!/i }).isVisible().catch(() => false)
      && await this.page.getByText(/Booking ref ID:\s*B\d+/i).isVisible().catch(() => false),
    { timeout: 60_000 }).toBeTruthy();
  }

  async selectPaymentContract(): Promise<void> {
    await this.page.locator('div').filter({ hasText: 'undefined, undefinedContract' }).nth(5).click();
  }
}
