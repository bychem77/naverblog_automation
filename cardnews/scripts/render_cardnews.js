#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const [, , jsonArg, outputArg] = process.argv;
if (!jsonArg || !outputArg) {
  console.error('Usage: node scripts/render_cardnews.js <cards.json> <output-directory>');
  process.exit(1);
}

const jsonPath = path.resolve(jsonArg);
const outputDir = path.resolve(outputArg);
const templatePath = path.resolve(__dirname, '../templates/card.html');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

if (!data.cover || !Array.isArray(data.slides) || data.slides.length !== 4 || !data.outro) {
  throw new Error(`Expected cover, exactly 4 slides, and outro in ${jsonPath}`);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(templatePath).href, { waitUntil: 'load' });
  await page.evaluate(async () => document.fonts.ready);

  const jobs = [
    { type: 'cover', index: 0, name: '01_cover.png' },
    ...data.slides.map((_, index) => ({ type: 'content', index, name: `${String(index + 2).padStart(2, '0')}_content.png` })),
    { type: 'outro', index: 0, name: '06_outro.png' }
  ];

  for (const job of jobs) {
    await page.evaluate(({ type, index, payload }) => window.renderCard(type, index, payload), { ...job, payload: data });
    await page.locator('.bg').evaluate((image) => image.decode());
    await page.evaluate(async () => document.fonts.ready);
    await page.locator('#card').screenshot({ path: path.join(outputDir, job.name), animations: 'disabled' });
  }

  await browser.close();
  const copiedJsonPath = path.join(outputDir, 'cardnews.json');
  if (path.resolve(jsonPath) !== path.resolve(copiedJsonPath)) fs.copyFileSync(jsonPath, copiedJsonPath);
  console.log(`Rendered 6 PNG files in ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
