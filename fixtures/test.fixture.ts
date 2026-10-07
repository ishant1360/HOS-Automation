import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { PropertyBookingPage } from '../pages/property-booking.page';
import { BookingPaymentPage } from '../pages/booking-payment.page';
import { WishlistPage } from '../pages/wishlist.page';
import { CountryCityBookingPage } from '../pages/country-city-booking.page';
import { SkyPlazaBookingPage } from '../pages/sky-plaza-booking.page';
import { UniversityAccommodationPage } from '../pages/university-accommodation.page';
import { BookingPage } from '../pages/bookingPage';
import { LogoutPage } from '../pages/logout.page';

type TestFixtures = {
  loginPage: LoginPage;
  propertyBookingPage: PropertyBookingPage;
  bookingPaymentPage: BookingPaymentPage;
  wishlistPage: WishlistPage;
  countryCityBookingPage: CountryCityBookingPage;
  skyPlazaBookingPage: SkyPlazaBookingPage;
  universityAccommodationPage: UniversityAccommodationPage;
  bookingPage: BookingPage;
  logoutPage: LogoutPage;
};

base.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = '#chat-widget-container, #chat-widget, #chat-widget-minimized { display: none !important; }';
    document.documentElement.appendChild(style);
  });
});

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  propertyBookingPage: async ({ page }, use) => {
    await use(new PropertyBookingPage(page));
  },
  bookingPaymentPage: async ({ page }, use) => {
    await use(new BookingPaymentPage(page));
  },
  
  wishlistPage: async ({ page }, use) => {
    await use(new WishlistPage(page));
  },

  countryCityBookingPage: async ({ page }, use) => {
    await use(new CountryCityBookingPage(page));
  },
  
  skyPlazaBookingPage: async ({ page }, use) => {
    await use(new SkyPlazaBookingPage(page));
  },

  universityAccommodationPage: async ({ page }, use) => {
    await use(new UniversityAccommodationPage(page));
  },

  bookingPage: async ({ page }, use) => {
    await use(new BookingPage(page));
  },

  logoutPage: async ({ page }, use) => {
    await use(new LogoutPage(page));
  },

});


export { expect } from '@playwright/test';