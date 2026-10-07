import { test } from '../fixtures/test.fixture';
import { appendSelectedRoom } from '../utils/selected-room-report';

test('completes the London property booking flow', async ({ loginPage, propertyBookingPage, bookingPaymentPage }) => {
  await propertyBookingPage.handleCookiePopup();
  await loginPage.open();
  await loginPage.loginWithEmailVerification('bhbirla@bestpeers.com');
  await loginPage.expectLoggedIn();

  await propertyBookingPage.openSearch();
  await propertyBookingPage.searchFor('London');
  await propertyBookingPage.expectMultiplePropertiesDisplayed();
  await propertyBookingPage.selectFirstProperty();
  await propertyBookingPage.viewDetailsForSelectedProperty();

  await propertyBookingPage.viewRooms();
  await propertyBookingPage.expectMultipleRoomsDisplayed();
  await propertyBookingPage.selectFirstRoom();
  await propertyBookingPage.viewAndBookSelectedRoom();
  await propertyBookingPage.expectBookingPopupOpened();
  const selectedRoom = await propertyBookingPage.getSelectedRoomDetails();
  appendSelectedRoom({
    testName: test.info().title,
    ...selectedRoom,
  });

  await propertyBookingPage.selectTenure();
  await propertyBookingPage.expectTenureOptionsDisplayed();
  await propertyBookingPage.selectTenureOption('51 weeks (1)');
  await propertyBookingPage.handleCookiePopup();
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