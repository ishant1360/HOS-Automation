import { test } from '../fixtures/test.fixture';

// test.describe.configure({ mode: "serial" });

test('opens the login screen', async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.expectLoginScreenOpen();
});

test('logs in with the email verification code', async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.loginWithEmailVerification('bhbirla@bestpeers.com');
  await loginPage.expectLoggedIn();
});
