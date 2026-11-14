import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const fixtures: Record<string, string> = {
  '/api/0/info': 'info.json',
  '/api/0/settings': 'settings.json',
  '/api/0/buckets': 'buckets.json',
  '/api/0/buckets/aw-watcher-window_fixture-host': 'bucket.json',
  '/api/0/buckets/aw-watcher-window_fixture-host/events': 'events.json',
  '/api/0/buckets/aw-watcher-window_fixture-host/events/count': 'count.json',
};

test('inspect a recorded bucket', async ({ page }) => {
  const unexpected: string[] = [];
  await page.route('**/api/0/**', async route => {
    const path = new URL(route.request().url()).pathname.replace(/\/$/, '');
    const fixture = fixtures[path];
    if (route.request().method() !== 'GET' || !fixture) {
      unexpected.push(`${route.request().method()} ${path}`);
      await route.abort();
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: readFileSync(join('fork/e2e/fixtures', fixture), 'utf8') });
  });
  await page.goto('/#/buckets');
  await expect(page.getByText('fixture-host', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: /aw-watcher-window_fixture-host/ }).click();
  await expect(page.getByText('currentwindow', { exact: true })).toBeVisible();
  await expect(page.getByText('aw-watcher-window', { exact: true })).toBeVisible();
  expect(unexpected).toEqual([]);
});
