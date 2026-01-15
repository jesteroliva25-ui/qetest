import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 1920, height: 1080 },
  launchOptions: { args: ['--window-size=1920,1080'] }
});
test.setTimeout(1200000);

test('E2E checkout flow - new user', async ({ page }) => {
 const email = `test_${Date.now()}@mail.com`
 const password = 'password';
  //access page
  await page.goto('https://demo.spreecommerce.org/');

   //signup
  await page.getByRole('button', { name: 'Open account panel' }).click();
  await page.getByRole('link', { name: 'Sign Up' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign Up' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password',exact: true }).fill(password);
  await page.getByRole('textbox', { name: 'Password Confirmation',exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign Up' }).click();
  await page.waitForTimeout(5000);
  await page.waitForSelector('text=Successfully'); // wait for element containing "Welcome"
  await expect(page.locator('text=Successfully')).toBeVisible();

  //logout
  await page.waitForTimeout(5000);
  await page.getByRole('link', { name: 'Open account panel' }).click();
  await page.getByRole('button', { name: 'Log out' }).click();
  await test.step('Check logout success message', async () => {
  await page.waitForSelector('text=Signed out successfully.', { timeout: 10000 });
  await expect(page.getByText('Signed out successfully.', { exact: true })).toBeVisible();
  });
  //login
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('button', { name: 'Open account panel' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('link', { name: 'Open account panel' }).click();
  //await expect(page.getByRole('link', { name: 'Personal details' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

//product select
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.getByLabel('Top').getByRole('link', { name: 'Shop All' }).click()
  ]);
  await expect(page).toHaveURL(/\/products/);

  const firstProduct = page.getByRole('link', { name: /Shirt/i }).first();
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    firstProduct.click()
  ]);

  await page.waitForLoadState('domcontentloaded');
  const productName = (await page.locator('h1').textContent())!.trim();
  await expect(page.getByRole('heading', { name: productName })).toBeVisible();

  const productPriceLocator = page.locator('main').getByText(/\$\d+(\.\d{2})?/).first();
  await expect(productPriceLocator).toBeVisible();
  const productPrice = (await productPriceLocator.textContent())!.trim();

//add to cart
  await page.waitForLoadState('domcontentloaded');
  await page.getByLabel('Please choose Size').click();
  await page.getByRole('menuitem', { name: 'L' }).click();
  await page.getByRole('button', { name: 'Add To Cart' }).click();

//checkout
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.getByRole('link', { name: 'Checkout' }).click()
  ]);
  await expect(page).toHaveURL(/\/checkout/);
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByText(productName)).toBeVisible();
  await expect(page.getByText(productPrice)).toBeVisible();

//shipping details
  await page.getByRole('textbox', { name: 'First name' }).fill('Test');
  await page.getByRole('textbox', { name: 'Last name' }).fill('User');
  await page.getByRole('textbox', { name: 'Street and house number' }).fill('Test Street');
  await page.getByRole('textbox', { name: 'Apartment, suite, etc.' }).fill('Unit 1');
  await page.getByRole('textbox', { name: 'City' }).fill('Las Pinas');
  await page.getByRole('textbox', { name: 'Postal Code' }).fill('1750');
  await page.getByLabel('Country').selectOption('2581');
  const saveAddress = page.getByRole('button', { name: 'Save and Continue' });
  await saveAddress.waitFor({ state: 'visible', timeout: 10000 });
  await expect(saveAddress).toBeEnabled({ timeout: 10000 });
  await saveAddress.click();

//delivery
  await page.getByText('Premium Delivery in 2-3 business days $').click();
  const saveShipping = page.getByRole('button', { name: 'Save and Continue' });
  await expect(saveShipping).toBeEnabled();
  await saveShipping.click();


//cc details
const stripeFrameHandle = await page.waitForSelector('iframe[src*="stripe"]', { timeout: 30000 });
const stripeFrame = await stripeFrameHandle.contentFrame();
if (!stripeFrame) throw new Error('Stripe iframe not found');
await stripeFrame.getByRole('textbox', { name: 'Card number' }).fill('4242 4242 4242 4242');
await stripeFrame.getByRole('textbox', { name: 'MM / YY' }).fill('12 / 34');
await stripeFrame.getByRole('textbox', { name: 'Security code' }).fill('123');
await page.getByRole('button', { name: 'Pay Now' }).click();

  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(10000);
  await page.waitForSelector('text=confirmed'); 
  await expect(page.locator('text=confirmed')).toBeVisible();
  await page.close();
});
