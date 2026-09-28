#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const [, , inputArg, outputArg] = process.argv;
if (!inputArg || !outputArg) {
  console.error('Usage: node news/blog/export_news_blog.js <news.json> <output.md>');
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

if (data.category !== 'BYCHEM 뉴스') {
  throw new Error('News blog export requires category: BYCHEM 뉴스');
}
if (!data.blog) {
  console.log('No blog object; skipping news blog export.');
  process.exit(2);
}
if (typeof data.blog.title !== 'string' || !data.blog.title.trim()) {
  throw new Error('blog.title is required');
}
if (typeof data.blog.body !== 'string' || !data.blog.body.trim()) {
  throw new Error('blog.body is required');
}
if (!Array.isArray(data.blog.tags) || data.blog.tags.length === 0) {
  throw new Error('blog.tags must be a non-empty array');
}

const tags = data.blog.tags
  .map((tag) => String(tag).trim())
  .filter(Boolean)
  .join(' ');

const md = [
  '# ' + data.blog.title.trim(),
  '',
  '- 카테고리: BYCHEM 뉴스',
  '- 원본 뉴스 입력: ' + path.basename(inputPath),
  '',
  data.blog.body.trim(),
  '',
  '## 태그',
  '',
  tags,
  ''
].join('\n');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, md, 'utf8');
console.log('Exported ' + outputPath);
