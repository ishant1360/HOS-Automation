import { test } from '../fixtures/test.fixture';

test('select University of Nottingham and complete accommodation booking and payment', async ({
  loginPage, propertyBookingPage, bookingPaymentPage, universityAccommodationPage, }) => {
  await loginPage.open();
  await loginPage.loginWithEmailVerification('bhbirla@bestpeers.com');
  await loginPage.expectLoggedIn();

  await universityAccommodationPage.openHomePage();
  await propertyBookingPage.handleCookiePopup();
  await universityAccommodationPage.openUniversitiesMenu();
  await universityAccommodationPage.selectUniversityOfNottingham();
  await universityAccommodationPage.verifyUniversityDetailsAndAccommodations();

  await propertyBookingPage.selectFirstProperty();
  await propertyBookingPage.expectFirstPropertySummary();
  await propertyBookingPage.viewDetailsForSelectedProperty();
  await propertyBookingPage.expectSelectedPropertyDetails();
  await propertyBookingPage.viewRooms();
  await propertyBookingPage.expectMultipleRoomsDisplayed();
  await propertyBookingPage.selectFirstRoom();
  await propertyBookingPage.viewAndBookSelectedRoom();
  await propertyBookingPage.expectSelectedRoomDetails();
  await propertyBookingPage.selectFirstAvailableTenureOption();
  await propertyBookingPage.bookNow();

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
