import { test as setup, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { testUsers } from './fixtures/test-data';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.goto();
  await loginPage.login(testUsers.admin.email, testUsers.admin.password);
  
  // Verify we're logged in
  await expect(page).toHaveURL(/.*dashboard/);
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});