import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  
  // Login first
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Login")');
  
  await page.waitForTimeout(2000);
  
  // Check steps before trigger
  let steps = await page.$$('.pipeline-dot');
  console.log(`Before trigger: found ${steps.length} steps`);
  for (let i = 0; i < steps.length; i++) {
     const box = await steps[i].boundingBox();
     console.log(`Step ${i+1} visible at`, box);
  }

  // Trigger
  await page.fill('textarea', 'Test triggering pipeline for checking steps');
  await page.click('button:has-text("Trigger Analysis Pipeline")');
  
  console.log("Waiting 8 seconds for completion and reset...");
  await page.waitForTimeout(8000);
  
  // Check steps after
  steps = await page.$$('.pipeline-dot');
  console.log(`After sequence: found ${steps.length} steps`);
  for (let i = 0; i < steps.length; i++) {
     const box = await steps[i].boundingBox();
     console.log(`Step ${i+1} visible at`, box);
  }
  
  await browser.close();
})();
