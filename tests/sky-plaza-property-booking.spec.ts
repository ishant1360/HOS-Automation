import { expect, test } from '../fixtures/test.fixture';

test('verify Sky Plaza details and book an available room', async ({
  loginPage, bookingPaymentPage, skyPlazaBookingPage, propertyBookingPage, }) => {
  await propertyBookingPage.handleCookiePopup();
  await loginPage.open();
  await loginPage.loginWithEmailVerification('bhbirla@bestpeers.com');
  await loginPage.expectLoggedIn();

  await skyPlazaBookingPage.openPropertyPage();
  await skyPlazaBookingPage.verifyPropertyDetails();
  await skyPlazaBookingPage.viewAvailableRooms();
  await skyPlazaBookingPage.selectAvailableRoom();
  await skyPlazaBookingPage.selectFirstAvailableTenure();
  await skyPlazaBookingPage.startBooking();

  const bookingCompletedDirectly = await bookingPaymentPage.expectBookingDetailsPageOpen();
  if (bookingCompletedDirectly) {
    await bookingPaymentPage.expectPropertyBookingListed('Sky Plaza, Leeds');
    await bookingPaymentPage.expectBookingSubmitted();
    return;
  }

  await bookingPaymentPage.completeStartBookingDetails();
  await bookingPaymentPage.completePersonalDetails();
  await bookingPaymentPage.completeCourseDetails();
  await bookingPaymentPage.completeEmergencyDetails();
  await bookingPaymentPage.submitBooking();
  await bookingPaymentPage.expectBookingSubmitted();
});
