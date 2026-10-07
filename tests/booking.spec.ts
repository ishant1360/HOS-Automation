import { test } from '../fixtures/booking.fixture';

const sandboxBookingId = process.env.HOS_SANDBOX_BOOKING_ID;
const destructiveBookingTestsEnabled = process.env.HOS_ALLOW_DESTRUCTIVE_BOOKING_TESTS === 'true';

test('TEST 1 - open Booking from the sidebar', async ({ page, loginPage, bookingPage }) => {
  await page.goto('/');
  await loginPage.expectLoggedIn();

  await bookingPage.openFromSidebar();
  await bookingPage.expectBookingPageDisplayed();
});

test('TEST 2 - verify booking list records and actions', async ({ page, loginPage, bookingPage }) => {
  await page.goto('/');
  await loginPage.expectLoggedIn();

  await bookingPage.openFromSidebar();
  await bookingPage.expectBookingPageDisplayed();
  await bookingPage.expectBookingRecordDetails();
  await bookingPage.expectBookingActionsDisplayed();
});

test('TEST 3 - view a booking and verify room, tenancy, payment, and booking details', async ({ page, loginPage, bookingPage }) => {
  await page.goto('/');
  await loginPage.expectLoggedIn();

  await bookingPage.openFromSidebar();
  const booking = await bookingPage.viewBooking();
  await bookingPage.expectBookingDetails(booking);
});

test('TEST 4 - open a booking payment ledger', async ({ page, loginPage, bookingPage }) => {
  await page.goto('/');
  await loginPage.expectLoggedIn();

  await bookingPage.openFromSidebar();
  const booking = await bookingPage.openPaymentLedger();
  await bookingPage.expectPaymentLedger(booking);
});

test('TEST 5 - cancel a sandbox booking', async ({ page, loginPage, bookingPage }) => {
  test.skip(
    !sandboxBookingId || !destructiveBookingTestsEnabled,
    'Set HOS_SANDBOX_BOOKING_ID and HOS_ALLOW_DESTRUCTIVE_BOOKING_TESTS=true only for a disposable sandbox booking.',
  );
  const bookingId = sandboxBookingId ?? '';

  await page.goto('/');
  await loginPage.expectLoggedIn();

  await bookingPage.openFromSidebar();
  await bookingPage.openSandboxBooking(bookingId);
  await bookingPage.cancelSandboxBooking(bookingId);
});

test('TEST 6 - complete the safe payment selection flow for a sandbox booking', async ({
  page,
  loginPage,
  bookingPage,
}) => {
  test.skip(
    !sandboxBookingId || !destructiveBookingTestsEnabled,
    'Set HOS_SANDBOX_BOOKING_ID and HOS_ALLOW_DESTRUCTIVE_BOOKING_TESTS=true only for a disposable sandbox booking.',
  );
  const bookingId = sandboxBookingId ?? '';

  await page.goto('/');
  await loginPage.expectLoggedIn();

  await bookingPage.openFromSidebar();
  await bookingPage.openSandboxBooking(bookingId);
  await bookingPage.openCompletePayment(bookingId);
  await bookingPage.expectPaymentPageReadyWithoutSubmitting();
});

test('TEST 7 - navigate away from Booking and open it again', async ({ page, loginPage, bookingPage }) => {
  await page.goto('/');
  await loginPage.expectLoggedIn();

  await bookingPage.openFromSidebar();
  await bookingPage.expectBookingPageDisplayed();
  await bookingPage.goBackFromBookings();
  await bookingPage.openFromSidebar();
  await bookingPage.expectBookingPageDisplayed();
});

test('TEST 8 - log out from the application', async ({ page, loginPage, logoutPage }) => {
  await page.goto('/');
  await loginPage.expectLoggedIn();
  await logoutPage.logoutIfLoggedIn();
});
