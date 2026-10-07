import { test } from '../fixtures/test.fixture';
import { appendSelectedRoom } from '../utils/selected-room-report';

test('completes the room booking and sandbox payment', async ({ page, propertyBookingPage, bookingPaymentPage }) => {
  await page.goto('/');
  await propertyBookingPage.handleCookiePopup();
  await propertyBookingPage.openSearch();
  await propertyBookingPage.searchFor('London');
  await propertyBookingPage.expectMultiplePropertiesDisplayed();
  await propertyBookingPage.selectFirstProperty();
  await propertyBookingPage.viewDetailsForSelectedProperty();
  await propertyBookingPage.viewRooms();
  await propertyBookingPage.expectMultipleRoomsDisplayed();
  await propertyBookingPage.selectFirstRoom();
  await propertyBookingPage.viewAndBookSelectedRoom();
  await propertyBookingPage.handleCookiePopup();
  await propertyBookingPage.expectBookingPopupOpened();
  const selectedRoom = await propertyBookingPage.getSelectedRoomDetails();
  appendSelectedRoom({
    testName: test.info().title,
    ...selectedRoom,
  });
  await propertyBookingPage.selectFirstAvailableTenureOption();
  await propertyBookingPage.handleCookiePopup();
  await propertyBookingPage.bookNow();

  await bookingPaymentPage.expectBookingDetailsPageOpen();
  await bookingPaymentPage.completeStartBookingDetails();
  await bookingPaymentPage.completePersonalDetails();
  await bookingPaymentPage.completeCourseDetails();
  await bookingPaymentPage.completeEmergencyDetails();
  await bookingPaymentPage.expectPaymentReady();
  await bookingPaymentPage.pay();
  await bookingPaymentPage.expectBookingSubmitted();

});
