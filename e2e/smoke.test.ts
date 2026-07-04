import { test, expect } from '@playwright/test';

test.describe('Capture → Canvas smoke test', () => {
  test('POST /api/cards creates a card visible in search', async ({ request }) => {
    // 1. Create a card via API
    const formData = new FormData();
    formData.append('body', 'Playwright e2e 测试灵感');
    formData.append('sourceUrl', 'https://example.com/test');
    formData.append('userNote', '这是一条自动化测试');

    const createRes = await request.post('/api/cards', {
      multipart: formData,
    });
    expect(createRes.status()).toBe(201);

    const { id } = await createRes.json();
    expect(id).toBeDefined();

    // 2. Fetch the created card
    const getRes = await request.get(`/api/cards/${id}`);
    expect(getRes.status()).toBe(200);
    const { card, body } = await getRes.json();
    expect(card.user_note).toBe('这是一条自动化测试');
    expect(body).toBe('Playwright e2e 测试灵感');

    // 3. Search for all cards — the new card should appear
    const searchRes = await request.get('/api/search');
    expect(searchRes.status()).toBe(200);
    const cards = await searchRes.json();
    const found = cards.find((c: { id: string }) => c.id === id);
    expect(found).toBeDefined();

    // 4. Verify source URL was stored
    expect(card.source.url).toBe('https://example.com/test');
  });

  test('Capture page renders', async ({ page }) => {
    await page.goto('/capture');
    await expect(page.locator('textarea').first()).toBeVisible();
    await expect(page.getByPlaceholder('贴入 URL、文字、截图，或上传任意文件')).toBeVisible();
    await expect(page.getByRole('button', { name: /保存/ })).toBeVisible();
  });

  test('Canvas page renders with empty or card state', async ({ page }) => {
    await page.goto('/canvas');
    // Either shows "暂无灵感" (empty) or renders the ReactFlow canvas
    await expect(page.locator('text=暂无灵感').or(page.locator('.react-flow'))).toBeVisible();
  });
});
