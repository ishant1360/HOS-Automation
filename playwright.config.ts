import { defineConfig, devices } from '@playwright/test';

declare const process: {
  env: {
    CI?: string;
  };
};
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',

  timeout: 60 * 60 * 1000,

    expect: {
        timeout: 30 * 1000
    },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Run tests one at a time because they share the staging login mailbox. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'https://stagingdev.houseofstudent.com',
    httpCredentials: {
      username: 'hos',
      password: 'hos',
    },

     actionTimeout: 2 * 60 * 1000,
     navigationTimeout: 2 * 60 * 1000,
      /* Tracing causes EBUSY locks on the Windows headed Chrome run. */
      trace: 'off',
   
    screenshot: 'only-on-failure',
  
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        viewport: null,
        launchOptions: {
          args: ['--start-maximized'],
        },
      },
    },

    // {
    //   name: 'mobile-chromium',
    //   testMatch: '**/booking.spec.ts',
    //   use: {
    //     ...devices['Pixel 7'],
    //   },
    // },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    //  {
    //         name: 'Android Chrome',

    //         use: {
    //             ...devices['Pixel 5'],
    //         },
    //     },

    //  {
    //     name: 'iPhone Safari',
    //     use: {
    //         ...devices['iPhone 13'],
    //     },
    // },


    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
