import { test, expect } from '@playwright/test'

test('homepage shows heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /welcome to codex bootstrap/i })).toBeVisible()
})
