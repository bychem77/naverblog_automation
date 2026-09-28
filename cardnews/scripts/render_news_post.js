#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const sharp = require('sharp');

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
if (
  !imagePath.startsWith(repoRoot + path.sep) ||
  !/\.(png|jpe?g|webp)$/i.test(imagePath) ||
  !fs.statSync(imagePath, { throwIfNoEntry: false })?.isFile()
) {
  throw new Error(`Approved image file not found within repository: ${data.image}`);
}

function getDateLabel(inputPath) {
  const fileName = path.basename(inputPath);
  const match = fileName.match(/^(\d{4})-(\d{2})-\d{2}/);
  if (!match) return '';

  const monthLabels = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE',
    'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'
  ];

  const monthIndex = Number(match[2]) - 1;
  return `${match[1]} ${monthLabels[monthIndex] || ''}`.trim();
}

async function normalizeImage(sourcePath) {
  const normalizedPath = path.join(
    os.tmpdir(),
    `bychem-news-${process.pid}-${Date.now()}.jpg`
  );

  await sharp(sourcePath, { failOn: 'none' })
    .rotate()
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(normalizedPath);

  const metadata = await sharp(normalizedPath).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (!width || !height) {
    throw new Error('Unable to read approved image dimensions after normalization');
  }

  return {
    normalizedPath,
    orientation: height > width ? 'portrait' : 'landscape'
  };
}

async function decodeImage(page, selector) {
  await page.locator(selector).evaluate(async (image) => {
    if (!image.complete || image.naturalWidth === 0) {
      await new Promise((resolve, reject) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', reject, { once: true });
      });
    }
    if (typeof image.decode === 'function') {
      await image.decode();
    }
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error('Decoded image has invalid dimensions');
    }
  });
}

async function main() {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const { normalizedPath, orientation } = await normalizeImage(imagePath);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1080, height: 1350 },
      deviceScaleFactor: 1
    });

    await page.goto(
      pathToFileURL(path.resolve(__dirname, '../templates/news_post.html')).href,
      { waitUntil: 'load' }
    );

    const normalizedUrl = pathToFileURL(normalizedPath).href;

    await page.evaluate((payload) => window.renderNewsPost(payload), {
      title: data.title.trim(),
      subtitle: data.subtitle?.trim() || '',
      imageUrl: normalizedUrl,
      orientation,
      dateLabel: getDateLabel(inputPath)
    });

    await decodeImage(page, '#background');
    await decodeImage(page, '#photo');
    await decodeImage(page, '.brand');
    await page.evaluate(() => document.fonts.ready);

    await page.locator('#post').screenshot({
      path: outputPath,
      animations: 'disabled'
    });

    console.log(`Rendered ${outputPath} (${orientation})`);
  } finally {
    await browser.close();
    fs.rmSync(normalizedPath, { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
