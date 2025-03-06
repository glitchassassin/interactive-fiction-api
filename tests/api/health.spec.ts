import { test, expect } from '@playwright/test';

test('Health endpoint returns OK', async ({ request }) => {
  const response = await request.get('http://localhost:3000/health');
  
  expect(response.ok()).toBeTruthy();
  
  const body = await response.json();
  expect(body).toHaveProperty('status', 'ok');
}); 