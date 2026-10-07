# House of Student Playwright Tests

This guide is for someone setting up the tests for the first time in Visual Studio Code on a Windows laptop. Follow the sections in order. You do not need to install the House of Student website locally; the tests run against the staging website.

## 1. What you need

Before you start, make sure you have:

- A Windows 10 or 11 laptop with an internet connection.
- Access to this project folder.
- **Visual Studio Code** installed from [code.visualstudio.com](https://code.visualstudio.com/).
- **Node.js LTS** installed. Download it from [nodejs.org](https://nodejs.org/). The Node.js installer includes npm.
- The VS Code extension **Playwright Test for VS Code** by Microsoft (recommended). Open Extensions with `Ctrl+Shift+X`, search for the extension name, and install it.
- Access to the House of Student staging site and its test account.
- Access to the staging email inbox used to receive verification codes. The login tests use `bhbirla@bestpeers.com` and read codes from the staging Letter Opener inbox.

The staging site, HTTP authentication, login account, and verification-code inbox are configured in the project. If staging access or the test account is unavailable, ask the project owner; do not replace these settings with production credentials.

## 2. Open the project in Visual Studio Code

1. Start Visual Studio Code.
2. Choose **File > Open Folder...**.
3. Select the project folder (the folder containing `package.json`, `package-lock.json`, and `playwright.config.ts`).
4. If VS Code asks whether you trust the folder, choose **Trust** only if this is the project copy you expect and are authorized to run.
5. Open the VS Code terminal with **Terminal > New Terminal** (`Ctrl+Shift+``). The terminal should start in the project folder.

You can also open the folder from PowerShell:

```powershell
code C:\Users\developer\Downloads\hosAutomation
```

If the `code` command is not recognized, use **File > Open Folder...** instead. If your project is in a different folder, use its path.

## 3. Check Node.js and npm

Run:

```powershell
node --version
npm --version
```

Both commands should print a version number. If PowerShell says a command is not recognized, install or repair Node.js LTS, close and reopen PowerShell, and try again.

## 4. Install the project packages

From the project folder, run:

```powershell
npm ci
```

This installs the exact package versions recorded in `package-lock.json`. Wait for it to finish successfully before continuing.

## 5. Install the Playwright browser

Install the Chromium browser used by this project:

```powershell
npx playwright install chromium
```

If your company network blocks the browser download, ask your IT team to allow the Playwright browser download. Do not copy browser files from an unknown source.

## 6. Check that Playwright sees the tests

List the tests without running them:

```powershell
npx playwright test --list
```

The active Playwright project is `chromium`. The mobile and other browser projects in `playwright.config.ts` are currently commented out, so this setup runs the active Chromium project only.

## 7. Run tests in Visual Studio Code

### Using the Playwright extension

1. Open the **Testing** view from the left sidebar (beaker icon), or press `Ctrl+Shift+P` and run **Testing: Focus on Test Explorer View**.
2. Wait for the extension to discover the tests.
3. Click the run icon beside a test or test file to run only that selection.
4. Use the debug icon beside a test to debug it. Set breakpoints by clicking beside a line number in the editor.

If the extension does not discover tests, open the integrated terminal and run the commands in section 6. Check that the terminal's current directory is the project folder.

### Using the VS Code terminal

Run the full suite:

```powershell
npm test -- --project=chromium
```

Run one test file:

```powershell
npx playwright test tests\country-city-booking.spec.ts --project=chromium
```

Other useful examples:

```powershell
npx playwright test tests\room-payment.spec.ts --project=chromium
npx playwright test tests\booking.spec.ts --project=chromium
```

Run with a visible browser window:

```powershell
npx playwright test tests\country-city-booking.spec.ts --project=chromium --headed
```

Open Playwright's interactive test debugger:

```powershell
npx playwright test tests\country-city-booking.spec.ts --project=chromium --debug
```

The tests share a staging verification-code inbox. The configuration runs one worker to reduce conflicts; do not increase the worker count or run multiple copies of the suite at the same time.

The project uses **Page Object Model (POM)**: test scenarios live in `tests\`, and reusable page locators/actions live in `pages\`. Shared page objects are exposed as fixtures in `fixtures\test.fixture.ts`. When adding a scenario:

1. Put the scenario in an appropriate `tests\*.spec.ts` file.
2. Reuse an existing page object and fixture if it already covers the page or action.
3. If a new page object is needed, create a class in `pages\`, keep its `Page` and `Locator` fields private, and put reusable page actions/assertions in async methods.
4. If tests need the new page object as a fixture, add its type, import, and factory to `fixtures\test.fixture.ts`.
5. In the test, use the fixture rather than recreating locators, use `expect` assertions, and avoid fixed sleeps such as `page.waitForTimeout()`.
6. Run the new test from VS Code's Testing view or with `npx playwright test tests\your-test.spec.ts --project=chromium`.

Example of the project's fixture-based test style:

```ts
import { test } from '../fixtures/test.fixture';

test('opens a property page', async ({ page, propertyBookingPage }) => {
  await page.goto('/');
  await propertyBookingPage.openSearch();
  // Continue with reusable page-object methods and expect assertions.
});
```

Do not copy the example as a complete scenario: use the real methods available in the page object for the scenario you are adding.

## 8. Read the test report

The suite creates an HTML report. After a run, open it with:

```powershell
npx playwright show-report
```

Playwright also saves screenshots, videos, and error context for failed tests under `test-results`. These artifacts show the page state and error at the point of failure. A test can still fail because the staging site, account, inbox, network, or available property data is unavailable; a successful setup cannot guarantee every run will pass.

## 9. Payment and cancellation safety

Some accommodation tests continue from booking details to the payment step, and the room-payment test clicks the payment button and checks for booking confirmation. Run those flows only when the staging environment is configured for sandbox/test payments and uses disposable test data. Never enter real card details or use production data for a test.

The Booking-list cancellation and payment-action tests are skipped unless a disposable sandbox booking is explicitly configured. Only set these PowerShell environment variables when the booking is safe to modify:

```powershell
$env:HOS_SANDBOX_BOOKING_ID = "YOUR_DISPOSABLE_SANDBOX_BOOKING_ID"
$env:HOS_ALLOW_DESTRUCTIVE_BOOKING_TESTS = "true"
npx playwright test tests\booking.spec.ts --project=chromium
```

Replace the example ID with a real disposable **sandbox** booking ID supplied by the project owner. These variables apply only to the current PowerShell window. To clear them:

```powershell
Remove-Item Env:HOS_SANDBOX_BOOKING_ID -ErrorAction SilentlyContinue
Remove-Item Env:HOS_ALLOW_DESTRUCTIVE_BOOKING_TESTS -ErrorAction SilentlyContinue
```

Leave the variables unset for normal read-only Booking tests. Do not use a student's or customer's booking.

## 10. Common setup problems

### `node` or `npm` is not recognized

Install Node.js LTS, close and reopen PowerShell, and retry the version commands in section 3.

### The browser executable is missing

Run `npx playwright install chromium` from the project folder.

### `npm ci` fails

Check your internet connection and confirm that PowerShell is in the project folder containing `package.json` and `package-lock.json`. If the error mentions access denied or a corporate proxy, ask your IT team for help rather than deleting project files.

### Login or verification-code tests fail

Confirm staging and the test email inbox are available and that you have authorization to use the configured test account. Run one test process at a time because the inbox is shared. Check the report and `test-results` before retrying.

### A test fails at payment

Check that staging is configured for sandbox payment and inspect the failure screenshot and error context. Do not retry with real payment details.

## Project layout

- `tests\` — Playwright test scenarios.
- `pages\` — reusable page objects and browser interactions.
- `fixtures\` — shared test fixtures, including login and page objects.
- `playwright.config.ts` — test projects, staging URL, browser settings, and report configuration.
