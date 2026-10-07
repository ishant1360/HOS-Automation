import type { BrowserContext } from '@playwright/test';
import { test as base } from './test.fixture';
import { LoginPage } from '../pages/login.page';

type BookingWorkerFixtures = {
  bookingAuthState: Awaited<ReturnType<BrowserContext['storageState']>>;
};

const baseURL = 'https://stagingdev.houseofstudent.com';
const bookingEmail = 'bhbirla@bestpeers.com';

export const test = base.extend<{}, BookingWorkerFixtures>({
  bookingAuthState: [async ({ browser }, use) => {
    const authContext: BrowserContext = await browser.newContext({
      baseURL,
      httpCredentials: { username: 'hos', password: 'hos' },
    });
    try {
      const authPage = await authContext.newPage();
      const loginPage = new LoginPage(authPage);
      await loginPage.open();
      await loginPage.loginWithEmailVerification(bookingEmail);
      await loginPage.expectLoggedIn();
      await use(await authContext.storageState());
    } finally {
      await authContext.close();
    }
  }, { scope: 'worker' }],
  storageState: async ({ bookingAuthState }, use) => {
    await use(bookingAuthState);
  },
});
