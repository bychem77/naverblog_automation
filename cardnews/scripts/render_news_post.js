#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const [, , inputArg, outputArg] = process.argv;
if (!inputArg || !outputArg) {
  console.error('Usage: node scripts/render_news_post.js <news.json> <output.png>');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '../..');
const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

if (data.category !== 'BYCHEM 뉴스') {
  throw new Error('Instagram news posts require category: BYCHEM 뉴스');
}
if (typeof data.title !== 'string' || !data.title.trim()) {
  throw new Error('A non-empty title is required');
}
if (data.subtitle != null && typeof data.subtitle !== 'string') {
  throw new Error('subtitle must be a string');
}
if (typeof data.image !== 'string' || !data.image.trim()) {
  throw new Error('An approved local image path is required');
}
if (path.isAbsolute(data.image) || /^https?:\/\//i.test(data.image)) {
  throw new Error('image must be a repository-relative path');
}

const imagePath = path.resolve(repoRoot, data.image);
if (!imagePath.startsWith(repoRoot + path.sep) || !/\.(png|jpe?g|webp)$/i.test(imagePath) || !fs.statSync(imagePath, { throwIfNoEntry: false })?.isFile()) {
  throw new Error(`Approved image file not found within repository: ${data.image}`);
}

async function main() {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../templates/news_post.html')).href, { waitUntil: 'load' });
    await page.evaluate((payload) => window.renderNewsPost(payload), {
      title: data.title.trim(),
      subtitle: data.subtitle?.trim() || '',
      imageUrl: pathToFileURL(imagePath).href
    });
    await page.locator('.brand').evaluate((image) => image.decode());
    await page.locator('#post').screenshot({ path: outputPath, animations: 'disabled' });
    console.log(`Rendered ${outputPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

