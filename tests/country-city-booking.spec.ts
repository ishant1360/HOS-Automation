import { expect, test } from '../fixtures/test.fixture';

test('select country and city then book student accommodation', async ({ page, loginPage, propertyBookingPage, countryCityBookingPage, bookingPaymentPage }) => {
 
  // await page.setViewportSize({ width: 1440, height: 1000 });
  await propertyBookingPage.handleCookiePopup();
  await loginPage.open();
  await loginPage.loginWithEmailVerification('bhbirla@bestpeers.com');
  await loginPage.expectLoggedIn();

  await countryCityBookingPage.openHomePage();
  await countryCityBookingPage.openCountriesMenu();
  await countryCityBookingPage.verifyCountriesDropdownVisible();
  await countryCityBookingPage.selectCountry('United Kingdom');
  await expect(page).toHaveURL(/\/uk(?:\/|$)/i);

  await page.goto('/uk/nottingham/student-accommodation');
  await countryCityBookingPage.verifyNottinghamAccommodationPage();

  await countryCityBookingPage.selectFirstAvailableProperty();
  await countryCityBookingPage.openPropertyDetailsPage();
  await countryCityBookingPage.selectRoomAndOpenBookingModal();
  await countryCityBookingPage.chooseTenure();
  await countryCityBookingPage.clickBookNow();

  const bookingAlreadyCompleted = await bookingPaymentPage.expectBookingDetailsPageOpen();
  if (bookingAlreadyCompleted) {
    await bookingPaymentPage.expectBookingSubmitted();
    return;
  }

  await bookingPaymentPage.completeStartBookingDetails();
  await bookingPaymentPage.completePersonalDetails();
  await bookingPaymentPage.completeCourseDetails();
  await bookingPaymentPage.completeEmergencyDetails();

  const finalStep = await bookingPaymentPage.waitForPaymentOrBookingConfirmation();
  if (finalStep === 'payment') {
    await bookingPaymentPage.expectPaymentReady();
    await bookingPaymentPage.pay();
    await bookingPaymentPage.expectBookingSubmitted();
  } else if (finalStep === 'confirmation') {
    await bookingPaymentPage.submitBooking();
    await bookingPaymentPage.expectBookingSubmitted();
  } else {
    await bookingPaymentPage.expectBookingSubmitted();
  }
});
